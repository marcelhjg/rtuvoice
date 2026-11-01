"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";
import { StatusBadge } from "@/components/StatusBadge";
import { useToast } from "@/components/Toast";
import { getEvidenceUrl } from "@/actions/studentActions";
import { formatBytes, formatLongDate, formatMonthDay, formatTime } from "@/lib/format";
import type { Status } from "@/lib/types";
import { EXTENSIONS, type TrackedComplaint } from "@/features/student/studentTypes";
import styles from "@/app/(portal)/track/track.module.css";

// These ids match the statuses table.
const PENDING = 1;
const ASSIGNED = 2;
const IN_PROGRESS = 3;
const RESOLVED = 4;
const REJECTED = 5;

// The database names are snake_case (in_progress), so show these labels instead of status_name.
export const STATUS_LABELS: Record<number, Status> = {
  [PENDING]: "Pending",
  [ASSIGNED]: "Assigned",
  [IN_PROGRESS]: "In Progress",
  [RESOLVED]: "Resolved",
  [REJECTED]: "Rejected",
};

type StepState = "done" | "current" | "todo" | "rejected";
type Attachment = TrackedComplaint["attachments"][number];

function buildSteps(c: TrackedComplaint): { label: string; at?: string; state: StepState; sub?: string }[] {
  const reached = (id: number) => c.progress.filter((p) => p.entry_kind === "status" && p.entry_status_id === id).pop();
  const submittedAt = c.progress.find((p) => p.entry_kind === "submitted")?.entry_at ?? c.created_at;

  if (c.status_id === REJECTED) {
    const r = reached(REJECTED);
    return [
      { label: "Submitted", at: submittedAt, state: "done" },
      { label: "Rejected by an administrator", at: r?.entry_at, state: "rejected", sub: r?.entry_message ?? undefined },
    ];
  }

  const order = [PENDING, ASSIGNED, IN_PROGRESS, RESOLVED];
  const current = order.indexOf(c.status_id);
  const labels = [
    "Submitted",
    c.department_name ? `Approved and assigned to ${c.department_name}` : "Approved and assigned to a department",
    "In Progress",
    "Resolved",
  ];
  return order.map((id, i) => ({
    label: labels[i],
    at: id === PENDING ? submittedAt : reached(id)?.entry_at,
    state: i < current || (i === current && id === RESOLVED) ? "done" : i === current ? "current" : "todo",
  }));
}

const fileKind = (type: string) =>
  type.startsWith("image/") ? "Image" : type.startsWith("audio/") ? "Audio" : type.startsWith("video/") ? "Video" : type === "application/pdf" ? "PDF" : "File";

export function ComplaintStatusDetails({
  complaint: c,
  onViewUpdate,
  compact = false,
  forStaff = false,
}: {
  complaint: TrackedComplaint;
  onViewUpdate?: () => void;
  compact?: boolean;
  forStaff?: boolean; // staff see neutral names ("Evidence 1"); the student sees their own file names
}) {
  const steps = buildSteps(c);
  const toast = useToast();
  const [busyFile, setBusyFile] = useState<number | null>(null);

  const labelFor = (a: Attachment, i: number) => (forStaff || !a.file_name ? `Evidence ${i + 1}` : a.file_name);

  const openEvidence = async (a: Attachment, mode: "open" | "download") => {
    // Open the tab now, while still inside the click, so pop-up blockers allow it; load the link into it once signed.
    const tab = mode === "open" ? window.open("", "_blank") : null;
    if (tab) tab.opener = null;
    setBusyFile(a.id);
    let url: string | null = null;
    try {
      const res = await getEvidenceUrl(a.id, mode === "download");
      url = res.success && res.url ? res.url : null;
    } catch {
      url = null;
    } finally {
      setBusyFile(null);
    }
    if (!url) {
      tab?.close();
      toast("The file couldn't be opened. Try again in a moment.", "error");
      return;
    }
    if (tab) {
      tab.location.href = url;
    } else {
      // The signed link is created with a download name, so the storage server sends it as an attachment.
      const link = document.createElement("a");
      link.href = url;
      link.rel = "noopener";
      document.body.append(link);
      link.click();
      link.remove();
    }
  };

  return (
    <section className={`${styles.resultCard} ${compact ? styles.modalResultCard : ""}`} aria-label={`Status details for ${c.tracking_id}`}>
      <div className={`${styles.resultTop} ${compact ? styles.modalResultTop : ""}`}>
        {!compact ? (
          <div>
            <p className={styles.idLabel}>TRACKING ID</p>
            <p className={styles.idValue}>{c.tracking_id}</p>
          </div>
        ) : null}
        <StatusBadge status={STATUS_LABELS[c.status_id]} />
      </div>

      <dl className={styles.meta}>
        {compact ? (
          <>
            <dt>Tracking ID</dt>
            <dd>{c.tracking_id}</dd>
          </>
        ) : null}
        <dt>Title</dt>
        <dd>{c.title}</dd>
        <dt>Category</dt>
        <dd>{c.category_name}</dd>
        <dt>Submitted</dt>
        <dd>{formatLongDate(c.created_at)}</dd>
        <dt>Assigned to</dt>
        <dd>{c.department_name ?? (c.status_id === REJECTED ? "—" : "Waiting for an administrator")}</dd>
      </dl>

      {/* The student's own words and files. Rendered as plain text (React escapes it), keeping the line breaks they typed. */}
      <div className={styles.detailBlock}>
        <h3 className={styles.detailHeading}>Description</h3>
        <p className={styles.description}>{c.description}</p>
      </div>
      <div className={styles.detailBlock}>
        <h3 className={styles.detailHeading}>Evidence</h3>
        {c.attachments.length ? (
          <ul className={styles.evidenceList} aria-label="Attached files">
            {c.attachments.map((a, i) => {
              const label = labelFor(a, i);
              return (
                <li key={a.id} className={styles.evidenceChip}>
                  <span className={styles.evidenceInfo}>
                    <Icon name="file" size={15} strokeWidth={1.8} />
                    <span className={styles.evidenceText}>
                      {/* Long names are cut to two lines; the full name is in the tooltip. */}
                      <span className={styles.evidenceName} title={label}>
                        {label}
                      </span>
                      <span className={styles.evidenceSize}>
                        {forStaff ? `${fileKind(a.file_type)} · ` : ""}
                        {a.file_size != null ? formatBytes(a.file_size) : ""}
                      </span>
                    </span>
                  </span>
                  <span className={styles.evidenceActions}>
                    <button type="button" className={styles.evidenceBtn} onClick={() => openEvidence(a, "open")} disabled={busyFile === a.id} aria-label={`Open ${label}`}>
                      <Icon name="eye" size={15} strokeWidth={1.9} /> <span className={styles.evidenceBtnLabel}>Open</span>
                    </button>
                    <button type="button" className={styles.evidenceBtn} onClick={() => openEvidence(a, "download")} disabled={busyFile === a.id} aria-label={`Download ${label}`}>
                      <Icon name="download" size={15} strokeWidth={1.9} /> <span className={styles.evidenceBtnLabel}>Download</span>
                    </button>
                  </span>
                </li>
              );
            })}
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
      ) : c.updates.length === 0 && c.status_id !== REJECTED ? (
        <p className={styles.noUpdate}>
          <Icon name="mail" size={16} /> No update from the department yet.
        </p>
      ) : null}
    </section>
  );
}