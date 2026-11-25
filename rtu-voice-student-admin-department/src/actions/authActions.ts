"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { str } from "@/features/shared/sharedUtils";
import {
    RESET_COOKIE, isRtuEmail, validatePassword, emailIsRegistered,
    issueOtp, checkOtp, setResetToken, readResetToken, friendlyAuthError,
} from "@/features/auth/authUtils";
import {
    type RegisterState, type resendState, type PendingRegistration,
    type verifyState, type Purpose, type ChangePasswordType, type LoginResult, type UpdateProfileType,
} from "@/features/auth/authTypes";
import { ROLE_BY_ID, destinationFor } from "@/features/auth/guards";


/* ------------------------------------------------------------------ */
/* Registration                                                        */
/* ------------------------------------------------------------------ */

// validate registration input and send an OTP. The CLIENT keeps the pending values.
export async function validateAndSendOtp(formData: FormData): Promise<RegisterState> {
    const firstName = str(formData.get("firstName")).trim();
    const lastName = str(formData.get("lastName")).trim();
    const email = str(formData.get("email")).trim().toLowerCase();
    const password = str(formData.get("password"));            // not trimmed
    const confirmPassword = str(formData.get("confirmPassword"));

    if (!firstName) {
        return { success: false, message: "Invalid input", errors: { firstName: ["Please enter your first name."] } };
    }
    if (!lastName) {
        return { success: false, message: "Invalid input", errors: { lastName: ["Please enter your last name."] } };
    }
    if (!isRtuEmail(email)) {
        return { success: false, message: "Invalid input", errors: { email: ["Please enter your institutional email."] } };
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
        return { success: false, message: "Invalid input", errors: { password: [passwordError] } };
    }

    if (!confirmPassword) {
        return { success: false, message: "Invalid input", errors: { confirmPassword: ["Please confirm your password."] } };
    }
    if (confirmPassword !== password) {
        return { success: false, message: "Invalid input", errors: { confirmPassword: ["Passwords don't match."] } };
    }

    const registered = await emailIsRegistered(email);
    if (registered === null) {
        return { success: false, message: "Something went wrong. Please try again." };
    }
    if (registered) {
        return {
            success: false,
            message: "Email has already been used.",
            errors: { email: ["Email has already been used."] },
        };
    }

    return issueOtp(firstName, email, "registration");
}

// verify the OTP, then create the (already email-verified) account
export async function verifyAndRegisterUser(
    formData: FormData,
    pending: PendingRegistration
): Promise<verifyState> {
    const email = (pending?.email ?? "").trim().toLowerCase();
    const firstName = (pending?.firstName ?? "").trim();
    const lastName = (pending?.lastName ?? "").trim();
    const password = pending?.password ?? ""; // not trimmed, same as validateAndSendOtp

    if (!isRtuEmail(email) || !firstName || !lastName || validatePassword(password)) {
        return { success: false, message: "Registration details are missing or invalid. Please start again." };
    }

    // No emailIsRegistered() pre-check here: validateAndSendOtp already blocked registered emails
    // before a code was ever sent, and createUser reports a duplicate itself (handled below).
    const check = await checkOtp(formData, email, "registration");
    if (!check.success) return check;

    const supabase = await createAdminClient();
    const { error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name: firstName, last_name: lastName },
    });

    if (error) {
        if (error.code === "email_exists") {
            return { success: false, message: "Email has already been used." };
        }
        console.error("[verifyAndRegisterUser] createUser failed:", error);
        return { success: false, message: "Couldn't create your account. Please request a new code and try again." };
    }

    // (no revalidatePath: the user isn't signed in yet, so there is nothing cached to purge)
    return { success: true, message: "Account created." }; // the form navigates; redirect() would throw into its catch
}

/* ------------------------------------------------------------------ */
/* Resend                                                              */
/* ------------------------------------------------------------------ */

export async function resendOtp(purpose: Purpose, rawEmail: string, firstName: string): Promise<resendState> {
    const email = (rawEmail ?? "").trim().toLowerCase();

    if (!isRtuEmail(email)) {
        return { success: false, message: "Invalid email." };
    }

    const registered = await emailIsRegistered(email);
    if (registered === null) {
        return { success: false, message: "Something went wrong. Please try again." };
    }
    if (purpose === "registration" && registered) {
        return { success: false, message: "Email has already been used." };
    }
    if (purpose === "password_reset" && !registered) {
        return { success: false, message: "Your institutional email is not registered yet!" };
    }

    const result = await issueOtp(firstName, email, purpose);
    return result.success ? { success: true, message: "Successfully sent an email." } : result;
}

/* ------------------------------------------------------------------ */
/* Login                                                               */
/* ------------------------------------------------------------------ */

export async function validateAndloginUser(formData: FormData): Promise<LoginResult> {
    const email = str(formData.get("email")).trim().toLowerCase();
    const password = str(formData.get("password"));
    const next = str(formData.get("next")).trim();

    if (!email) return { success: false, message: "Enter your institutional email" };
    if (!password) return { success: false, message: "Enter your password" };

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        return { success: false, message: friendlyAuthError(error) };
    }

    const { data: profile } = await supabase
        .from("users")
        .select("role_id, is_active")
        .eq("id", data.user.id)
        .maybeSingle();

    // Signed in with the right password, but the account is switched off: end the session right away.
    if (profile && !profile.is_active) {
        await supabase.auth.signOut();
        return { success: false, message: "This account has been deactivated. Please contact the administrator." };
    }

    const role = profile ? ROLE_BY_ID[profile.role_id] : undefined;
    if (!role) {
        await supabase.auth.signOut();
        return { success: false, message: "Your account has no role assigned." };
    }

    revalidatePath("/", "layout");
    return { success: true, message: "", redirectTo: destinationFor(role, next) };
}

/* ------------------------------------------------------------------ */
/* Password reset                                                      */
/* ------------------------------------------------------------------ */

// step 1: validate the email and send a reset OTP. The CLIENT remembers the email.
export async function validateEmailForPwReset(formData: FormData): Promise<verifyState> {
    const email = str(formData.get("email")).trim().toLowerCase();

    if (!email) return { success: false, message: "Please enter your institutional email" };
    if (!isRtuEmail(email)) return { success: false, message: "Not a valid RTU institutional email" };

    // One query answers both "is it registered?" and "what's the first name?"
    const supabase = await createAdminClient();
    const { data: user, error } = await supabase
        .from("users")
        .select("first_name")
        .eq("rtu_email", email)
        .maybeSingle();

    if (error) {
        console.error("[validateEmailForPwReset] lookup failed:", error);
        return { success: false, message: "Something went wrong. Please try again." };
    }
    // Note: this reveals which emails are registered. If that matters to you, return the
    // same success message either way and only send the email when registered.
    if (!user) {
        return { success: false, message: "Your institutional email is not registered yet!" };
    }

    const result = await issueOtp(user.first_name, email, "password_reset");
    if (!result.success) return result;

    return { success: true, message: "Email is validated and OTP is sent" };
}

// step 2: verify the OTP -> sets a signed, short-lived cookie proving it
export async function verifyResetOtp(formData: FormData, rawEmail: string): Promise<verifyState> {
    const email = (rawEmail ?? "").trim().toLowerCase();
    if (!isRtuEmail(email)) {
        return { success: false, message: "Invalid email." };
    }

    const check = await checkOtp(formData, email, "password_reset");
    if (!check.success) return check;

    await setResetToken(email);
    return { success: true, message: "Code verified." };
}

// step 3: set the new password (only works with a valid verified-reset cookie)
export async function resetPassword(formData: FormData): Promise<verifyState> {
    const email = await readResetToken();
    if (!email) {
        return { success: false, message: "Your reset session expired. Please verify your email again." };
    }

    const newPassword = str(formData.get("newPassword"));
    const confirmPassword = str(formData.get("confirmPassword"));

    const passwordError = validatePassword(newPassword);
    if (passwordError) return { success: false, message: passwordError };

    if (!confirmPassword) return { success: false, message: "Please confirm your new password." };
    if (newPassword !== confirmPassword) return { success: false, message: "Passwords don't match." };

    const supabase = await createAdminClient();

    const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("rtu_email", email)
        .maybeSingle();

    if (userError || !userData) {
        return { success: false, message: "Account not found. Cannot reset password." };
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(userData.id, {
        password: newPassword,
    });

    if (updateError) {
        console.error("[resetPassword] update failed:", updateError);
        return { success: false, message: "Couldn't update your password. Please try again." };
    }

    (await cookies()).delete(RESET_COOKIE); // one-time use
    return { success: true, message: "Successfully updated password" };
}

/* ------------------------------------------------------------------ */
/* Signed-in account settings                                          */
/* ------------------------------------------------------------------ */

// "no session" as reported by supabase-js
const isNoSession = (e: { name?: string; status?: number }) =>
    e.name === "AuthSessionMissingError" || e.status === 401;

export async function ChangePassword(formData: FormData): Promise<ChangePasswordType> {
    const oldPassword = str(formData.get("oldPassword"));
    const newPassword = str(formData.get("newPassword"));
    const confirmPassword = str(formData.get("confirmPassword"));

    if (!oldPassword) return { success: false, message: "Invalid input", errors: { oldPassword: "Please enter your Old Password" } };
    if (!newPassword) return { success: false, message: "Invalid input", errors: { newPassword: "Please enter your new Password" } };

    const passwordError = validatePassword(newPassword);
    if (passwordError) return { success: false, message: "Invalid input", errors: { newPassword: passwordError } };

    if (!confirmPassword) return { success: false, message: "Invalid input", errors: { confirmPassword: "Please confirm your new Password" } };
    if (confirmPassword !== newPassword) return { success: false, message: "Invalid input", errors: { confirmPassword: "Passwords don't match." } };

    const supabase = await createClient();

    // No separate getUser() call: updateUser needs a session anyway and reports "no session" itself.
    const { error: updateError } = await supabase.auth.updateUser({
        current_password: oldPassword,
        password: newPassword,
    });

    // Check the error code before the HTTP status. A wrong current password and a weak password both arrive as
    // 400 or 422, so the status branches would catch them first and show the wrong message.
    if (updateError) {
        if (isNoSession(updateError)) return { success: false, message: "Please login first" };

        console.error("[ChangePassword] update failed:", updateError.status, updateError.code, updateError.message);

        switch (updateError.code) {
            case "current_password_invalid":
                return { success: false, message: "Invalid input", errors: { oldPassword: "Incorrect password." } };
            case "same_password":
                return { success: false, message: "Invalid input", errors: { newPassword: "Choose a password different from your current one." } };
            case "weak_password":
                return { success: false, message: "Invalid input", errors: { newPassword: "Password is too weak. Use at least 8 characters with an uppercase letter, a lowercase letter, and a number." } };
        }
        if (updateError.status === 429) return { success: false, message: "Too many attempts. Try again later." };
        return { success: false, message: "We couldn't update your password. Please try again." };
    }

    return { success: true, message: "" };
}

export async function UpdateProfile(formData: FormData): Promise<UpdateProfileType> {
    const newFirstName = str(formData.get("firstName")).trim();
    const newLastName = str(formData.get("lastName")).trim();

    if (!newFirstName) return { success: false, message: "Invalid input", errors: { firstName: "Please enter your first name" } };
    if (!newLastName) return { success: false, message: "Invalid input", errors: { lastName: "Please enter your last name" } };

    const supabase = await createClient();

    // updateUser returns the user, so we get the id without a separate getUser() round trip.
    const { data, error } = await supabase.auth.updateUser({
        data: { first_name: newFirstName, last_name: newLastName },
    });
    if (error || !data?.user) {
        if (error && isNoSession(error)) return { success: false, message: "Not logged in." };
        console.error("[UpdateProfile] auth update failed:", error);
        return { success: false, message: "Couldn't update your name." };
    }

    const admin = await createAdminClient();
    const { error: tableError } = await admin
        .from("users")
        .update({ first_name: newFirstName, last_name: newLastName })
        .eq("id", data.user.id);

    if (tableError) {
        console.error("[UpdateProfile] table update failed:", tableError);
        return { success: false, message: "Error in updating your name" };
    }

    return { success: true, message: "" };
}

export async function logoutUser() {
    const supabase = await createClient();
    await supabase.auth.signOut();

    revalidatePath("/", "layout");
    redirect("/login");
}