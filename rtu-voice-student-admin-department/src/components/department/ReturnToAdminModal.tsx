"use client";

import { useState, type FormEvent } from "react";
import type { Complaint } from "@/lib/types";
import { Modal } from "../Modal";
import m from "../admin/modals.module.css";
import d from "./department.module.css";

export function ReturnToAdminModal({
  complaint,
  onClose,
  onConfirm,
}: {
  complaint: Complaint;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Enter a reason for returning this complaint.");
      return;
    }
    onConfirm(trimmed);
  };

  return (
    <Modal
      open
      onClose={onClose}
      align="left"
      size="sm"
      title="Return to Admin"
      subtitle={`${complaint.trackingId} · ${complaint.title}`}
    >
      <form className={m.form} onSubmit={submit} noValidate>
        <p className={m.note}>This complaint will go back to Admin for reassignment to the appropriate department.</p>
        <div className={`field ${error ? "has-error" : ""}`}>
          <label htmlFor="return-reason" className={m.label}>
            Reason <span className="req">*</span>
          </label>
          <textarea
            id="return-reason"
            className={`input ${m.textarea}`}
            value={reason}
            maxLength={500}
            required
            aria-invalid={!!error}
            aria-describedby={error ? "return-reason-error" : undefined}
            onChange={(event) => {
              setReason(event.target.value);
              if (error) setError("");
            }}
          />
          {error ? <span id="return-reason-error" className="field-error">{error}</span> : null}
        </div>
        <div className={d.returnFooter}>
          <button type="button" className={`btn btn-soft ${m.btn}`} onClick={onClose}>Cancel</button>
          <button type="submit" className={`btn ${m.btn} ${m.danger}`}>Confirm Return</button>
        </div>
      </form>
    </Modal>
  );
}
