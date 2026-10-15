"use client";

import Link from "next/link";
import { useState } from "react";
import { ComplaintDetailsDialog } from "@/components/ComplaintDetailsDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { useDemoStore } from "@/lib/demo-store";
import { formatShortDate } from "@/lib/format";
import type { Complaint } from "@/lib/types";
import styles from "./history.module.css";

export default function HistoryPage() {
  const { myComplaints } = useDemoStore();
  const rows = [...myComplaints].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  return (
    <div className="container">
      <div className="page-head">
        <h1 className="page-title">History</h1>
        <p className="page-subtitle">Every concern you&apos;ve submitted. Rejected submissions stay listed for 30 days, then are permanently deleted.</p>
      </div>

      {rows.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>You haven&apos;t submitted any concerns yet.</p>
          <Link href="/report" className="btn btn-yellow">
            Report an incident
          </Link>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <caption className="visually-hidden">Your submitted concerns</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Tracking ID</th>
                <th scope="col">Title</th>
                <th scope="col">Category</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.trackingId}>
                  <td data-label="Date" className={styles.date}>
                    {formatShortDate(c.submittedAt)}
                  </td>
                  <td data-label="Tracking ID">
                    <button type="button" className={styles.idLink} aria-label={`View details for ${c.trackingId}`} onClick={() => setSelectedComplaint(c)}>
                      {c.trackingId}
                    </button>
                  </td>
                  <td data-label="Title" className={styles.title}>
                    {c.title}
                  </td>
                  <td data-label="Category">{c.category}</td>
                  <td data-label="Status">
                    <StatusBadge status={c.status} className={`badge-plain ${styles.badge}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedComplaint ? <ComplaintDetailsDialog complaint={selectedComplaint} onClose={() => setSelectedComplaint(null)} /> : null}
    </div>
  );
}
