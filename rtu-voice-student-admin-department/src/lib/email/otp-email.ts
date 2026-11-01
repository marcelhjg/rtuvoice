import "server-only";
import { Resend } from "resend";
import { buildOtpEmail } from "./template";

type MailResult = { success: true } | { success: false; error: string };
type OtpPurpose = "registration" | "password_reset";

function requireEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`Missing environment variable: ${name}`);
    return value;
}

const resend = new Resend(requireEnv("RESEND_API_KEY"));
const MAIL_FROM = requireEnv("MAIL_FROM");             // e.g. RTU Voice <onboarding@resend.dev>
const SITE_URL = requireEnv("NEXT_PUBLIC_SITE_URL");
const LOG_OTP = process.env.LOG_OTP === "true";         // set only in .env.local

async function sendOtpEmail(
    purpose: OtpPurpose,
    to: string,
    otpCode: string,
    name: string
): Promise<MailResult> {
    if (LOG_OTP) {
        console.log(`[DEV] OTP for ${to}: ${otpCode}`);
    }

    try {
        const { subject, html, text } = buildOtpEmail(purpose, {
            name,
            otp: otpCode,
            logoUrl: `${SITE_URL}/logo.png`,
        });

        const { error } = await resend.emails.send({
            from: MAIL_FROM,
            to,
            subject,
            html,
            text,
        });

        if (error) {
            console.error("[sendOtpEmail] Resend error:", error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error("[sendOtpEmail] Unexpected error:", err);
        return { success: false, error: "Unexpected error sending email" };
    }
}

export const sendRegistrationEmail = (email: string, otpCode: string, firstName: string) =>
    sendOtpEmail("registration", email, otpCode, firstName);

export const sendResetPasswordEmail = (email: string, otpCode: string, firstName: string) =>
    sendOtpEmail("password_reset", email, otpCode, firstName);