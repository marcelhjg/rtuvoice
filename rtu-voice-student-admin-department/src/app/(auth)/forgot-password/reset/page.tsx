"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PasswordField } from "@/components/forms/Fields";
import { Icon } from "@/components/Icon";
import { useToast } from "@/components/Toast";
import { useDemoStore } from "@/lib/demo-store";
import { passwordChecks, validateConfirm, validateNewPassword } from "@/lib/validation";
import styles from "../../auth.module.css";

export default function ResetPasswordPage() {
  const { ready, resetEmail, resetVerified, finishReset } = useDemoStore();
  const router = useRouter();
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string | null; confirm?: string | null }>({});
  const [busy, setBusy] = useState(false);

  if (!ready) return <div className={styles.card} aria-busy="true" style={{ minHeight: 420 }} />;

  if (!resetEmail || !resetVerified) {
    return (
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Set a new password</h2>
        <p className={`${styles.cardSubtitle} ${styles.caption}`} style={{ marginTop: 16 }}>
          Verify the code sent to your email before setting a new password.
        </p>
        <div className={styles.form}>
          <Link href="/forgot-password" className={styles.submit} style={{ textDecoration: "none" }}>
            Start password recovery
          </Link>
        </div>
      </div>
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = { password: validateNewPassword(password), confirm: validateConfirm(password, confirm) };
    setErrors(next);
    if (next.password || next.confirm) return;
    setBusy(true);
    // SIMULATED: the password is not stored or sent anywhere in this build.
    window.setTimeout(() => {
      finishReset();
      toast("Password updated (demo). You can now log in.", "success");
      router.replace("/login");
    }, 500);
  };

  return (
    <div className={styles.card}>
      <Image src="/images/rtu-voice-logo.png" alt="" width={200} height={179} className={styles.cardLogo} />
      <h2 className={styles.cardTitle}>Set a new password</h2>
      <p className={`${styles.cardSubtitle} ${styles.caption}`}>Choose a strong password for your account.</p>
      <form className={styles.form} onSubmit={submit} noValidate>
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
        <button type="submit" className={styles.submit} disabled={busy}>
          {busy ? <span className="spinner" /> : null}
          Reset Password
        </button>
        <p className={`${styles.switch} ${styles.caption}`}>
          Remember your password? <Link href="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}
