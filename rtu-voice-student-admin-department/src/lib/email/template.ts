const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
 

type Purpose = "registration" | "password_reset";
 
type OtpEmailParams = {
  name: string;
  otp: string;
  logoUrl: string; // absolute public URL, e.g. https://your-app.vercel.app/logo.png
};
 
const COPY: Record<
  Purpose,
  { subject: string; eyebrow: string; heading: string; intro: string; notice: string; text: string }
> = {
  registration: {
    subject: "Verify your RTU Voice account",
    eyebrow: "Account Verification",
    heading: "Verify your university email",
    intro:
      "Thanks for registering with RTU Voice. Use the one-time password (OTP) below to finish creating your account, then enter it on the Verify Account screen.",
    notice:
      "RTU Voice staff will never ask you for this code. If you didn&rsquo;t create an account, you can safely ignore this email.",
    text: "Thanks for registering with RTU Voice. Use the one-time password (OTP) below to finish creating your account.",
  },
  password_reset: {
    subject: "Reset your RTU Voice password",
    eyebrow: "Password Reset",
    heading: "Reset your password",
    intro:
      "We received a request to reset the password for your RTU Voice account. Use the one-time password (OTP) below to continue and set a new password.",
    notice:
      "If you didn&rsquo;t request a password reset, you can ignore this email. Your password will stay the same.",
    text: "We received a request to reset the password for your RTU Voice account. Use the one-time password (OTP) below to continue and set a new password.",
  },
};
 
function render(purpose: Purpose, { name, otp,  logoUrl }: OtpEmailParams) {
  const c = COPY[purpose];
  const safeName = escapeHtml(name);
  const safeOtp = escapeHtml(otp);
  const year = new Date().getFullYear();
  const serif = "'Playfair Display', Georgia, 'Times New Roman', serif";
  const sans = "'Segoe UI', Helvetica, Arial, sans-serif";
 
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${c.heading}</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background-color:#f4f5fb;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Your RTU Voice code is ${safeOtp}. It expires in 10 minutes.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f5fb;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
        style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #e5e8f2;border-radius:16px;overflow:hidden;">
 
        <tr><td style="padding:24px 32px 20px 32px;border-bottom:3px solid #f5b800;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td valign="middle" style="padding-right:14px;">
              <img src="${logoUrl}" width="56" height="56" alt="RTU Voice" style="display:block;border:0;" />
            </td>
            <td valign="middle">
              <div style="font-family:${serif};font-size:22px;font-weight:700;line-height:1.1;">
                <span style="color:#1b3f94;">RTU</span> <span style="color:#f5b800;">Voice</span>
              </div>
              <div style="font-family:${sans};font-size:10px;font-weight:600;color:#1f2937;margin-top:6px;line-height:1.4;letter-spacing:0.2px;">
                RIZAL TECHNOLOGICAL UNIVERSITY -<br />PASIG CAMPUS
              </div>
            </td>
          </tr></table>
        </td></tr>
 
        <tr><td style="padding:32px 32px 8px 32px;">
          <div style="font-family:${sans};font-size:11px;font-weight:600;letter-spacing:2px;color:#a16207;text-transform:uppercase;">${c.eyebrow}</div>
          <h1 style="margin:14px 0 20px 0;font-family:${serif};font-size:26px;line-height:1.25;font-weight:700;color:#111c33;">${c.heading}</h1>
          <p style="margin:0 0 14px 0;font-family:${sans};font-size:14px;line-height:1.6;color:#1f2937;">Hello ${safeName},</p>
          <p style="margin:0 0 22px 0;font-family:${sans};font-size:14px;line-height:1.65;color:#4b5563;">${c.intro}</p>
 
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
            style="background-color:#f6f7fc;border:1px solid #e5e8f2;border-radius:12px;">
            <tr><td align="center" style="padding:24px 16px;">
              <div style="font-family:${sans};font-size:10px;font-weight:600;letter-spacing:2px;color:#4b5563;text-transform:uppercase;">Your One-Time Password</div>
              <div style="font-family:${sans};font-size:42px;font-weight:700;letter-spacing:10px;color:#1b3f94;margin:14px 0 12px 0;padding-left:10px;">${safeOtp}</div>
              <div style="font-family:${sans};font-size:12px;color:#4b5563;">Expires in 10 minutes</div>
            </td></tr>
          </table>
 
          <p style="margin:22px 0 18px 0;font-family:${sans};font-size:13px;line-height:1.6;color:#4b5563;">
            This code is valid for <strong style="color:#111c33;"> 10 minutes</strong>. Please do not share it with anyone.
          </p>
 
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef0fa;border-radius:10px;">
            <tr>
              <td valign="top" width="14" style="padding:18px 0 0 16px;">
                <div style="width:7px;height:7px;border-radius:50%;background-color:#1b3f94;font-size:0;line-height:0;">&nbsp;</div>
              </td>
              <td style="padding:14px 18px 14px 10px;font-family:${sans};font-size:13px;line-height:1.6;color:#374151;">${c.notice}</td>
            </tr>
          </table>
        </td></tr>
 
        <tr><td style="height:28px;font-size:0;line-height:0;">&nbsp;</td></tr>
 
        <tr><td align="center" style="background-color:#f6f7fc;padding:20px 24px;border-top:1px solid #eceef6;">
          <div style="font-family:${sans};font-size:11px;font-weight:600;color:#374151;line-height:1.6;">Rizal Technological University &middot; Pasig Campus</div>
          <div style="font-family:${sans};font-size:11px;color:#4b5563;line-height:1.7;margin-top:2px;">&copy; ${year} RTU Voice Group 4Voices, BSIT &bull; Institute of Computer Studies</div>
          <div style="font-family:${sans};font-size:11px;color:#4b5563;line-height:1.7;">This is an automated message. Please do not reply to this email.</div>
        </td></tr>
 
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
 
function renderText(purpose: Purpose, { name, otp }: OtpEmailParams) {
  const c = COPY[purpose];
  return `Hello ${name},
 
${c.text}
 
Your one-time password: ${otp}
 
It expires in 10 minutes. Please do not share it with anyone.
${c.notice.replace("&rsquo;", "'")}
 
Rizal Technological University - Pasig Campus
This is an automated message. Please do not reply to this email.`;
}
 
// Public API: one call returns everything Resend needs.
export function buildOtpEmail(purpose: Purpose, params: OtpEmailParams) {
  return {
    subject: COPY[purpose].subject,
    html: render(purpose, params),
    text: renderText(purpose, params),
  };
}