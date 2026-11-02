"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Icon } from "../Icon";
import styles from "./ReturnedInfo.module.css";

export interface ReturnedDetails {
  department: string;
  at: string;
  reason: string;
}

function formatReturnedAt(value: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

export function ReturnedPill({ details }: { details: ReturnedDetails }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  return (
    <span className={styles.root} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.pill}
        aria-label={`Returned by ${details.department}. Show return details.`}
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={() => setOpen(true)}
        onMouseEnter={() => setOpen(true)}
      >
        <Icon name="undo" size={13} strokeWidth={2} />
        Returned
      </button>
      {open ? (
        <ReturnedPopover id={popoverId} details={details} onClose={() => setOpen(false)} />
      ) : null}
    </span>
  );
}

export function ReturnedPopover({ id, details, onClose }: { id: string; details: ReturnedDetails; onClose: () => void }) {
  return (
    <span className={styles.popover} id={id} role="dialog" aria-label="Return details">
      <span className={styles.popoverHeading}>Returned by {details.department}</span>
      <span className={styles.date}>{formatReturnedAt(details.at)}</span>
      <span className={styles.reasonLabel}>Reason</span>
      <span className={styles.reason}>&ldquo;{details.reason}&rdquo;</span>
      <span className={styles.hint}>Assign it to another department to continue.</span>
      <button type="button" className={styles.close} onClick={onClose}>Close</button>
    </span>
  );
}

export function ReturnedNote({ details }: { details: ReturnedDetails }) {
  return (
    <div className={styles.note}>
      <Icon name="undo" size={17} strokeWidth={2} aria-hidden="true" />
      <div>
        <strong>Returned by {details.department}</strong>
        <span>{formatReturnedAt(details.at)}</span>
        <span className={styles.noteReason}>{details.reason}</span>
      </div>
    </div>
  );
}
