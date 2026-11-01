import "server-only";

import crypto from 'crypto'
import bcrypt from 'bcrypt';
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendRegistrationEmail, sendResetPasswordEmail } from "@/lib/email/otp-email";
import { PURPOSE, type Purpose, type verifyState } from "./authTypes";

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


export const str = (v: FormDataEntryValue | null) => (v ?? "").toString();

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

/* ---- signed, short-lived "OTP verified" cookie for password reset ---- */

export function sign(value: string) {
    const secret = process.env.AUTH_COOKIE_SECRET;
    if (!secret) throw new Error("AUTH_COOKIE_SECRET is not set");
    return createHmac("sha256", secret).update(value).digest("hex");
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

    const a = Buffer.from(sig);
    const b = Buffer.from(sign(payload));
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    try {
        const { email, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
        if (typeof email !== "string" || typeof exp !== "number" || Date.now() > exp) return null;
        return email;
    } catch {
        return null;
    }
}

/* ------------------------------------------------------------------ */
/* OTP core: issue + check                                             */
/* ------------------------------------------------------------------ */

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

    let otpCode: string;
    try {
        otpCode = await generateOtp();
        const hashed = await hashOtp(otpCode);

        const { error: insertError } = await supabase.from("otp_verifications").insert({
            email,
            hashed_code: hashed,
            purpose_id: purposeId,
            attempts: 0,
        });
        if (insertError) throw insertError;
    } catch (err) {
        console.error("[issueOtp] generate/insert failed:", err);
        return { success: false, message: "Couldn't generate a code. Please try again." };
    }

    // invalidate previous codes (the new one is already inserted)
    if (recent.length > 0) {
        await supabase
            .from("otp_verifications")
            .update({ expires_at: new Date().toISOString() })
            .in("id", recent.map((r) => r.id));
    }

    const result =
        purpose === "registration"
            ? await sendRegistrationEmail(email, otpCode, firstName)
            : await sendResetPasswordEmail(email, otpCode, firstName);

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

    const isMatch = await bcrypt.compare(code, otpData.hashed_code);

    if (!isMatch) {
        const used = otpData.attempts + 1;
        await supabase.from("otp_verifications").update({ attempts: used }).eq("id", otpData.id);
        const left = MAX_OTP_ATTEMPTS - used;
        return {
            success: false,
            message: left > 0
                ? `Incorrect code. ${left} attempt${left === 1 ? "" : "s"} left.`
                : "Incorrect code. Please request a new one.",
        };
    }

    // consume: only succeeds if the code is still unexpired, so it can't be used twice
    const nowIso = new Date().toISOString();
    const { data: consumed, error: consumeError } = await supabase
        .from("otp_verifications")
        .update({ expires_at: nowIso })
        .eq("id", otpData.id)
        .gt("expires_at", nowIso)
        .select("id");

    if (consumeError || !consumed || consumed.length === 0) {
        return { success: false, message: "Code expired. Please request a new one." };
    }

    return { success: true, message: "OTP matched." };
}

export async function generateOtp(length: number = 6){
    let otp = "";

    for (let i = 0; i < length; i++){
        otp += crypto.randomInt(0, 10).toString();
    }
    
    return otp;
}

export async function hashOtp(otp: string, round: number = 10){
    const hashedOtp = bcrypt.hash(otp, round);

    return hashedOtp;
}
