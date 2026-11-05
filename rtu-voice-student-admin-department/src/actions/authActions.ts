"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RESET_COOKIE, isRtuEmail, validatePassword, emailIsRegistered,
  issueOtp, checkOtp, setResetToken, readResetToken, str, friendlyAuthError } from "@/features/auth/authUtils"
import { type RegisterState, type resendState, type PendingRegistration, 
    type verifyState, type Purpose, type ChangePasswordType, type LoginResult, type UpdateProfileType } from "@/features/auth/authTypes";
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

    const errors: NonNullable<RegisterState["errors"]> = {};

    if (!firstName){
        return {success: false, message: "Invalid input", errors: {
            firstName: ["Please enter your first name."]
        }};
    } 
    if (!lastName){
        return {success: false, message: "Invalid input", errors: {
            lastName: ["Please enter your last name."]
        }};
    } 
    if (!isRtuEmail(email)){
        return {success: false, message: "Invalid input", errors: {
            email: ["Please enter your institutional email."]
        }};
    } 

    const passwordError = validatePassword(password)
    if (passwordError){
        return {success: false, message: "Invalid input", errors: {
            password: [passwordError]
        }};
    } 

    if (!confirmPassword){
        return {success: false, message: "Invalid input", errors: {
            confirmPassword: ["Please confirm your password."]
        }};
    } 

    if (confirmPassword !== password){
        return {success: false, message: "Invalid input", errors: {
            confirmPassword: ["Passwords don't match."]
        }}
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
) {
    const email = (pending?.email ?? "").trim().toLowerCase();
    const firstName = (pending?.firstName ?? "").trim();
    const lastName = (pending?.lastName ?? "").trim();
    const password = pending?.password ?? ""; // not trimmed, same as validateAndSendOtp

    if (!isRtuEmail(email) || !firstName || !lastName || validatePassword(password)) {
        return { success: false, message: "Registration details are missing or invalid. Please start again." };
    }

    const registered = await emailIsRegistered(email);
    if (registered === null) {
        return { success: false, message: "Something went wrong. Please try again." };
    }
    if (registered) {
        return { success: false, message: "Email has already been used." };
    }

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
        console.error("[verifyAndRegisterUser] createUser failed:", error);
        return { success: false, message: "Couldn't create your account. Please request a new code and try again." };
    }

    revalidatePath("/", "layout");
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
    const supabase = await createClient();

    const email = str(formData.get("email")).trim().toLowerCase();
    const password = str(formData.get("password"));
    const next = str(formData.get("next")).trim();

    if (!email) return { success: false, message: "Enter your institutional email" };
    if (!password) return { success: false, message: "Enter your password" };

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

    const registered = await emailIsRegistered(email);
    if (registered === null) {
        return { success: false, message: "Something went wrong. Please try again." };
    }
    // Note: this reveals which emails are registered. If that matters to you, return the
    // same success message either way and only send the email when registered.
    if (!registered) {
        return { success: false, message: "Your institutional email is not registered yet!" };
    }
    const supabase = await createClient();
    const {data: fetchName, error: fetchError} = await supabase.from("users").select("first_name").eq("rtu_email", email).maybeSingle();

    if( fetchError || !fetchName){
        console.error("[validateEmailForPwReset] name fetch failed:", fetchError);
        return { success: false, message: "Couldn't find your data. Try again"};
    }

    const result = await issueOtp(fetchName['first_name'], email, "password_reset");
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

export async function ChangePassword(formData: FormData): Promise<ChangePasswordType>{
    const oldPassword = str(formData.get("oldPassword"));
    const newPassword = str(formData.get("newPassword"));
    const confirmPassword = str(formData.get("confirmPassword"));

    if (!oldPassword) return { success: false, message: "Invalid input", errors: {oldPassword: "Please enter your Old Password"}};

    if (!newPassword) return { success: false, message: "Invalid input", errors: {newPassword: "Please enter your new Password"}};

    const passwordError = validatePassword(newPassword);
    if (passwordError) return { success: false, message: "Invalid input", errors: {newPassword: passwordError}};

    if (!confirmPassword) return { success: false, message: "Invalid input", errors: {confirmPassword: "Please confirm your new Password"}};
    
    if (confirmPassword !== newPassword) return { success: false, message: "Invalid input", errors: {confirmPassword: "Password don't match."}};
    
    const supabase = await createClient();

    const {data} = await supabase.auth.getUser();
    if (!data) return {success: false, message: "Error in getting user's data. Please try again."};
    if (!data.user) return {success: false, message: "Please login first"};

    const email = data.user.email;
    if (!email) return {success: false, message: "Error in getting user's email"}
    
    const {error: updateError} = await supabase.auth.updateUser({current_password:oldPassword, password: newPassword});
    
    // d) Check the error code before the HTTP status. A wrong current password and a weak password both arrive as
    //    400 or 422, so the status branches caught them first and showed the wrong message.
    if (updateError) {
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
    
    console.log("Successfully Updated password")
    
    return {
        success: true,
        message: ""
    }
}

export async function UpdateProfile(formData: FormData): Promise<UpdateProfileType>{
    const newFirstName = str(formData.get("firstName")).trim();
    const newLastName = str(formData.get("lastName")).trim();

    if (!newFirstName) return {success: false, message:"Invalid input", errors:{firstName: "Please enter your first name"}};
    if (!newLastName) return {success: false, message:"Invalid input", errors:{lastName: "Please enter your last name"}};

    const supabase = await createClient();

    const {data: {user}} = await supabase.auth.getUser();
    if (!user) return {success: false, message: "Not logged in."};

    const {error} = await supabase.auth.updateUser({data: {
        first_name: newFirstName,
        last_name: newLastName
    }});
    if (error) return { success: false, message: "Couln't update your name."};

    const admin = await createAdminClient();

    const {error: tableError} = await admin.from("users").update({first_name: newFirstName, last_name: newLastName}).eq("id", user.id);
    if(tableError) return {success: false, message:"Error in updating your name"};
    console.log("Sucessfully updated your name.")
    return {success: true, message: ""};
}

export async function logoutUser() {
    const supabase = await createClient();
    await supabase.auth.signOut();

    revalidatePath("/", "layout");
    redirect("/login");
}

