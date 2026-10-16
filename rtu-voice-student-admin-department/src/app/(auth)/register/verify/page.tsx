"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { OtpVerifyCard } from "@/components/forms/OtpVerifyCard";
import { useToast } from "@/components/Toast";
import { useDemoStore } from "@/lib/demo-store";
import styles from "../../auth.module.css";

export default function RegisterVerifyPage() {
  const { ready, pendingSignup, completeSignup } = useDemoStore();
  const router = useRouter();
  const toast = useToast();
  // Set once the code is accepted. completeSignup() clears pendingSignup straight away, so without
  // this the page re-rendered into the "no registration waiting" card before the dashboard opened.
  const [finished, setFinished] = useState(false);

  if (!ready) return <div className={styles.card} aria-busy="true" style={{ minHeight: 320 }} />;

  if (finished) {
    return (
      <div className={styles.card} aria-busy="true" role="status">
        <h2 className={`${styles.cardTitle} ${styles.cardTitleNavy}`}>Account created</h2>
        <p className={`${styles.cardSubtitle} ${styles.caption}`} style={{ marginTop: 16 }}>
          <span className="spinner" /> Opening your dashboard…
        </p>
      </div>
    );
  }

  if (!pendingSignup) {
    return (
      <div className={styles.card}>
        <h2 className={`${styles.cardTitle} ${styles.cardTitleNavy}`}>Verify Account</h2>
        <p className={`${styles.cardSubtitle} ${styles.caption}`} style={{ marginTop: 16 }}>
          There is no registration waiting for a code. Start by creating your account.
        </p>
        <div className={styles.form}>
          <Link href="/register" className={styles.submit} style={{ textDecoration: "none" }}>
            Go to Register
          </Link>
        </div>
      </div>
    );
  }

  return (
    <OtpVerifyCard
      email={pendingSignup.email}
      purpose="activate"
      onVerified={() => {
        setFinished(true);
        const account = completeSignup();
        toast(`Account created. Welcome, ${account?.firstName ?? "student"}!`, "success");
        router.replace("/dashboard");
      }}
    />
  );
}
