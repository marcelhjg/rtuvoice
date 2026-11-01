"use client";

import Link from "next/link";
import { useState } from "react";
import { ComplaintDetailsDialog } from "@/components/ComplaintDetailsDialog";
import { STATUS_LABELS } from "@/components/ComplaintStatusDetails";
import { StatusBadge } from "@/components/StatusBadge";
import { getComplaintDetails } from "@/actions/studentActions";
import { formatShortDate } from "@/lib/format";
import type { HistoryRow, TrackedComplaint } from "@/features/student/studentTypes";
import styles from "./history.module.css";

const OPEN_ERROR = "We couldn't open that concern. Please try again.";

export function HistoryTable({
  rows,
  categoryNames,
  loadError,
}: {
  rows: HistoryRow[];
  categoryNames: Record<number, string>;
  loadError: string | null;
}) {
  const sorted = [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at)); // newest first

  const [selected, setSelected] = useState<TrackedComplaint | null>(null);
  const [opening, setOpening] = useState<string | null>(null); // tracking ID being loaded
  const [openError, setOpenError] = useState<string | null>(null);

  const openDetails = async (trackingId: string) => {
    if (opening) return;
    setOpening(trackingId);
    setOpenError(null);
    try {
      const res = await getComplaintDetails(trackingId);
      if (res.success && "trackResult" in res && res.trackResult) {
        setSelected(res.trackResult);
      } else {
        setOpenError(res.message || OPEN_ERROR);
      }
    } catch (err) {
      console.error(err);
      setOpenError(OPEN_ERROR);
    } finally {
      setOpening(null);
    }
  };

  return (
    <div className="container">
      <div className="page-head">
        <h1 className="page-title">History</h1>
        <p className="page-subtitle">Every concern you&apos;ve submitted. Rejected submissions stay listed for 30 days, then are permanently deleted.</p>
      </div>

      {openError ? (
        <p className="alert alert-error" role="alert">
          {openError}
        </p>
      ) : null}

      {loadError ? (
        <div className={styles.empty} role="alert">
          <p className={styles.emptyTitle}>{loadError}</p>
          <Link href="/history" className="btn btn-outline">
            Try again
          </Link>
        </div>
      ) : sorted.length === 0 ? (
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
              {sorted.map((c) => (
                <tr key={c.tracking_id}>
                  <td data-label="Date" className={styles.date}>
                    {formatShortDate(c.created_at)}
                  </td>
                  <td data-label="Tracking ID">
                    <button
                      type="button"
                      className={styles.idLink}
                      aria-label={`View details for ${c.tracking_id}`}
                      aria-busy={opening === c.tracking_id}
                      disabled={opening !== null}
                      onClick={() => openDetails(c.tracking_id)}
                    >
                      {c.tracking_id}
                    </button>
                  </td>
                  <td data-label="Title" className={styles.title}>
                    {c.title}
                  </td>
                  <td data-label="Category">{categoryNames[c.category_id] ?? "—"}</td>
                  <td data-label="Status">
                    <StatusBadge status={STATUS_LABELS[c.status_id]} className={`badge-plain ${styles.badge}`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected ? <ComplaintDetailsDialog complaint={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}