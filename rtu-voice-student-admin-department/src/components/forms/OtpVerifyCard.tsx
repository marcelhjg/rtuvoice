"use client";

import { useEffect, useState, type FormEvent } from "react";
import { DEMO_OTP } from "@/lib/demo-data";
import { Icon } from "../Icon";
import { OtpInput } from "./OtpInput";
import styles from "@/app/(auth)/auth.module.css";

const RESEND_SECONDS = 60;
const MAX_ATTEMPTS = 3; // wrong tries per code (Terms of Use §2)
const MAX_RESENDS = 5; // then blocked for 1 day (SRS v3)

interface Props {
  email: string;
  purpose: "activate" | "reset";
  onVerified: () => void;
}

/**
 * OTP step shared by registration and password recovery.
 * SIMULATED: no email is sent; the demo accepts the fixed code shown on screen.
 */
export function OtpVerifyCard({ email, purpose, onVerified }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [attempts, setAttempts] = useState(0);
  const [resends, setResends] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [seconds]);

  const locked = attempts >= MAX_ATTEMPTS;
  const blocked = resends >= MAX_RESENDS;
  const code = digits.join("");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setInfo(null);
    if (locked) {
      setError("Too many wrong tries. Request a new code.");
      return;
    }
    if (code.length < 6) {
      setError("Enter all 6 digits of the code.");
      return;
    }
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      if (code === DEMO_OTP) {
        setError(null);
        onVerified();
      } else {
        const used = attempts + 1;
        setAttempts(used);
        setDigits(Array(6).fill(""));
        setError(
          used >= MAX_ATTEMPTS
            ? "Too many wrong tries. This code no longer works. Request a new code."
            : `That code is incorrect. ${MAX_ATTEMPTS - used} ${MAX_ATTEMPTS - used === 1 ? "try" : "tries"} left.`,
        );
      }
    }, 500);
  };

  const resend = () => {
    if (seconds > 0 || blocked) return;
    const n = resends + 1;
    setResends(n);
    setAttempts(0);
    setDigits(Array(6).fill(""));
    setError(null);
    setSeconds(RESEND_SECONDS);
    setInfo(
      n >= MAX_RESENDS
        ? "Code resent (simulated). You have reached the resend limit; further requests are blocked for 1 day."
        : `A new code was "sent" (simulated). ${MAX_RESENDS - n} resend${MAX_RESENDS - n === 1 ? "" : "s"} left.`,
    );
  };

  return (
    <div className={styles.card}>
      <h2 className={`${styles.cardTitle} ${styles.cardTitleNavy}`}>Verify Account</h2>
      <p className={styles.cardSubtitle}>
        We sent you a 6-digit code to <strong>{email}</strong>.
        <br />
        {purpose === "activate" ? "Enter it to activate your account." : "Enter it to reset your password."}
      </p>

      <form onSubmit={submit} noValidate>
        <OtpInput
          value={digits}
          onChange={(v) => {
            setDigits(v);
            if (error && !locked) setError(null);
          }}
          className={`${styles.otp} ${error ? styles.otpError : ""}`}
          boxClassName={styles.otpBox}
          invalid={!!error}
          disabled={locked}
        />

        <div className={styles.form} style={{ marginTop: 26 }}>
          {error ? (
            <p className={styles.formError} role="alert">
              <Icon name="alert-triangle" size={16} /> {error}
            </p>
          ) : null}
          {info ? (
            <p className="alert alert-info" role="status" style={{ padding: "10px 12px" }}>
              {info}
            </p>
          ) : null}

          <p className={styles.resend}>
            Didn&apos;t get it?{" "}
            <button type="button" className={styles.resendBtn} onClick={resend} disabled={seconds > 0 || blocked}>
              {blocked ? "Resend limit reached" : seconds > 0 ? `Resend code (${seconds}s)` : "Resend code"}
            </button>
          </p>

          <button type="submit" className={`${styles.submit} ${styles.submitWhite}`} disabled={busy || locked}>
            {busy ? <span className="spinner" /> : null}
            Verify Account
          </button>
        </div>
      </form>
    </div>
  );
}
