"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/Toast";
import { useDemoStore } from "@/lib/demo-store";
import styles from "./receipt.module.css";

export function Receipt() {
  const params = useSearchParams();
  const { findMyComplaint } = useDemoStore();
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const id = params.get("id") ?? "";
  const complaint = id ? findMyComplaint(id) : undefined;

  if (!complaint) {
    return (
      <div className="container">
        <div className={`card ${styles.card}`}>
          <span className={`${styles.check} ${styles.checkMuted}`}>
            <Icon name="info" size={40} strokeWidth={1.8} />
          </span>
          <h1 className={styles.title}>Receipt not found</h1>
          <p className={styles.status}>We could not find a concern with that tracking ID in this browser.</p>
          <div className={styles.buttons}>
            <Link href="/dashboard" className={`btn btn-outline ${styles.btn}`}>
              Go to dashboard
            </Link>
            <Link href="/history" className={`btn btn-primary ${styles.btn}`}>
              Open History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(complaint.trackingId);
    } catch {
      // Clipboard API can be blocked (e.g. non-HTTPS); fall back to a hidden textarea.
      const t = document.createElement("textarea");
      t.value = complaint.trackingId;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setCopied(true);
    toast(`Tracking ID ${complaint.trackingId} copied.`, "success");
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="container">
      <section className={`card ${styles.card}`} aria-labelledby="receipt-title">
        <span className={styles.check}>
          <Icon name="check" size={42} strokeWidth={2} />
        </span>
        <h1 id="receipt-title" className={styles.title}>
          Your concern was submitted
        </h1>
        <p className={styles.status}>
          Status: <StatusBadge status={complaint.status} className={styles.badge} /> — an administrator will review it soon.
        </p>

        <div className={styles.idBox}>
          <div>
            <p className={styles.idLabel}>YOUR TRACKING ID</p>
            <p className={styles.idValue} aria-live="polite">
              {complaint.trackingId}
            </p>
          </div>
          <button type="button" className={styles.copy} onClick={copy}>
            <Icon name={copied ? "check" : "copy"} size={16} strokeWidth={2} />
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <div className={`alert alert-warning ${styles.save}`}>
          <Icon name="alert-triangle" size={22} />
          <p>
            <strong>Save this ID.</strong> It&apos;s the only way to look up this concern later. You can also find it on your History page.
          </p>
        </div>

        <div className={styles.buttons}>
          <Link href="/dashboard" className={`btn btn-outline ${styles.btn}`}>
            Go to dashboard
          </Link>
          <Link href={`/track?id=${encodeURIComponent(complaint.trackingId)}`} className={`btn btn-primary ${styles.btn}`}>
            Track this concern
          </Link>
        </div>

        <p className={styles.footnote}>We&apos;ll email you whenever the status changes or the department posts an update.</p>
        <p className={styles.demo}>
          <span className="demo-note">
            <Icon name="info" size={14} /> Demo build: saved in this browser only. No email is sent and no file was uploaded.
          </span>
        </p>
      </section>
    </div>
  );
}
