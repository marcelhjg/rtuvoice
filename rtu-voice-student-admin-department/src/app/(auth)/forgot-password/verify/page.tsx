"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { OtpVerifyCard } from "@/components/forms/OtpVerifyCard";
import { useDemoStore } from "@/lib/demo-store";
import styles from "../../auth.module.css";

export default function ForgotPasswordVerifyPage() {
  const { ready, resetEmail, markResetVerified } = useDemoStore();
  const router = useRouter();

  // Load the next step ahead of time so the switch after the code is quick.
  useEffect(() => {
    router.prefetch("/forgot-password/reset");
  }, [router]);

  if (!ready) return <div className={styles.card} aria-busy="true" style={{ minHeight: 320 }} />;

  if (!resetEmail) {
    return (
      <div className={styles.card}>
        <h2 className={`${styles.cardTitle} ${styles.cardTitleNavy}`}>Verify Account</h2>
        <p className={`${styles.cardSubtitle} ${styles.caption}`} style={{ marginTop: 16 }}>
          Enter your university email first so we know where to send the code.
        </p>
        <div className={styles.form}>
          <Link href="/forgot-password" className={styles.submit} style={{ textDecoration: "none" }}>
            Go to Forgot Password
          </Link>
        </div>
      </div>
    );
  }

  return (
    <OtpVerifyCard
      email={resetEmail}
      purpose="reset"
      onVerified={() => {
        markResetVerified();
        router.replace("/forgot-password/reset");
      }}
    />
  );
}
