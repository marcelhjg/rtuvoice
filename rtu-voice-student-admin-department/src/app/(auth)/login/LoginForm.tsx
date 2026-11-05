"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { PasswordField, TextField } from "@/components/forms/Fields";
import { validateEmail } from "@/lib/validation";
import { validateAndloginUser } from "@/actions/authActions"; // use the file where the action lives
import styles from "../auth.module.css";
import { useRouter } from "next/navigation";

const GENERIC_ERROR = "We couldn't log you in. Please try again.";
type Notice = "registered" | "reset" | null;

export function LoginForm({ next, notice }: { next: string | null; notice: Notice }) {  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;

    const nextErrors = {
      email: validateEmail(email),
      password: password ? null : "Enter your password.",
    };
    setErrors(nextErrors);
    setFormError(null);
    if (nextErrors.email || nextErrors.password) return;

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("email", email);
      fd.append("password", password);
      if (next) fd.append("next", next);

      const res = await validateAndloginUser(fd);

      if (res.success) {
        router.replace(res.redirectTo); // stay busy until the page changes
        return;
      }

      setFormError(res.message || GENERIC_ERROR);
      setBusy(false);
    } catch (err) {
      console.error(err);
      setFormError(GENERIC_ERROR);
      setBusy(false);
    }
  };

  return (
    <div className={`${styles.card} ${styles.loginRegisterCard} ${styles.loginCard}`}>
      <h2 className={styles.cardTitle}>Login</h2>
      <p className={`${styles.cardSubtitle} ${styles.caption}`}>
        <strong>Welcome back!</strong> Please enter your details.
      </p>

      <form className={styles.form} onSubmit={submit} noValidate>
        {/* Protected-route state: sent here from a portal page while logged out (?next=…). */}
       
      {notice ? (
        <p className="alert alert-info" role="status" style={{ padding: "10px 12px", fontSize: 14, lineHeight: 1.45 }}>
          {notice === "registered"
            ? "Your account was created. Please log in."
            : "Your password was updated. Please log in with your new password."}
        </p>
      ) : next ? (
        <p className="alert alert-info" role="status" style={{ padding: "10px 12px", fontSize: 14, lineHeight: 1.45 }}>
          Please log in to continue. You&apos;ll go back to the page you opened.
        </p>
      ) : null}
      
        <TextField
          label="University Email"
          type="email"
          autoComplete="email"
          placeholder="2000-00000@rtu.edu.ph"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((x) => ({ ...x, email: null }));
          }}
          onBlur={() => email && setErrors((x) => ({ ...x, email: validateEmail(email) }))}
          error={errors.email}
          labelClassName={styles.label}
          inputClassName={styles.input}
        />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          placeholder="•••••••••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((x) => ({ ...x, password: null }));
          }}
          error={errors.password}
          labelClassName={styles.label}
          inputClassName={styles.input}
        />
        <Link href="/forgot-password" className={styles.forgot}>
          Forgot password?
        </Link>

        {formError ? (
          <p className="alert alert-error" role="alert" style={{ padding: "10px 12px", fontSize: 14, lineHeight: 1.45 }}>
            {formError}
          </p>
        ) : null}

        <button type="submit" className={styles.submit} disabled={busy} aria-busy={busy}>
          {busy ? <span className="spinner" aria-hidden="true" /> : null}
          {busy ? "Logging in…" : "Login"}
        </button>

        <p className={`${styles.switch} ${styles.caption}`}>
          Don&apos;t have an account? <Link href="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}