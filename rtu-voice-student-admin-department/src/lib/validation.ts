/** Client-side validation rules taken from the RTU Voice SRS v3 / roadmap. */
export const RTU_EMAIL_DOMAIN = "@rtu.edu.ph";
export const PASSWORD_MIN = 8;


/** SRS §1: only official @rtu.edu.ph addresses can register or log in. */
export function validateEmail(value: string): string | null {
  const v = value.trim().toLowerCase();
  if (!v) return "Enter your university email.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email address.";
  if (!v.endsWith(RTU_EMAIL_DOMAIN)) return "Only official university emails allowed";
  return null;
}

export function validateName(value: string, label: string): string | null {
  const v = value.trim();
  if (!v) return `Enter your ${label.toLowerCase()}.`;
  if (v.length > 50) return `${label} is too long.`;
  if (!/^[\p{L}][\p{L}\s.'-]*$/u.test(v)) return `${label} can only contain letters, spaces, periods, hyphens and apostrophes.`;
  return null;
}

export interface PasswordCheck {
  label: string;
  ok: boolean;
}

/**
 * Password rules shown live under the field. SRS §1 asks for one lowercase, one uppercase and one
 * digit; the 8-character minimum (PASSWORD_MIN) is an addition in this build.
 */
export function passwordChecks(value: string): PasswordCheck[] {
  return [
    { label: `At least ${PASSWORD_MIN} characters`, ok: value.length >= PASSWORD_MIN },
    { label: "One uppercase and one lowercase letter", ok: /[a-z]/.test(value) && /[A-Z]/.test(value) },
    { label: "One number", ok: /\d/.test(value) },
  ];
}

export function validateNewPassword(value: string): string | null {
  if (!value) return "Enter a password.";
  const failed = passwordChecks(value).find((c) => !c.ok);
  return failed ? `Password needs: ${failed.label.toLowerCase()}.` : null;
}

export function validateConfirm(password: string, confirm: string): string | null {
  if (!confirm) return "Re-enter the password.";
  if (password !== confirm) return "Passwords do not match.";
  return null;
}

/** Random public tracking ID, e.g. STU-A3F1B. Ambiguous characters (0, O, 1, I) are excluded. */
export function generateTrackingId(existing: Set<string>): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (;;) {
    let s = "";
    const bytes = new Uint8Array(5);
    crypto.getRandomValues(bytes);
    for (const b of bytes) s += chars[b % chars.length];
    const id = `STU-${s}`;
    if (!existing.has(id)) return id;
  }
}

/** Uppercases and removes spaces ("stu-a3f1b " → "STU-A3F1B"), so lookups don't depend on how the ID was typed. */
export function normalizeTrackingId(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}
