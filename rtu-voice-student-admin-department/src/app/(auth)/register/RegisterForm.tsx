"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PasswordField, TextField } from "@/components/forms/Fields";
import { validateAndSendOtp } from "@/actions/authActions";
import { useEmailStore, useFirstNameStore, useLastNameStore, usePasswordStore } from "@/features/auth/authStore";
import { passwordChecks, validateConfirm, validateEmail, validateName, validateNewPassword } from "@/lib/validation";
import styles from "../auth.module.css";

type Errors = Partial<Record<"firstName" | "lastName" | "email" | "password" | "confirm", string | null>>;
const PASSWORD_REQUIREMENTS_MESSAGE = "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.";

export function RegisterForm() {
  
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", confirm: "" });
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
    setFormError(null);
    const next = validate();
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setBusy(true);
    try {
      const fd = new FormData();
      fd.set("firstName", form.firstName);
      fd.set("lastName", form.lastName);
      fd.set("email", form.email);
      fd.set("password", form.password);
      fd.set("confirmPassword", form.confirm);

      const res = await validateAndSendOtp(fd);
      if (!res.success) {
        const s = res.errors;
        setErrors({
          firstName: s?.firstName?.[0] ?? null,
          lastName: s?.lastName?.[0] ?? null,
          email: s?.email?.[0] ?? null,
          password: s?.password?.[0] ?? null,
          confirm: s?.confirmPassword?.[0] ?? null,
        });
        if (!s) setFormError(res.message);
        setBusy(false);
        return;
      }

      useFirstNameStore.getState().setFirstName(form.firstName.trim());
      useLastNameStore.getState().setLastName(form.lastName.trim());
      usePasswordStore.getState().setPassword(form.password);
      useEmailStore.getState().setEmail(form.email.trim().toLowerCase(), "registration");
      router.push("/register/verify");
    } catch {
      setFormError("Something went wrong. Please try again.");
      setBusy(false);
    }
  };

  const checks = passwordChecks(form.password);
  const passwordRequirementsMissing = Boolean(form.password) && checks.some((c) => !c.ok);

  return (
    <div className={`${styles.card} ${styles.loginRegisterCard} ${styles.registerCard}`}>
      <h2 className={styles.cardTitle}>Create Account</h2>
      <p className={`${styles.cardSubtitle} ${styles.caption}`}>Enter your details to get started.</p>

      <form className={`${styles.form} ${styles.registerForm}`} onSubmit={submit} noValidate>
        {formError ? <p className="alert alert-error" role="alert" style={{ padding: "10px 12px", fontSize: 14 }}>{formError}</p> : null}
        <div className={styles.row2}>
          <TextField label="First Name" autoComplete="given-name" placeholder="Juan" value={form.firstName}
            onChange={(e) => set("firstName")(e.target.value)} error={errors.firstName}
            labelClassName={styles.label} inputClassName={styles.input} />
          <TextField label="Last Name" autoComplete="family-name" placeholder="Dela Cruz" value={form.lastName}
            onChange={(e) => set("lastName")(e.target.value)} error={errors.lastName}
            labelClassName={styles.label} inputClassName={styles.input} />
        </div>
        <TextField label="University Email" type="email" autoComplete="email" placeholder="2000-00000@rtu.edu.ph"
          value={form.email} onChange={(e) => set("email")(e.target.value)}
          onBlur={() => form.email && setErrors((x) => ({ ...x, email: validateEmail(form.email) }))}
          error={errors.email} labelClassName={styles.label} inputClassName={styles.input} />
        <PasswordField label="Password" autoComplete="new-password" placeholder="•••••••••••••••"
          value={form.password} onChange={(e) => set("password")(e.target.value)} error={errors.password}
          labelClassName={styles.label} inputClassName={styles.input} />
        {passwordRequirementsMissing && !errors.password ? (
          <p className={styles.passwordRequirement} role="status">{PASSWORD_REQUIREMENTS_MESSAGE}</p>
        ) : null}
        <PasswordField label="Confirm Password" autoComplete="new-password" placeholder="•••••••••••••••"
          value={form.confirm} onChange={(e) => set("confirm")(e.target.value)} error={errors.confirm}
          labelClassName={styles.label} inputClassName={styles.input} />

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