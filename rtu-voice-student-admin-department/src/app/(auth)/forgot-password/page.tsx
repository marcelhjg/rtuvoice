"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { OtpVerifyCard } from "@/components/forms/OtpVerifyCard";
import { PasswordField, TextField } from "@/components/forms/Fields";
import { Icon } from "@/components/Icon";
import { resetPassword, validateEmailForPwReset, verifyResetOtp } from "@/actions/authActions"; // use the file where your actions live
import { passwordChecks, validateConfirm, validateEmail, validateNewPassword } from "@/lib/validation";
import styles from "../auth.module.css";

const GENERIC_ERROR = "Something went wrong. Please try again.";

// Step 1 and "Resend code" use the same action: it checks the email, looks up the first name on the
// server, and sends a new code, so the browser never has to supply a name.
const sendCode = (address: string) => {
  const fd = new FormData();
  fd.append("email", address);
  return validateEmailForPwReset(fd);
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [busy, setBusy] = useState(false);

  // step 1
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  // step 3
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string | null; confirm?: string | null }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const address = email.trim().toLowerCase();

  const submitEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const err = validateEmail(email);
    setEmailError(err);
    if (err) return;

    setBusy(true);
    try {
      const res = await sendCode(address);
      if (res.success) setStep("otp");
      else setEmailError(res.message || GENERIC_ERROR);
    } catch (err) {
      console.error(err);
      setEmailError(GENERIC_ERROR);
    } finally {
      setBusy(false);
    }
  };

  const submitReset = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const next = { password: validateNewPassword(password), confirm: validateConfirm(password, confirm) };
    setErrors(next);
    setFormError(null);
    if (next.password || next.confirm) return;

    setBusy(true);
    try {
      // These keys must match what resetPassword reads.
      const fd = new FormData();
      fd.append("newPassword", password);
      fd.append("confirmPassword", confirm);
      const res = await resetPassword(fd);
      if (res.success) {
        router.replace("/login?reset=1"); // stay busy until the page changes
        return;
      }
      setFormError(res.message || GENERIC_ERROR);
    } catch (err) {
      console.error(err);
      setFormError(GENERIC_ERROR);
    }
    setBusy(false);
  };

  const startOver = () => {
    setPassword("");
    setConfirm("");
    setErrors({});
    setFormError(null);
    setStep("email");
  };

  if (step === "otp") {
    return (
      <OtpVerifyCard
        email={address}
        purpose="reset"
        onVerify={(fd) => verifyResetOtp(fd, address)}
        onResend={() => sendCode(address)}
        onVerified={() => setStep("reset")}
        onBack={() => setStep("email")}
      />
    );
  }

  if (step === "reset") {
    return (
      <div className={styles.card}>
        <Image src="/images/rtu-voice-logo.png" alt="" width={200} height={179} className={styles.cardLogo} />
        <h2 className={styles.cardTitle}>Set a new password</h2>
        <p className={`${styles.cardSubtitle} ${styles.caption}`}>Choose a strong password for your account.</p>
        <form className={styles.form} onSubmit={submitReset} noValidate>
          <PasswordField
            label="New Password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((x) => ({ ...x, password: null }));
            }}
            error={errors.password}
            labelClassName={styles.label}
            inputClassName={styles.input}
          />
          <ul className={styles.reqs} aria-label="Password requirements">
            {passwordChecks(password).map((c) => (
              <li key={c.label} className={c.ok ? styles.reqOk : undefined}>
                <Icon name={c.ok ? "check" : "x"} size={12} strokeWidth={2.6} />
                {c.label}
              </li>
            ))}
          </ul>
          <PasswordField
            label="Confirm New Password"
            autoComplete="new-password"
            placeholder="•••••••••••••••"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              if (errors.confirm) setErrors((x) => ({ ...x, confirm: null }));
            }}
            error={errors.confirm}
            labelClassName={styles.label}
            inputClassName={styles.input}
          />

          {formError ? (
            <p className="alert alert-error" role="alert" style={{ padding: "10px 12px", fontSize: 14, lineHeight: 1.45 }}>
              {formError}
            </p>
          ) : null}

          <button type="submit" className={styles.submit} disabled={busy} aria-busy={busy}>
            {busy ? <span className="spinner" aria-hidden="true" /> : null}
            {busy ? "Saving…" : "Reset Password"}
          </button>
          <p className={`${styles.switch} ${styles.caption}`}>
            Session expired?{" "}
            <button type="button" className={styles.resendBtn} onClick={startOver} disabled={busy}>
              Start over
            </button>
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Forgot Password</h2>
      <p className={`${styles.cardSubtitle} ${styles.caption}`}>
        Enter your university email. We will send a
        <br />
        verification code to it.
      </p>
      <form className={styles.form} onSubmit={submitEmail} noValidate>
        <TextField
          label="University Email"
          type="email"
          autoComplete="email"
          placeholder="2000-000000@rtu.edu.ph"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError(null);
          }}
          error={emailError}
          labelClassName={styles.label}
          inputClassName={styles.input}
        />
        <button type="submit" className={styles.submit} disabled={busy} aria-busy={busy}>
          {busy ? <span className="spinner" aria-hidden="true" /> : null}
          {busy ? "Sending code…" : "Send Code"}
        </button>
        <p className={`${styles.switch} ${styles.caption}`}>
          Remember your password? <Link href="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}