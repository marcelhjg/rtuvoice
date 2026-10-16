"use client";

import { Icon } from "@/components/Icon";
import { StatusBadge } from "@/components/StatusBadge";
import { formatBytes, formatLongDate, formatMonthDay, formatTime } from "@/lib/format";
import type { Complaint } from "@/lib/types";
import styles from "@/app/(portal)/track/track.module.css";

type StepState = "done" | "current" | "todo" | "rejected";

function buildSteps(c: Complaint): { label: string; at?: string; state: StepState; sub?: string }[] {
  const at = (s: Complaint["status"]) => c.timeline.find((t) => t.status === s)?.at;
  if (c.status === "Rejected") {
    return [
      { label: "Submitted", at: at("Pending"), state: "done" },
      { label: "Rejected by an administrator", at: at("Rejected"), state: "rejected", sub: c.rejectionReason },
    ];
  }
  const order: Complaint["status"][] = ["Pending", "Assigned", "In Progress", "Resolved"];
  const reached = order.indexOf(c.status);
  const labels = ["Submitted", c.department ? `Approved and assigned to ${c.department}` : "Approved and assigned to a department", "In Progress", "Resolved"];
  return order.map((s, i) => ({
    label: labels[i],
    at: at(s),
    state: i < reached || (i === reached && s === "Resolved") ? "done" : i === reached ? "current" : "todo",
  }));
}

export function ComplaintStatusDetails({
  complaint: c,
  onViewUpdate,
  compact = false,
}: {
  complaint: Complaint;
  onViewUpdate?: () => void;
  compact?: boolean;
}) {
  const steps = buildSteps(c);
  return (
    <section className={`${styles.resultCard} ${compact ? styles.modalResultCard : ""}`} aria-label={`Status details for ${c.trackingId}`}>
      <div className={`${styles.resultTop} ${compact ? styles.modalResultTop : ""}`}>
        {!compact ? (
          <div>
            <p className={styles.idLabel}>TRACKING ID</p>
            <p className={styles.idValue}>{c.trackingId}</p>
          </div>
        ) : null}
        <StatusBadge status={c.status} />
      </div>

      <dl className={styles.meta}>
        {compact ? (
          <>
            <dt>Tracking ID</dt>
            <dd>{c.trackingId}</dd>
          </>
        ) : null}
        <dt>Title</dt>
        <dd>{c.title}</dd>
        <dt>Category</dt>
        <dd>{c.category}</dd>
        <dt>Submitted</dt>
        <dd>{formatLongDate(c.submittedAt)}</dd>
        <dt>Assigned to</dt>
        <dd>{c.department ?? (c.status === "Rejected" ? "—" : "Waiting for an administrator")}</dd>
      </dl>

      {/* The student's own words and files, shown in every portal. Rendered as plain text (React escapes it),
          keeping the line breaks they typed. Never the student's identity, and never the priority. */}
      <div className={styles.detailBlock}>
        <h3 className={styles.detailHeading}>Description</h3>
        <p className={styles.description}>{c.description}</p>
      </div>
      <div className={styles.detailBlock}>
        <h3 className={styles.detailHeading}>Evidence</h3>
        {c.files.length ? (
          // Frontend-only: only each file's name, size and type are stored, so there is nothing to open or download.
          <ul className={styles.evidenceList} aria-label="Attached files">
            {c.files.map((f, i) => (
              <li key={`${f.name}-${i}`} className={styles.evidenceChip}>
                <Icon name="file" size={15} strokeWidth={1.8} />
                <span className={styles.evidenceName}>{f.name}</span>
                <span className={styles.evidenceSize}>· {formatBytes(f.size)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.noEvidence}>No evidence attached</p>
        )}
      </div>

      <hr className={styles.rule} />

      <h2 className={styles.progressTitle}>Progress</h2>
      <ol className={styles.timeline}>
        {steps.map((s) => (
          <li key={s.label} className={`${styles.tlItem} ${styles[s.state]}`}>
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.tlLabel}>
              {s.label}
              <span className="visually-hidden">
                {s.state === "done" ? " (completed)" : s.state === "current" ? " (current)" : s.state === "rejected" ? " (rejected)" : " (not yet)"}
              </span>
            </span>
            <span className={styles.tlTime}>{s.at ? `${formatMonthDay(s.at)}  ·  ${formatTime(s.at)}` : "Pending"}</span>
            {s.sub ? <span className={styles.tlReason}>Reason: {s.sub}</span> : null}
          </li>
        ))}
      </ol>

      {onViewUpdate ? (
        <button type="button" className={styles.viewUpdate} onClick={onViewUpdate}>
          <Icon name="mail" size={18} strokeWidth={1.8} /> View updates
        </button>
      ) : c.updates.length === 0 && c.status !== "Rejected" ? (
        <p className={styles.noUpdate}>
          <Icon name="mail" size={16} /> No update from the department yet.
        </p>
      ) : null}
    </section>
  );
}
