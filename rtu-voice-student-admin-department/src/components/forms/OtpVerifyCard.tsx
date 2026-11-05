"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Icon } from "../Icon";
import { OtpInput } from "./OtpInput";
import styles from "@/app/(auth)/auth.module.css";

const RESEND_SECONDS = 60;
const GENERIC_ERROR = "Something went wrong. Please try again.";
// checkOtp on the server reads the code from these six keys, one per box.
const DIGIT_KEYS = ["first_digit", "second_digit", "third_digit", "fourth_digit", "fifth_digit", "sixth_digit"];

type Result = { success: boolean; message?: string };

interface Props {
  email: string;
  purpose: "activate" | "reset";
  onVerify: (formData: FormData) => Promise<Result>; // calls the server action with the six digits
  onResend: () => Promise<Result>;                   // asks the server for a new code
  onVerified: () => void;                            // runs after a correct code (navigate here)
  onBack?: () => void;                               // optional "wrong email?" link
}

/** OTP step shared by registration and password recovery. The server checks the code. */
export function OtpVerifyCard({ email, purpose, onVerify, onResend, onVerified, onBack }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [seconds, setSeconds] = useState(RESEND_SECONDS); // a code was just sent when this card appears
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [seconds]);

  const code = digits.join("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setInfo(null);
    if (code.length < 6) {
      setError("Enter all 6 digits of the code.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      DIGIT_KEYS.forEach((key, i) => fd.append(key, digits[i]));
      const res = await onVerify(fd);
      if (res.success) {
        onVerified(); // stay busy: the page navigates away next
        return;
      }
      setDigits(Array(6).fill(""));
      setError(res.message || GENERIC_ERROR);
    } catch (err) {
      console.error(err);
      setError(GENERIC_ERROR);
    }
    setBusy(false);
  };

  const resend = async () => {
    if (seconds > 0 || resending || busy) return;
    setResending(true);
    setError(null);
    setInfo(null);
    try {
      const res = await onResend();
      if (res.success) {
        setDigits(Array(6).fill(""));
        setSeconds(RESEND_SECONDS);
        setInfo("We sent you a new code.");
      } else {
        setError(res.message || GENERIC_ERROR);
      }
    } catch (err) {
      console.error(err);
      setError(GENERIC_ERROR);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className={styles.card}>
      <h2 className={`${styles.cardTitle} ${styles.cardTitleNavy}`}>Verify Account</h2>
      <p className={styles.cardSubtitle}>
        We sent you a 6-digit code to <strong>{email}</strong>.
        <br />
        {purpose === "activate" ? "Enter it to activate your account." : "Enter it to reset your password."} It expires in 10 minutes.
      </p>

      <form onSubmit={submit} noValidate>
        <OtpInput
          value={digits}
          onChange={(v) => {
            setDigits(v);
            if (error) setError(null);
          }}
          className={`${styles.otp} ${error ? styles.otpError : ""}`}
          boxClassName={styles.otpBox}
          invalid={!!error}
          disabled={busy}
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
            <button type="button" className={styles.resendBtn} onClick={resend} disabled={seconds > 0 || resending || busy}>
              {resending ? "Sending…" : seconds > 0 ? `Resend code (${seconds}s)` : "Resend code"}
            </button>
          </p>

          <button type="submit" className={`${styles.submit} ${styles.submitWhite}`} disabled={busy} aria-busy={busy}>
            {busy ? <span className="spinner" aria-hidden="true" /> : null}
            {busy ? "Verifying…" : "Verify Account"}
          </button>

          {onBack ? (
            <p className={styles.resend}>
              Wrong email?{" "}
              <button type="button" className={styles.resendBtn} onClick={onBack} disabled={busy}>
                Go back
              </button>
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}