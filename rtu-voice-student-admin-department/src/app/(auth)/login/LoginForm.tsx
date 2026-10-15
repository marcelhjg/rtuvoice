"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { PasswordField, TextField } from "@/components/forms/Fields";
import { useToast } from "@/components/Toast";
import { DEMO_PASSWORD } from "@/lib/demo-data";
import { useDemoStore } from "@/lib/demo-store";
import { homeFor } from "@/lib/routes";
import type { Role } from "@/lib/types";
import { validateEmail } from "@/lib/validation";
import styles from "../auth.module.css";

export function LoginForm() {
  const { login, session, ready } = useDemoStore();
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const requested = params.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});
  const [busy, setBusy] = useState(false);

  // Already signed in (demo session): go straight to the portal.
  useEffect(() => {
    if (ready && session && !busy) router.replace(destination(session.role, requested));
  }, [ready, session, busy, requested, router]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors = {
      email: validateEmail(email),
      password: !password
        ? "Enter your password."
        : password !== DEMO_PASSWORD
          ? "Incorrect password. Please try again."
          : null,
    };
    setErrors(nextErrors);
    if (nextErrors.email || nextErrors.password) return;
    setBusy(true);
    // SIMULATED sign-in: no credentials are checked against a server.
    window.setTimeout(() => {
      const account = login(email);
      toast(`Welcome back, ${account.firstName}!`, "success");
      router.replace(destination(account.role, requested));
    }, 500);
  };

  return (
    <div className={`${styles.card} ${styles.loginRegisterCard} ${styles.loginCard}`}>
      <h2 className={styles.cardTitle}>Login</h2>
      <p className={`${styles.cardSubtitle} ${styles.caption}`}>
        <strong>Welcome back!</strong> Please enter your details.
      </p>

      <form className={styles.form} onSubmit={submit} noValidate>
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

        <button type="submit" className={styles.submit} disabled={busy}>
          {busy ? <span className="spinner" /> : null}
          Login
        </button>

        <p className={`${styles.switch} ${styles.caption}`}>
          Don&apos;t have an account? <Link href="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}

/**
 * Unified login (SRS v3): the account's role decides the portal. A ?next= target is honoured only
 * when it is an internal path that belongs to that role's portal.
 */
function destination(role: Role, next: string | null): string {
  const home = homeFor(role);
  if (!next || !next.startsWith("/") || next.startsWith("//")) return home;
  const belongsTo = (prefix: string) => next === prefix || next.startsWith(`${prefix}/`);
  const target: Role = belongsTo("/admin") ? "admin" : belongsTo("/department") ? "department" : "student";
  return target === role ? next : home;
}
