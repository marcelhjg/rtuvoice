"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { useDemoStore } from "@/lib/demo-store";
import { formatBytes } from "@/lib/format";
import { CATEGORIES, type Category } from "@/lib/types";
import { DESCRIPTION_MAX, EVIDENCE_ACCEPT, MAX_EVIDENCE_BYTES, TITLE_MAX, isAllowedEvidence } from "@/lib/validation";
import styles from "./report.module.css";

type Errors = Partial<Record<"title" | "category" | "description" | "files", string | null>>;

export default function ReportPage() {
  const { submitComplaint } = useDemoStore();
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  // Sharing is opt-in: nothing reaches the public dashboard unless the student ticks the box.
  const [share, setShare] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const usedBytes = files.reduce((sum, f) => sum + f.size, 0);
  const dirty = Boolean(title || category || description || files.length || share);

  const addFiles = (list: FileList | File[]) => {
    const incoming = Array.from(list);
    const rejected: string[] = [];
    let total = usedBytes;
    const accepted: File[] = [];
    for (const f of incoming) {
      if (!isAllowedEvidence(f)) {
        rejected.push(`${f.name}: file type not allowed`);
        continue;
      }
      if (files.some((x) => x.name === f.name && x.size === f.size)) continue; // already added
      if (total + f.size > MAX_EVIDENCE_BYTES) {
        rejected.push(`${f.name}: would exceed the 5 MB total limit`);
        continue;
      }
      total += f.size;
      accepted.push(f);
    }
    if (accepted.length) setFiles((prev) => [...prev, ...accepted]);
    setErrors((e) => ({ ...e, files: rejected.length ? rejected.join(". ") + "." : null }));
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const validate = (): Errors => ({
    title: !title.trim() ? "Add a short title." : title.trim().length > TITLE_MAX ? `Keep the title under ${TITLE_MAX} characters.` : null,
    category: category ? null : "Choose a category.",
    description: !description.trim()
      ? "Describe what happened."
      : description.trim().length < 20
        ? "Add a little more detail (at least 20 characters)."
        : description.length > DESCRIPTION_MAX
          ? `Keep the description under ${DESCRIPTION_MAX} characters.`
          : null,
    files: usedBytes > MAX_EVIDENCE_BYTES ? "Evidence exceeds the 5 MB total limit." : null,
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    const firstError = (["title", "category", "description", "files"] as const).find((k) => next[k]);
    if (firstError) {
      document.getElementById(`report-${firstError}`)?.focus();
      return;
    }
    setBusy(true);
    // SIMULATED submission: saved in this browser only. Files are not uploaded; only their names and sizes are kept.
    window.setTimeout(() => {
      const created = submitComplaint({
        title,
        category: category as Category,
        description,
        files: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
        optOutOfPublic: !share,
      });
      router.push(`/report/submitted?id=${encodeURIComponent(created.trackingId)}`);
    }, 700);
  };

  return (
    <div className="container">
      <div className="page-head">
        <h1 className="page-title">Report a concern</h1>
        <p className="page-subtitle" style={{ fontSize: 16 }}>
          Tell us what happened. Your identity stays shielded.
        </p>
      </div>

      <div className={`alert alert-warning ${styles.warning}`} role="note">
        <Icon name="alert-triangle" size={22} />
        <div>
          <strong>Personal matters are not handled here.</strong>
          <br />
          This system does not handle harassment, bullying, discrimination or illegal activity. Report these in person to
          Campus Security, the Guidance Office or HR.
        </div>
      </div>

      <form className={`card ${styles.card}`} onSubmit={submit} noValidate>
        {/* Title */}
        <div className={`field ${errors.title ? "has-error" : ""}`}>
          <label htmlFor="report-title" className="field-label">
            Title <span className="req">*</span>
          </label>
          <input
            id="report-title"
            className="input"
            placeholder={'e.g. "Leaking roof in Room 305"'}
            value={title}
            maxLength={TITLE_MAX + 20}
            aria-invalid={!!errors.title || undefined}
            aria-describedby={errors.title ? "report-title-err" : undefined}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errors.title) setErrors((x) => ({ ...x, title: null }));
            }}
          />
          {errors.title ? (
            <span id="report-title-err" className="field-error">
              <Icon name="alert-triangle" size={13} strokeWidth={2.2} /> {errors.title}
            </span>
          ) : null}
        </div>

        {/* Category */}
        <div className={`field ${errors.category ? "has-error" : ""}`}>
          <label htmlFor="report-category" className="field-label">
            Category <span className="req">*</span>
          </label>
          <select
            id="report-category"
            className={`select ${category ? "" : "is-placeholder"}`}
            value={category}
            aria-invalid={!!errors.category || undefined}
            aria-describedby={errors.category ? "report-category-err" : undefined}
            onChange={(e) => {
              setCategory(e.target.value as Category);
              if (errors.category) setErrors((x) => ({ ...x, category: null }));
            }}
          >
            <option value="" disabled>
              Choose a category
            </option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.category ? (
            <span id="report-category-err" className="field-error">
              <Icon name="alert-triangle" size={13} strokeWidth={2.2} /> {errors.category}
            </span>
          ) : null}
        </div>

        {/* Description */}
        <div className={`field ${errors.description ? "has-error" : ""}`}>
          <label htmlFor="report-description" className="field-label">
            Description <span className="req">*</span>
          </label>
          <textarea
            id="report-description"
            className="textarea"
            placeholder="Describe what happened, where, and when. Please don't include names or contact details."
            value={description}
            aria-invalid={!!errors.description || undefined}
            aria-describedby="report-description-hint"
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) setErrors((x) => ({ ...x, description: null }));
            }}
          />
          <div className={styles.under}>
            <span id="report-description-hint" className="field-hint">
              Do not put names or contact details in the description.
            </span>
            <span className={`field-hint ${description.length > DESCRIPTION_MAX ? styles.over : ""}`}>
              {description.length}/{DESCRIPTION_MAX}
            </span>
          </div>
          {errors.description ? (
            <span className="field-error">
              <Icon name="alert-triangle" size={13} strokeWidth={2.2} /> {errors.description}
            </span>
          ) : null}
        </div>

        {/* Evidence */}
        <div className="field">
          <span className="field-label" id="evidence-label">
            Evidence <span className="opt">(optional)</span>
          </span>
          <div
            id="report-files"
            tabIndex={0}
            role="button"
            aria-describedby="evidence-label evidence-privacy"
            className={`${styles.drop} ${dragging ? styles.dropActive : ""} ${errors.files ? styles.dropError : ""}`}
            onClick={() => fileInput.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInput.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <Icon name="upload" size={24} strokeWidth={2} className={styles.dropIcon} />
            <span className={styles.dropText}>
              <strong>Click to upload</strong> or drag files here
            </span>
            <span id="evidence-rules" className={styles.dropRules}>
              JPG/PNG, MP3/WAV, PDF or MP4 • 5 MB total per submission
            </span>
          </div>
          {/* Staff see files as "Evidence 1", "Evidence 2"…, but what is inside a file can still identify the student. */}
          <span id="evidence-privacy" className="field-hint">
            Staff can open your files. Leave out anything that shows who you are, like your face, name or ID. A voice message can identify you.
          </span>
          <input
            ref={fileInput}
            type="file"
            multiple
            accept={EVIDENCE_ACCEPT}
            className="visually-hidden"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          {errors.files ? (
            <span className="field-error" role="alert">
              <Icon name="alert-triangle" size={13} strokeWidth={2.2} /> {errors.files}
            </span>
          ) : null}

          {files.length > 0 && (
            <>
              <ul className={styles.fileList}>
                {files.map((f) => (
                  <li key={`${f.name}-${f.size}`} className={styles.fileRow}>
                    <Icon name="file-text" size={18} className={styles.fileIcon} />
                    <span className={styles.fileName}>{f.name}</span>
                    <span className={styles.fileSize}>{formatBytes(f.size)}</span>
                    <button
                      type="button"
                      className={styles.fileRemove}
                      aria-label={`Remove ${f.name}`}
                      onClick={() => setFiles((list) => list.filter((x) => x !== f))}
                    >
                      <Icon name="x" size={16} strokeWidth={2} />
                    </button>
                  </li>
                ))}
              </ul>
              <div
                className={styles.meter}
                role="meter"
                aria-label="Evidence size used"
                aria-valuemin={0}
                aria-valuemax={MAX_EVIDENCE_BYTES}
                aria-valuenow={usedBytes}
              >
                <span style={{ width: `${Math.min(100, (usedBytes / MAX_EVIDENCE_BYTES) * 100)}%` }} />
              </div>
              <span className="field-hint">{formatBytes(usedBytes)} of 5 MB used</span>
            </>
          )}
        </div>

        {/* Public dashboard opt-in */}
        <label className={styles.optOut}>
          <input type="checkbox" className="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} />
          <span>
            <span className={styles.optOutTitle}>Share a summary on the public dashboard</span>
            <span className={styles.optOutText}>
              Other logged-in students will see an AI-written, depersonalized title and summary with its status. Your name is
              never shown. Leave this unticked to keep your concern off the dashboard.
            </span>
          </span>
        </label>

        <p className={styles.shield}>
          <Icon name="shield-check" size={18} />
          Your concern is identity-shielded. Only authorized administrators can link it to your account.
        </p>

        <div className={styles.buttons}>
          <button type="button" className={`btn btn-soft ${styles.btn}`} onClick={() => (dirty ? setConfirmCancel(true) : router.push("/dashboard"))}>
            Cancel
          </button>
          <button type="submit" className={`btn btn-primary ${styles.btn}`} disabled={busy}>
            {busy ? <span className="spinner" /> : null}
            {busy ? "Submitting…" : "Submit Concern"}
          </button>
        </div>
      </form>

      <Modal
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        variant="dialog"
        title="Discard this concern?"
        subtitle="What you have entered will not be saved."
        footer={
          <>
            <button type="button" className="btn btn-soft" style={{ minHeight: 40 }} onClick={() => setConfirmCancel(false)}>
              Keep editing
            </button>
            <button type="button" className="btn btn-primary" style={{ minHeight: 40 }} onClick={() => router.push("/dashboard")}>
              Discard
            </button>
          </>
        }
      />
    </div>
  );
}
