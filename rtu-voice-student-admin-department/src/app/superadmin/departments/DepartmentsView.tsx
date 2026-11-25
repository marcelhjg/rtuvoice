"use client";

import { useState, type FormEvent } from "react";
import { addDepartment, renameDepartment, setDepartmentActive } from "@/actions/superAdminActions";
import { EmptyState, Pager, SearchBox, adminStyles as s } from "@/components/admin/bits";
import m from "@/components/admin/modals.module.css";
import { ConfirmDialog } from "@/components/admin/superadmin";
import x from "@/components/admin/superadmin.module.css";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { useDebouncedSearch, useUrlFilters } from "@/components/admin/useUrlFilters";
import type { DepartmentAccountRow } from "@/features/superAdmin/superAdminTypes";

type Editing = { type: "add" } | { type: "rename"; dept: DepartmentAccountRow } | null;
type Confirming = { dept: DepartmentAccountRow; action: "deactivate" | "reactivate" } | null;

/** Superadmin Portal › Departments: add, rename, deactivate and reactivate departments. */
export function DepartmentsView({
  rows,
  total,
  overallTotal,
  page,
  pageSize,
  error,
}: {
  rows: DepartmentAccountRow[];
  total: number;
  overallTotal: number;
  page: number;
  pageSize: number;
  error: string | null;
}) {
  const toast = useToast();
  const { params, update, pending: loading, refresh } = useUrlFilters();
  const statusParam = params.get("status");
  const status = statusParam === "active" || statusParam === "inactive" ? statusParam : "all";
  const [query, setQuery] = useDebouncedSearch(params.get("q") ?? "", (v) => update({ q: v, page: 1 }));
  const [editing, setEditing] = useState<Editing>(null);
  const [confirming, setConfirming] = useState<Confirming>(null);
  const filtered = Boolean(query || status !== "all");

  // Returns the error to show inside the dialog, or null once it worked.
  const changeActive = async (dept: DepartmentAccountRow, isActive: boolean): Promise<string | null> => {
    try {
      const res = await setDepartmentActive(dept.department_id, isActive);
      if (!res.success) return res.message; // e.g. a department with open complaints can't be deactivated
      toast(`${dept.department} ${isActive ? "reactivated" : "deactivated"}.`, "success");
      setConfirming(null);
      refresh();
      return null;
    } catch (err) {
      console.error(err);
      return "Something went wrong. Please try again.";
    }
  };

  return (
    <div className="container">
      <div className={s.head}>
        <div className={s.listTitleRow}>
          <h1 className="page-title">Departments</h1>
          <span className={`${s.countPill} ${s.pillTotal}`} aria-label={`${total} of ${overallTotal} departments shown`}>
            {total}
          </span>
        </div>
        <p className={s.subtitle}>The offices complaints can be assigned to. Deactivated departments stop receiving new complaints; their history stays.</p>
      </div>

      <section className={s.panel} aria-label="Departments" aria-busy={loading} style={{ opacity: loading ? 0.6 : 1 }}>
        <div className={s.toolbar}>
          <SearchBox value={query} onChange={setQuery} label="Search by department or account" />
          <select
            aria-label="Filter by status"
            className={`select ${s.filter}`}
            value={status}
            onChange={(e) => update({ status: e.target.value === "all" ? "" : e.target.value, page: 1 })}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Deactivated</option>
          </select>
          <button type="button" className={`btn btn-primary ${x.toolbarAction}`} onClick={() => setEditing({ type: "add" })}>
            <Icon name="plus" size={16} strokeWidth={2.4} /> Add department
          </button>
        </div>

        {error ? (
          <p className="alert alert-error" role="alert" style={{ margin: 16 }}>
            {error}
          </p>
        ) : null}

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
              {rows.map((d) => (
                <tr key={d.department_id} className={d.is_active ? undefined : x.inactiveRow}>
                  <td data-label="Department" className={s.strong}>
                    {d.department}
                  </td>
                  <td data-label="Account" className={x.headCell}>
                    {/* the RPC returns the account's address as `email` */}
                    {d.email ? (
                      <span>
                        <span className={x.headName}>{d.account_name}</span>
                        <span className={x.sub}>{d.email}</span>
                      </span>
                    ) : (
                      <span className={s.muted}>No account yet</span>
                    )}
                  </td>
                  <td data-label="Open complaints">{d.open_complaints}</td>
                  <td data-label="Status">
                    <span className={`${s.pill} ${d.is_active ? x.active : x.inactive}`}>{d.is_active ? "Active" : "Deactivated"}</span>
                  </td>
                  <td data-label="">
                    <div className={x.rowActions}>
                      <button type="button" className={`${s.ghostBtn} ${x.slotA}`} onClick={() => setEditing({ type: "rename", dept: d })}>
                        Rename
                      </button>
                      {d.is_active ? (
                        <button type="button" className={`${s.outlineBtn} ${x.slotB} ${x.dangerOutline}`} onClick={() => setConfirming({ dept: d, action: "deactivate" })}>
                          Deactivate
                        </button>
                      ) : (
                        <button type="button" className={`${s.outlineBtn} ${x.slotB}`} onClick={() => setConfirming({ dept: d, action: "reactivate" })}>
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && !error ? (
            <EmptyState
              className={x.empty}
              message={filtered ? "No departments match these filters." : "No departments yet."}
              action={
                filtered
                  ? {
                      label: "Clear filters",
                      onClick: () => {
                        setQuery("");
                        update({ q: "", status: "", page: 1 });
                      },
                    }
                  : undefined
              }
            />
          ) : null}
        </div>
        <Pager page={page} pageSize={pageSize} total={total} onPage={(p) => update({ page: p })} />
      </section>

      {editing ? (
        <DepartmentModal
          editing={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      ) : null}

      {confirming?.action === "deactivate" ? (
        <ConfirmDialog
          title="Deactivate this department?"
          subtitle={confirming.dept.department}
          body={
            <>
              <p>Admins won&apos;t be able to assign or reassign complaints to it, and its account can&apos;t log in.</p>
              <p>It can&apos;t be deactivated while it has assigned or in-progress complaints. Its past complaints stay visible in lists and statistics, and you can reactivate it later from this page.</p>
            </>
          }
          confirmLabel="Deactivate"
          danger
          onCancel={() => setConfirming(null)}
          onConfirm={() => changeActive(confirming.dept, false)} // a refusal (open complaints) stays in the dialog
        />
      ) : null}

      {confirming?.action === "reactivate" ? (
        <ConfirmDialog
          title="Reactivate this department?"
          subtitle={confirming.dept.department}
          body={
            <>
              <p>Admins will be able to assign and reassign complaints to it again.</p>
              <p>
                {confirming.dept.email
                  ? `Its account (${confirming.dept.email}) will be able to log in again.`
                  : "It has no account. Create one on the Accounts page."}
              </p>
            </>
          }
          confirmLabel="Reactivate"
          onCancel={() => setConfirming(null)}
          onConfirm={() => changeActive(confirming.dept, true)}
        />
      ) : null}
    </div>
  );
}

function DepartmentModal({ editing, onClose, onSaved }: { editing: NonNullable<Editing>; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const renaming = editing.type === "rename" ? editing.dept : null;
  const [name, setName] = useState(renaming?.department ?? "");
  const [acronym, setAcronym] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!name.trim()) return setError("Enter a department name.");
    if (!renaming && !acronym.trim()) return setError("Enter the department's acronym.");

    setBusy(true);
    try {
      const res = renaming ? await renameDepartment(renaming.department_id, name) : await addDepartment(name, acronym);
      if (res.success) {
        toast(renaming ? `${renaming.department} renamed to ${name.trim()}.` : `${name.trim()} added.`, "success");
        onSaved();
        return;
      }
      setError(res.message);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    }
    setBusy(false);
  };

  return (
    <Modal
      open
      onClose={onClose}
      align="left"
      size="sm"
      title={renaming ? "Rename department" : "Add department"}
      subtitle={renaming ? `Currently “${renaming.department}”. Its complaints and account move to the new name.` : "It can receive complaints right away."}
    >
      <form onSubmit={submit} noValidate className={m.form}>
        <div className={`field ${error ? "has-error" : ""}`}>
          <label htmlFor="dept-name" className={m.label}>
            Department name <span className="req">*</span>
          </label>
          <input
            id="dept-name"
            className="input"
            maxLength={150}
            placeholder="e.g. Guidance Office"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
          />
        </div>
        {!renaming ? (
          <div className={`field ${error ? "has-error" : ""}`}>
            <label htmlFor="dept-acronym" className={m.label}>
              Acronym <span className="req">*</span>
            </label>
            <input
              id="dept-acronym"
              className="input"
              maxLength={20}
              placeholder="e.g. MISO"
              value={acronym}
              onChange={(e) => {
                setAcronym(e.target.value);
                setError(null);
              }}
            />
          </div>
        ) : null}
        {error ? <span className="field-error">{error}</span> : null}
        <div className={m.footer}>
          <button type="button" className={`btn btn-soft ${m.btn}`} onClick={onClose} disabled={busy}>
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