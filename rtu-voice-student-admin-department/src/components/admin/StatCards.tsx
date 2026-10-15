"use client";

import Link from "next/link";
import { Icon } from "../Icon";
import styles from "./StatCards.module.css";

export interface StatCounts {
  total: number;
  assigned: number;
  inProgress: number;
  resolved: number;
}

/** The four clickable statistics boxes above the admin dashboard tabs. */
export function StatCards({ counts, base = "/admin", totalLabel = "Total complaints" }: { counts: StatCounts; base?: string; totalLabel?: string }) {
  const cards = [
    { href: `${base}/complaints`, label: totalLabel, value: counts.total, tone: styles.total },
    { href: `${base}/assigned`, label: "Assigned", value: counts.assigned, tone: styles.assigned },
    { href: `${base}/in-progress`, label: "In progress", value: counts.inProgress, tone: styles.progress },
    { href: `${base}/resolved`, label: "Resolved", value: counts.resolved, tone: styles.resolved },
  ];
  return (
    <ul className={styles.grid}>
      {cards.map((c) => (
        <li key={c.href}>
          <Link href={c.href} className={`${styles.card} ${c.tone}`} aria-label={`${c.label}: ${c.value}. Open list`}>
            <span className={styles.label}>{c.label}</span>
            <span className={styles.value}>{c.value}</span>
            <span className={styles.arrow} aria-hidden="true">
              <Icon name="arrow-right" size={14} strokeWidth={2.6} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
