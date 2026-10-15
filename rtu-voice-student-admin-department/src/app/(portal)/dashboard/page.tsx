"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { StatusBadge } from "@/components/StatusBadge";
import { useDemoStore } from "@/lib/demo-store";
import { formatMonthDay } from "@/lib/format";
import styles from "./dashboard.module.css";

export default function DashboardPage() {
  const { session, publicConcerns } = useDemoStore();

  // Most recent resolved entries from the public dashboard (demo data).
  const recentResolved = publicConcerns.filter((c) => c.status === "Resolved")
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);

  return (
    <div className="container">
      <div className="page-head">
        <h1 className="page-title">Welcome back, {session?.firstName}</h1>
        <p className="page-subtitle">What would you like to do today?</p>
      </div>

      <div className={styles.actions}>
        <section className={`card ${styles.action}`} aria-labelledby="file-title">
          <span className={`${styles.actionIcon} ${styles.iconYellow}`}>
            <Icon name="file-text" size={30} strokeWidth={1.6} />
          </span>
          <div className={styles.actionBody}>
            <h2 id="file-title" className={styles.actionTitle}>
              File a new complaint
            </h2>
            <p className={styles.actionText}>Raise a campus concern in a few minutes. You&apos;ll get a tracking ID right away.</p>
            <Link href="/report" className="btn btn-yellow">
              Report an incident
            </Link>
          </div>
        </section>

        <section className={`card ${styles.action}`} aria-labelledby="track-title">
          <span className={`${styles.actionIcon} ${styles.iconBlue}`}>
            <Icon name="search" size={30} strokeWidth={1.8} />
          </span>
          <div className={styles.actionBody}>
            <h2 id="track-title" className={styles.actionTitle}>
              Track an existing complaint
            </h2>
            <p className={styles.actionText}>Enter your tracking ID to see the status and any update from the department.</p>
            <Link href="/track" className="btn btn-primary">
              Open status tracker
            </Link>
          </div>
        </section>
      </div>

      <section className={`panel ${styles.recent}`} aria-labelledby="recent-title">
        <div className={styles.recentHead}>
          <div>
            <h2 id="recent-title" className={styles.recentTitle}>
              Recent resolved complaints
            </h2>
            <p className={styles.recentSub}>Shared by students on the public dashboard</p>
          </div>
          <Link href="/public-dashboard?status=Resolved" className={styles.viewAll}>
            View all <Icon name="arrow-right" size={14} strokeWidth={2.4} />
          </Link>
        </div>
        {recentResolved.length === 0 ? (
          <p className={styles.empty}>No resolved complaints have been shared yet.</p>
        ) : (
          <ul className={styles.recentList}>
            {recentResolved.map((c) => (
              <li key={c.id} className={styles.recentItem}>
                <div className={styles.recentText}>
                  <span className={styles.itemTitle}>{c.title}</span>
                  <span className={styles.itemMeta}>
                    {c.category} • {formatMonthDay(c.date)}
                  </span>
                </div>
                <StatusBadge status={c.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
