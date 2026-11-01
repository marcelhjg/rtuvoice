"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OtpVerifyCard } from "@/components/forms/OtpVerifyCard";
import { useToast } from "@/components/Toast";
import { useDemoStore } from "@/lib/demo-store";
import styles from "../../auth.module.css";

export default function RegisterVerifyPage() {
  const { ready, pendingSignup, completeSignup } = useDemoStore();
  const router = useRouter();
  const toast = useToast();
  // Once the code is accepted, completeSignup() clears pendingSignup straight away. Keep the email so
  // this same card stays on screen until the dashboard appears (no in-between screen).
  const [doneEmail, setDoneEmail] = useState<string | null>(null);
  const email = pendingSignup?.email ?? doneEmail;

  // Load the dashboard ahead of time so the switch after the code is quick.
  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  if (!ready) return <div className={styles.card} aria-busy="true" style={{ minHeight: 320 }} />;

  if (!email) {
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
      email={email}
      purpose="activate"
      onVerified={() => {
        setDoneEmail(email);
        const account = completeSignup();
        toast(`Account created. Welcome, ${account?.firstName ?? "student"}!`, "success");
        router.replace("/dashboard");
      }}
    />
  );
}
