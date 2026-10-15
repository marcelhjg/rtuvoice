"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { ComplaintDetailsDialog } from "@/components/ComplaintDetailsDialog";
import { useDemoStore } from "@/lib/demo-store";
import { DEPARTMENTS, type Complaint, type Department } from "@/lib/types";
import { Icon } from "../Icon";
import { Modal } from "../Modal";
import { useToast } from "../Toast";
import m from "./modals.module.css";

type Open =
  | { kind: "details"; id: string }
  | { kind: "assign"; id: string; department: Department | "" }
  | { kind: "reject"; id: string }
  | { kind: "reassign"; id: string }
  | { kind: "updates"; id: string }
  | null;

/**
 * Admin pop-ups from the Figma admin frames: complaint details, reject, reassign and
 * complaint updates, plus an assign-department confirmation. Returns open functions and
 * the JSX to render once per page.
 */
export function useComplaintModals() {
  const { findComplaint, assignComplaint, rejectComplaint, reassignComplaint } = useDemoStore();
  const toast = useToast();
  const [open, setOpen] = useState<Open>(null);
  const close = () => setOpen(null);
  const c = open ? findComplaint(open.id) : undefined;

  const api = {
    openDetails: (id: string) => setOpen({ kind: "details", id }),
    openAssign: (id: string, department: Department | "" = "") => setOpen({ kind: "assign", id, department }),
    openReject: (id: string) => setOpen({ kind: "reject", id }),
    openReassign: (id: string) => {
      const target = findComplaint(id);
      if (!target || target.status !== "Assigned" || target.updates.length > 0) {
        toast("This complaint can no longer be reassigned.", "error");
        return;
      }
      setOpen({ kind: "reassign", id });
    },
    openUpdates: (id: string) => setOpen({ kind: "updates", id }),
  };

  let node: ReactNode = null;
  if (open && c) {
    if (open.kind === "details") node = <ComplaintDetailsDialog key={`details-${c.trackingId}`} complaint={c} onClose={close} />;
    if (open.kind === "assign")
      node = (
        <AssignModal
          key={c.trackingId}
          c={c}
          initial={open.department}
          onClose={close}
          onConfirm={(dept) => {
            const priority = assignComplaint(c.trackingId, dept);
            close();
            toast(`${c.trackingId} approved and assigned to ${dept}. AI priority: ${priority} (simulated).`, "success");
          }}
        />
      );
    if (open.kind === "reject")
      node = (
        <RejectModal
          key={c.trackingId}
          c={c}
          onClose={close}
          onConfirm={(reason) => {
            rejectComplaint(c.trackingId, reason);
            close();
            toast(`${c.trackingId} rejected.`, "success");
          }}
        />
      );
    if (open.kind === "reassign")
      node = (
        <ReassignModal
          key={c.trackingId}
          c={c}
          onClose={close}
          onConfirm={(dept, reason) => {
            close();
            if (!reassignComplaint(c.trackingId, dept, reason)) {
              toast("This complaint can no longer be reassigned.", "error");
              return;
            }
            toast(`${c.trackingId} reassigned to ${dept}.`, "success");
          }}
        />
      );
    if (open.kind === "updates") node = <ComplaintDetailsDialog key={`updates-${c.trackingId}`} complaint={c} onClose={close} />;
  }

  return { ...api, modals: node };
}

/* ---------------------------------------------------------------------------------- */

function AssignModal({ c, initial, onClose, onConfirm }: { c: Complaint; initial: Department | ""; onClose: () => void; onConfirm: (d: Department) => void }) {
  const [dept, setDept] = useState<Department | "">(initial);
  const [error, setError] = useState<string | null>(null);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!dept) {
      setError("Choose a department.");
      return;
    }
    onConfirm(dept);
  };
  return (
    <Modal open onClose={onClose} align="left" size="sm" title="Assign department" subtitle={`${c.trackingId} · ${c.title}`}>
      <form onSubmit={submit} noValidate className={m.form}>
        <div className={`field ${error ? "has-error" : ""}`}>
          <label htmlFor="assign-dept" className={m.label}>
            Department <span className="req">*</span>
          </label>
          <select
            id="assign-dept"
            className={`select ${dept ? "" : "is-placeholder"}`}
            value={dept}
            onChange={(e) => {
              setDept(e.target.value as Department);
              setError(null);
            }}
          >
            <option value="" disabled>
              Select department
            </option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {error ? <span className="field-error">{error}</span> : null}
        </div>
        <p className={m.note}>
          Assigning approves the complaint: its status becomes <strong>Assigned</strong>, the department is notified, and the AI step sets the
          priority and writes the public summary. <em>(AI and notifications are simulated in this demo.)</em>
        </p>
        <div className={m.footer}>
          <button type="button" className={`btn btn-soft ${m.btn}`} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={`btn btn-primary ${m.btn}`}>
            Assign &amp; approve
          </button>
        </div>
      </form>
    </Modal>
  );
}

function RejectModal({ c, onClose, onConfirm }: { c: Complaint; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const r = reason.trim();
    if (r.length < 10) {
      setError(r ? "Give a little more detail (at least 10 characters)." : "Enter a reason for rejection.");
      return;
    }
    onConfirm(r);
  };
  return (
    <Modal open onClose={onClose} align="left" size="sm" title="Reject complaint" subtitle={`${c.trackingId} · ${c.title}`}>
      <form onSubmit={submit} noValidate className={m.form}>
        <div className={`field ${error ? "has-error" : ""}`}>
          <label htmlFor="reject-reason" className={m.label}>
            Reason for rejection <span className="req">*</span>
          </label>
          <textarea
            id="reject-reason"
            className={`textarea ${m.textarea}`}
            placeholder="e.g. Not a campus concern — this is an advertisement."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError(null);
            }}
          />
          {error ? <span className="field-error">{error}</span> : null}
          <span className={m.help}>The student will see that the complaint was rejected. It is permanently deleted after 30 days.</span>
        </div>
        <div className={m.footer}>
          <button type="button" className={`btn btn-soft ${m.btn}`} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={`btn ${m.btn} ${m.danger}`}>
            Reject complaint
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ReassignModal({ c, onClose, onConfirm }: { c: Complaint; onClose: () => void; onConfirm: (d: Department, reason: string) => void }) {
  const [dept, setDept] = useState<Department | "">("");
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<{ dept?: string; reason?: string }>({});
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = {
      dept: dept ? undefined : "Choose the new department.",
      reason: reason.trim().length >= 10 ? undefined : reason.trim() ? "Give a little more detail (at least 10 characters)." : "A reason is required. It is recorded in the activity log.",
    };
    setErrors(next);
    if (next.dept || next.reason) return;
    onConfirm(dept as Department, reason);
  };
  return (
    <Modal open onClose={onClose} align="left" size="sm" title="Reassign complaint" subtitle={`${c.trackingId} · Currently with ${c.department}`}>
      <form onSubmit={submit} noValidate className={m.form}>
        {c.status === "In Progress" ? (
          <div className={m.warn} role="note">
            <Icon name="alert-triangle" size={20} />
            <p>
              <strong>This complaint is already In Progress.</strong> {c.department} has started working on it. Reassigning will pull it from their
              dashboard and notify both offices.
            </p>
          </div>
        ) : null}
        <div className={`field ${errors.dept ? "has-error" : ""}`}>
          <label htmlFor="reassign-dept" className={m.label}>
            New department <span className="req">*</span>
          </label>
          <select
            id="reassign-dept"
            className={`select ${dept ? "" : "is-placeholder"}`}
            value={dept}
            onChange={(e) => {
              setDept(e.target.value as Department);
              setErrors((x) => ({ ...x, dept: undefined }));
            }}
          >
            <option value="" disabled>
              Select department
            </option>
            {DEPARTMENTS.filter((d) => d !== c.department).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {errors.dept ? <span className="field-error">{errors.dept}</span> : null}
        </div>
        <div className={`field ${errors.reason ? "has-error" : ""}`}>
          <label htmlFor="reassign-reason" className={m.label}>
            Reason for reassignment <span className="req">*</span>
          </label>
          <textarea
            id="reassign-reason"
            className={`textarea ${m.textarea}`}
            placeholder="e.g. Mistaken assignment — issue concerns network cabling, not the building."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setErrors((x) => ({ ...x, reason: undefined }));
            }}
          />
          {errors.reason ? <span className="field-error">{errors.reason}</span> : null}
        </div>
        <div className={`${m.footer} ${m.reassignFooter}`}>
          <button type="button" className={`btn btn-soft ${m.btn} ${m.reassignButton}`} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={`btn btn-primary ${m.btn} ${m.reassignButton}`}>
            Confirm reassignment
          </button>
        </div>
      </form>
    </Modal>
  );
}
