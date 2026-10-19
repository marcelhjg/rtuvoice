"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PasswordField, TextField } from "@/components/forms/Fields";
import { useDemoStore } from "@/lib/demo-store";
import { passwordChecks, validateConfirm, validateEmail, validateName, validateNewPassword } from "@/lib/validation";
import styles from "../auth.module.css";

type Errors = Partial<Record<"firstName" | "lastName" | "email" | "password" | "confirm", string | null>>;
const PASSWORD_REQUIREMENTS_MESSAGE = "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.";

export default function RegisterPage() {
  const { startSignup, isAdminEmail } = useDemoStore();
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
  };

  const validate = (): Errors => ({
    firstName: validateName(form.firstName, "First name"),
    lastName: validateName(form.lastName, "Last name"),
    email: validateEmail(form.email) ?? (isAdminEmail(form.email) ? "This email belongs to a staff account. Log in instead." : null),
    password: form.password && validateNewPassword(form.password) ? PASSWORD_REQUIREMENTS_MESSAGE : validateNewPassword(form.password),
    confirm: validateConfirm(form.password, form.confirm),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setBusy(true);
    // SIMULATED: the real system emails an OTP to the RTU inbox and only creates the account after verification.
    window.setTimeout(() => {
      startSignup({ firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email });
      router.push("/register/verify");
    }, 500);
  };

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
