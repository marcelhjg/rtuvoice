"use client";

import { useState, type FormEvent } from "react";
import { BackToDashboard, adminStyles as s } from "@/components/admin/bits";
import m from "@/components/admin/modals.module.css";
import { ConfirmDialog, SuperadminOnly } from "@/components/admin/superadmin";
import x from "@/components/admin/superadmin.module.css";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { useDemoStore } from "@/lib/demo-store";
import type { DepartmentRecord } from "@/lib/types";

type Editing = { type: "add" } | { type: "rename"; dept: DepartmentRecord } | null;
type Toggling = { dept: DepartmentRecord; active: boolean } | null;

/** Super Admin › Departments (SRS §3, §7): add, rename and deactivate departments. */
export default function DepartmentsPage() {
  return (
    <SuperadminOnly>
      <Departments />
    </SuperadminOnly>
  );
}

function Departments() {
  const { departments, complaints, deptAccounts, setDepartmentActive } = useDemoStore();
  const toast = useToast();
  const [editing, setEditing] = useState<Editing>(null);
  const [toggling, setToggling] = useState<Toggling>(null);

  const counts = (name: string) => {
    const mine = complaints.filter((c) => c.department === name);
    return { total: mine.length, open: mine.filter((c) => c.status === "Assigned" || c.status === "In Progress").length };
  };
  const heads = (name: string) => deptAccounts.filter((a) => a.department === name && a.active !== false);

  return (
    <div className="container">
      <div className={s.head}>
        <BackToDashboard />
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
                <th scope="col">Department head</th>
                <th scope="col">Open</th>
                <th scope="col">Total</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => {
                const n = counts(d.name);
                const h = heads(d.name);
                return (
                  <tr key={d.name} className={d.active ? undefined : x.inactiveRow}>
                    <td data-label="Department" className={s.strong}>
                      {d.name}
                    </td>
                    <td data-label="Department head">
                      {h.length ? (
                        h.map((a) => (
                          <span key={a.email} className={x.sub}>
                            {a.firstName} {a.lastName} · {a.email}
                          </span>
                        ))
                      ) : (
                        <span className={s.muted}>No active head account</span>
                      )}
                    </td>
                    <td data-label="Open">{n.open}</td>
                    <td data-label="Total">{n.total}</td>
                    <td data-label="Status">
                      <span className={`${s.pill} ${d.active ? x.active : x.inactive}`}>{d.active ? "Active" : "Deactivated"}</span>
                    </td>
                    <td data-label="">
                      <div className={x.rowActions}>
                        <button type="button" className={`${s.ghostBtn} ${x.slotA}`} onClick={() => setEditing({ type: "rename", dept: d })}>
                          Rename
                        </button>
                        {d.active ? (
                          <button type="button" className={`${s.outlineBtn} ${x.slotB} ${x.dangerOutline}`} onClick={() => setToggling({ dept: d, active: false })}>
                            Deactivate
                          </button>
                        ) : (
                          <button type="button" className={`${s.outlineBtn} ${x.slotB}`} onClick={() => setToggling({ dept: d, active: true })}>
                            Reactivate
                          </button>
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
      {toggling ? (
        <ConfirmDialog
          title={toggling.active ? "Reactivate this department?" : "Deactivate this department?"}
          subtitle={toggling.dept.name}
          body={
            toggling.active ? (
              <p>Admins will be able to assign complaints to it again, and its head accounts can log in.</p>
            ) : (
              <>
                <p>Admins won&apos;t be able to assign or reassign complaints to it, and its head accounts can&apos;t log in.</p>
                <p>Its past complaints stay visible in lists and statistics.</p>
              </>
            )
          }
          confirmLabel={toggling.active ? "Reactivate" : "Deactivate"}
          danger={!toggling.active}
          onCancel={() => setToggling(null)}
          onConfirm={() => {
            const error = setDepartmentActive(toggling.dept.name, toggling.active);
            if (error) return error;
            toast(`${toggling.dept.name} ${toggling.active ? "reactivated" : "deactivated"}.`, "success");
            setToggling(null);
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
      subtitle={renaming ? `Currently “${renaming.name}”. Its complaints and head accounts move to the new name.` : "It can receive complaints right away."}
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
