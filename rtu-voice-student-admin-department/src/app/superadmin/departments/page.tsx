"use client";

import { useState, type FormEvent } from "react";
import { LockedChip, adminStyles as s } from "@/components/admin/bits";
import m from "@/components/admin/modals.module.css";
import { ConfirmDialog } from "@/components/admin/superadmin";
import x from "@/components/admin/superadmin.module.css";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { useDemoStore } from "@/lib/demo-store";
import type { DepartmentRecord } from "@/lib/types";

type Editing = { type: "add" } | { type: "rename"; dept: DepartmentRecord } | null;
type Deactivating = DepartmentRecord | null;

/**
 * Superadmin Portal › Departments (SRS §3): add, rename and deactivate departments. Deactivation is final
 * (no reactivate in this scope). About 5 departments are expected; the final list is not yet set.
 */
export default function DepartmentsPage() {
  const { departments, complaints, deptAccounts, deactivateDepartment } = useDemoStore();
  const toast = useToast();
  const [editing, setEditing] = useState<Editing>(null);
  const [deactivating, setDeactivating] = useState<Deactivating>(null);

  // Open = Assigned or In Progress. Shown because a department with open complaints can't be deactivated.
  // (No other counts here: system-wide statistics are out of the superadmin's scope.)
  const openCount = (name: string) => complaints.filter((c) => c.department === name && (c.status === "Assigned" || c.status === "In Progress")).length;
  // The department's one active, shared account.
  const accountOf = (name: string) => deptAccounts.find((a) => a.department === name && a.active !== false);

  return (
    <div className="container">
      <div className={s.head}>
        <div className={s.listTitleRow}>
          <h1 className={s.listTitle}>Departments</h1>
          <span className={`${s.countPill} ${s.pillTotal}`} aria-label={`${departments.length} departments`}>
            {departments.length}
          </span>
        </div>
        <p className={s.subtitle}>The offices complaints can be assigned to. Deactivated departments stop receiving new complaints; their history stays.</p>
      </div>

      <section className={s.panel} aria-label="Departments">
        <div className={s.toolbar}>
          <button type="button" className={`btn btn-primary ${x.toolbarAction}`} onClick={() => setEditing({ type: "add" })}>
            <Icon name="plus" size={16} strokeWidth={2.4} /> Add department
          </button>
        </div>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <caption className="visually-hidden">Departments</caption>
            <thead>
              <tr>
                <th scope="col">Department</th>
                <th scope="col">Account</th>
                <th scope="col">Open complaints</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => {
                const acc = accountOf(d.name);
                return (
                  <tr key={d.name} className={d.active ? undefined : x.inactiveRow}>
                    <td data-label="Department" className={s.strong}>
                      {d.name}
                    </td>
                    <td data-label="Account" className={x.headCell}>
                      {acc ? (
                        <span>
                          <span className={x.headName}>
                            {acc.firstName} {acc.lastName}
                          </span>
                          <span className={x.sub}>{acc.email}</span>
                        </span>
                      ) : (
                        <span className={s.muted}>No active account</span>
                      )}
                    </td>
                    <td data-label="Open complaints">{openCount(d.name)}</td>
                    <td data-label="Status">
                      <span className={`${s.pill} ${d.active ? x.active : x.inactive}`}>{d.active ? "Active" : "Deactivated"}</span>
                    </td>
                    <td data-label="">
                      <div className={x.rowActions}>
                        <button type="button" className={`${s.ghostBtn} ${x.slotA}`} onClick={() => setEditing({ type: "rename", dept: d })}>
                          Rename
                        </button>
                        {d.active ? (
                          <button type="button" className={`${s.outlineBtn} ${x.slotB} ${x.dangerOutline}`} onClick={() => setDeactivating(d)}>
                            Deactivate
                          </button>
                        ) : (
                          <LockedChip reason="Deactivated departments can't be reactivated." />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {editing ? <DepartmentNameModal editing={editing} onClose={() => setEditing(null)} /> : null}
      {deactivating ? (
        <ConfirmDialog
          title="Deactivate this department?"
          subtitle={deactivating.name}
          body={
            <>
              <p>Admins won&apos;t be able to assign or reassign complaints to it, and its account can&apos;t log in.</p>
              <p>Its past complaints stay visible in lists and statistics.</p>
              <p>
                <strong>This can&apos;t be undone.</strong>
              </p>
            </>
          }
          confirmLabel="Deactivate"
          danger
          onCancel={() => setDeactivating(null)}
          onConfirm={() => {
            const error = deactivateDepartment(deactivating.name);
            if (error) return error;
            toast(`${deactivating.name} deactivated.`, "success");
            setDeactivating(null);
            return null;
          }}
        />
      ) : null}
    </div>
  );
}

function DepartmentNameModal({ editing, onClose }: { editing: NonNullable<Editing>; onClose: () => void }) {
  const { addDepartment, renameDepartment } = useDemoStore();
  const toast = useToast();
  const renaming = editing.type === "rename" ? editing.dept : null;
  const [name, setName] = useState(renaming?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const result = renaming ? renameDepartment(renaming.name, name) : addDepartment(name);
    if (result) {
      setError(result);
      setBusy(false);
      return;
    }
    toast(renaming ? `${renaming.name} renamed to ${name.trim()}.` : `${name.trim()} added.`, "success");
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      align="left"
      size="sm"
      title={renaming ? "Rename department" : "Add department"}
      subtitle={renaming ? `Currently “${renaming.name}”. Its complaints and account move to the new name.` : "It can receive complaints right away."}
    >
      <form onSubmit={submit} noValidate className={m.form}>
        <div className={`field ${error ? "has-error" : ""}`}>
          <label htmlFor="dept-name" className={m.label}>
            Department name <span className="req">*</span>
          </label>
          <input
            id="dept-name"
            className="input"
            maxLength={60}
            placeholder="e.g. Guidance Office"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
          />
          {error ? <span className="field-error">{error}</span> : null}
        </div>
        <div className={m.footer}>
          <button type="button" className={`btn btn-soft ${m.btn}`} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={`btn btn-primary ${m.btn}`} disabled={busy}>
            {renaming ? "Rename" : "Add department"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
