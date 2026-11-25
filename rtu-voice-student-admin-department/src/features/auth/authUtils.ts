import "server-only";

import { randomInt, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendRegistrationEmail, sendResetPasswordEmail } from "@/lib/email/otp-email";
import { str } from "@/features/shared/sharedUtils";
import { PURPOSE, type Purpose, type verifyState } from "./authTypes";

// `str` now lives only in sharedUtils; re-exported so existing imports from here keep working.
export { str };

/* ------------------------------------------------------------------ */
/* Constants & small helpers (not exported -> not public endpoints)    */
/* ------------------------------------------------------------------ */

const RTU_DOMAIN = "rtu.edu.ph";
const RESEND_COOLDOWN_MS = 60_000;          // 60 seconds between codes
const MAX_OTPS_PER_DAY = 5;                 // per email + purpose, rolling 24h
const MAX_OTP_ATTEMPTS = 3;
const RESET_TOKEN_TTL_MS = 10 * 60 * 1000;  // 10 minutes
const MIN_PASSWORD_LENGTH = 8;
export const RESET_COOKIE = "pw_reset";

export function isRtuEmail(email: string) {
    const parts = email.split("@");
    return parts.length === 2 && parts[0].length > 0 && parts[1] === RTU_DOMAIN;
}

export function validatePassword(password: string): string | null {
    if (!password) return "Please enter your password.";
    if (password.length < MIN_PASSWORD_LENGTH) {
        return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }

    // Character requirement validation
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasDigit = /\d/.test(password);

    if (!hasLowercase) {
        return "Password must contain at least one lowercase letter.";
    }
    if (!hasUppercase) {
        return "Password must contain at least one uppercase letter.";
    }
    if (!hasDigit) {
        return "Password must contain at least one digit.";
    }

    return null;
}


/** true / false, or null if the database call failed */
export async function emailIsRegistered(email: string): Promise<boolean | null> {
    const supabase = await createAdminClient();
    const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("rtu_email", email)
        .maybeSingle();

    if (error) {
        console.error("[emailIsRegistered]", error);
        return null;
    }
    return !!data;
}

/* ---- HMAC helpers (signed reset cookie + OTP hashing) ---- */

function secret() {
    const s = process.env.AUTH_COOKIE_SECRET;
    if (!s) throw new Error("AUTH_COOKIE_SECRET is not set");
    return s;
}

function safeEqual(a: string, b: string) {
    const x = Buffer.from(a);
    const y = Buffer.from(b);
    return x.length === y.length && timingSafeEqual(x, y);
}

/* ---- signed, short-lived "OTP verified" cookie for password reset ---- */

export function sign(value: string) {
    return createHmac("sha256", secret()).update(value).digest("hex");
}

export async function setResetToken(email: string) {
    const payload = Buffer.from(
        JSON.stringify({ email, exp: Date.now() + RESET_TOKEN_TTL_MS })
    ).toString("base64url");

    (await cookies()).set(RESET_COOKIE, `${payload}.${sign(payload)}`, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: RESET_TOKEN_TTL_MS / 1000,
    });
}

export async function readResetToken(): Promise<string | null> {
    const raw = (await cookies()).get(RESET_COOKIE)?.value;
    if (!raw) return null;

    const [payload, sig] = raw.split(".");
    if (!payload || !sig) return null;

    if (!safeEqual(sig, sign(payload))) return null;

    try {
        const { email, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
        if (typeof email !== "string" || typeof exp !== "number" || Date.now() > exp) return null;
        return email;
    } catch {
        return null;
    }
}

/* ------------------------------------------------------------------ */
/* OTP core: generate, hash, issue + check                             */
/* ------------------------------------------------------------------ */

// one random draw, zero-padded (no loop, no async needed)
export function generateOtp(length: number = 6): string {
    return randomInt(0, 10 ** length).toString().padStart(length, "0");
}

// Keyed hash bound to email + purpose, so a stored hash can't be brute-forced
// without the secret and can't be replayed for another email or flow.
// (The "otp:" prefix keeps these inputs disjoint from the reset-cookie payloads,
// which are base64url and can never contain ":".)
export function hashOtp(otp: string, email: string, purpose: Purpose): string {
    return createHmac("sha256", secret())
        .update(`otp:${PURPOSE[purpose]}:${email}:${otp}`)
        .digest("hex");
}

// enforces cooldown + daily cap, stores a hashed OTP, invalidates older ones, emails the code
export async function issueOtp(firstName: string, email: string, purpose: Purpose): Promise<{ success: boolean; message: string }> {
    const supabase = await createAdminClient();
    const purposeId = PURPOSE[purpose];
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: recent, error: recentError } = await supabase
        .from("otp_verifications")
        .select("id, created_at")
        .eq("email", email)
        .eq("purpose_id", purposeId)
        .gte("created_at", since)
        .order("created_at", { ascending: false });

    if (recentError || !recent) {
        console.error("[issueOtp] fetch failed:", recentError);
        return { success: false, message: "Something went wrong. Please try again." };
    }

    if (recent.length >= MAX_OTPS_PER_DAY) {
        return { success: false, message: "Too many code requests. Please try again in 24 hours." };
    }

    if (recent.length > 0) {
        const elapsed = Date.now() - new Date(recent[0].created_at).getTime(); // milliseconds
        if (elapsed < RESEND_COOLDOWN_MS) {
            const wait = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
            return { success: false, message: `Please wait ${wait}s before requesting another code.` };
        }
    }

    const otpCode = generateOtp();

    const { error: insertError } = await supabase.from("otp_verifications").insert({
        email,
        hashed_code: hashOtp(otpCode, email, purpose),
        purpose_id: purposeId,
        attempts: 0,
    });
    if (insertError) {
        console.error("[issueOtp] insert failed:", insertError);
        return { success: false, message: "Couldn't generate a code. Please try again." };
    }

    // The new code is already stored, so invalidating the old ones and sending the email are independent: run them together.
    const invalidateOld = async () => {
        if (recent.length === 0) return;
        const { error } = await supabase
            .from("otp_verifications")
            .update({ expires_at: new Date().toISOString() })
            .in("id", recent.map((r) => r.id));
        if (error) console.error("[issueOtp] invalidate failed:", error);
    };

    const [, result] = await Promise.all([
        invalidateOld(),
        purpose === "registration"
            ? sendRegistrationEmail(email, otpCode, firstName)
            : sendResetPasswordEmail(email, otpCode, firstName),
    ]);

    if (!result.success) {
        return { success: false, message: "Failed to send the email. Please try again." };
    }

    return { success: true, message: "" };
}

// validates the 6 digits against the latest code and consumes it (single use)
export async function checkOtp(formData: FormData, email: string, purpose: Purpose): Promise<verifyState> {
    const keys = ["first_digit", "second_digit", "third_digit", "fourth_digit", "fifth_digit", "sixth_digit"];
    const digits = keys.map((k) => str(formData.get(k)).trim());

    if (!digits.every((d) => /^\d$/.test(d))) {
        return { success: false, message: "Please enter the 6-digit code." };
    }
    const code = digits.join("");

    const supabase = await createAdminClient();

    const { data: otpData, error } = await supabase
        .from("otp_verifications")
        .select("id, hashed_code, attempts, expires_at")
        .eq("email", email)
        .eq("purpose_id", PURPOSE[purpose])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error("[checkOtp] fetch failed:", error);
        return { success: false, message: "Something went wrong. Please try again." };
    }
    if (!otpData) {
        return { success: false, message: "No active code. Please request a new one." };
    }
    if (otpData.attempts >= MAX_OTP_ATTEMPTS) {
        return { success: false, message: "Too many incorrect attempts. Please request a new code." };
    }
    if (Date.now() > new Date(otpData.expires_at).getTime()) {
        return { success: false, message: "Code expired. Please request a new one." };
    }

    // The comparison is instant (HMAC), so do it first and then make ONE guarded write.
    // The write only lands if `attempts` is still what we read and the code is still unexpired
    // (compare-and-set), so parallel requests can't all get a "free" guess, and a correct code
    // can't be consumed twice. Success also bumps `attempts`, which is what makes a racing
    // second request fail the guard.
    const matches = safeEqual(hashOtp(code, email, purpose), otpData.hashed_code);
    const used = otpData.attempts + 1;
    const nowIso = new Date().toISOString();

    const { data: claimed, error: claimError } = await supabase
        .from("otp_verifications")
        .update(matches ? { attempts: used, expires_at: nowIso } : { attempts: used })
        .eq("id", otpData.id)
        .eq("attempts", otpData.attempts)
        .gt("expires_at", nowIso)
        .select("id");

    if (claimError) {
        console.error("[checkOtp] update failed:", claimError);
        return { success: false, message: "Something went wrong. Please try again." };
    }
    if (!claimed || claimed.length === 0) {
        // lost a race with a parallel request, or the code expired in between
        return { success: false, message: "Please try again." };
    }

    if (!matches) {
        const left = MAX_OTP_ATTEMPTS - used;
        return {
            success: false,
            message: left > 0
                ? `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.`
                : "Incorrect code. Please request a new one.",
        };
    }

    return { success: true, message: "OTP matched." };
}

export function friendlyAuthError(error: { code?: string; status?: number; message?: string }): string {
    switch (error.code) {
        case "invalid_credentials":
            return "Incorrect email or password."; // same message for a wrong email or a wrong password, on purpose
        case "email_not_confirmed":
            return "Please verify your email before logging in.";
        case "user_banned":
            return "This account has been deactivated. Please contact the administrator.";
        case "over_request_rate_limit":
            return "Too many attempts. Please wait a moment and try again.";
        default:
            if (error.status === 429) return "Too many attempts. Please wait a moment and try again.";
            console.error("[validateAndloginUser] sign-in failed:", error);
            return "We couldn't log you in. Please try again.";
    }
}