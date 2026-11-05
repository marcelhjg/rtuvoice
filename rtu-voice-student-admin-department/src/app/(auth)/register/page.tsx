"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { OtpVerifyCard } from "@/components/forms/OtpVerifyCard";
import { PasswordField, TextField } from "@/components/forms/Fields";
import { resendOtp, validateAndSendOtp, verifyAndRegisterUser } from "@/actions/authActions"; // use the file where your actions live
import { passwordChecks, validateConfirm, validateEmail, validateName, validateNewPassword } from "@/lib/validation";
import styles from "../auth.module.css";

type Errors = Partial<Record<"firstName" | "lastName" | "email" | "password" | "confirm", string | null>>;
const PASSWORD_REQUIREMENTS_MESSAGE = "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.";
const GENERIC_ERROR = "Something went wrong. Please try again.";
const EMPTY = { firstName: "", lastName: "", email: "", password: "", confirm: "" };

// These keys must match what validateAndSendOtp reads.
const toFormData = (f: typeof EMPTY) => {
  const fd = new FormData();
  fd.append("firstName", f.firstName.trim());
  fd.append("lastName", f.lastName.trim());
  fd.append("email", f.email.trim().toLowerCase());
  fd.append("password", f.password); // not trimmed
  fd.append("confirmPassword", f.confirm);
  return fd;
};

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
  };

  const validate = (): Errors => ({
    firstName: validateName(form.firstName, "First name"),
    lastName: validateName(form.lastName, "Last name"),
    email: validateEmail(form.email),
    password: form.password && validateNewPassword(form.password) ? PASSWORD_REQUIREMENTS_MESSAGE : validateNewPassword(form.password),
    confirm: validateConfirm(form.password, form.confirm),
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;

    const next = validate();
    setErrors(next);
    setFormError(null);
    if (Object.values(next).some(Boolean)) return;

    setBusy(true);
    try {
      const res = await validateAndSendOtp(toFormData(form));
      if (res.success) {
        setStep("otp"); // swap to the code step; the data stays in state
        return;
      }
      // Field errors from the server's own validation (each is an array; show the first).
      const fe = res.errors ?? {};
      const mapped: Errors = {
        firstName: fe.firstName?.[0] ?? null,
        lastName: fe.lastName?.[0] ?? null,
        email: fe.email?.[0] ?? null,
        password: fe.password?.[0] ?? null,
        confirm: fe.confirmPassword?.[0] ?? null,
      };
      if (Object.values(mapped).some(Boolean)) setErrors(mapped);
      else setFormError(res.message || GENERIC_ERROR);
    } catch (err) {
      console.error(err);
      setFormError(GENERIC_ERROR);
    } finally {
      setBusy(false);
    }
  };

  if (step === "otp") {
    const pending = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password, // not trimmed
    };
    return (
      <OtpVerifyCard
        email={pending.email}
        purpose="activate"
        onVerify={(fd) => verifyAndRegisterUser(fd, pending)}
        onResend={() => resendOtp("registration", pending.email, pending.firstName)}
        onVerified={() => router.replace("/login?registered=1")}
        onBack={() => setStep("form")}
      />
    );
  }

  const checks = passwordChecks(form.password);
  const passwordRequirementsMissing = Boolean(form.password) && checks.some((check) => !check.ok);

  return (
    <div className={`${styles.card} ${styles.loginRegisterCard} ${styles.registerCard}`}>
      <h2 className={styles.cardTitle}>Create Account</h2>
      <p className={`${styles.cardSubtitle} ${styles.caption}`}>Enter your details to get started.</p>

      <form className={`${styles.form} ${styles.registerForm}`} onSubmit={submit} noValidate>
        <div className={styles.row2}>
          <TextField
            label="First Name"
            autoComplete="given-name"
            placeholder="Juan"
            value={form.firstName}
            onChange={(e) => set("firstName")(e.target.value)}
            error={errors.firstName}
            labelClassName={styles.label}
            inputClassName={styles.input}
          />
          <TextField
            label="Last Name"
            autoComplete="family-name"
            placeholder="Dela Cruz"
            value={form.lastName}
            onChange={(e) => set("lastName")(e.target.value)}
            error={errors.lastName}
            labelClassName={styles.label}
            inputClassName={styles.input}
          />
        </div>
        <TextField
          label="University Email"
          type="email"
          autoComplete="email"
          placeholder="2000-00000@rtu.edu.ph"
          value={form.email}
          onChange={(e) => set("email")(e.target.value)}
          onBlur={() => form.email && setErrors((x) => ({ ...x, email: validateEmail(form.email) }))}
          error={errors.email}
          labelClassName={styles.label}
          inputClassName={styles.input}
        />
        <PasswordField
          label="Password"
          autoComplete="new-password"
          placeholder="•••••••••••••••"
          value={form.password}
          onChange={(e) => set("password")(e.target.value)}
          error={errors.password}
          labelClassName={styles.label}
          inputClassName={styles.input}
        />
        {passwordRequirementsMissing && !errors.password ? (
          <p className={styles.passwordRequirement} role="status">
            {PASSWORD_REQUIREMENTS_MESSAGE}
          </p>
        ) : null}
        <PasswordField
          label="Confirm Password"
          autoComplete="new-password"
          placeholder="•••••••••••••••"
          value={form.confirm}
          onChange={(e) => set("confirm")(e.target.value)}
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
          {busy ? "Sending code…" : "Register"}
        </button>
        <p className={`${styles.switch} ${styles.caption}`}>
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}