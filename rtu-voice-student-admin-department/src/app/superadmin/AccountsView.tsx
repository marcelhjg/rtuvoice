"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { createAccount, renameAccount, setAccountActive } from "@/actions/superAdminActions";
import { EmptyState, Pager, SearchBox, adminStyles as s } from "@/components/admin/bits";
import m from "@/components/admin/modals.module.css";
import { ConfirmDialog } from "@/components/admin/superadmin";
import x from "@/components/admin/superadmin.module.css";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { useDebouncedSearch, useUrlFilters } from "@/components/admin/useUrlFilters";
import type { StaffAccountRow, StaffRole } from "@/features/superAdmin/superAdminTypes";
import { validateEmail, validateName } from "@/lib/validation";

type Department = { id: number; name: string };
type Confirming = { row: StaffAccountRow; action: "deactivate" | "reactivate" } | null;

const ROLE_ADMIN = 2;
const fullName = (r: { first_name: string; last_name: string }) => `${r.first_name} ${r.last_name}`.trim();

/**
 * Superadmin Portal › Accounts: every admin and department account.
 * Search, role and status filters live in the URL; the server page (page.tsx) loads the rows.
 */
export function AccountsView({
  rows,
  total,
  overallTotal,
  page,
  pageSize,
  departments,
  error,
}: {
  rows: StaffAccountRow[];
  total: number;
  overallTotal: number;
  page: number;
  pageSize: number;
  departments: Department[]; // active departments that have no active account yet
  error: string | null;
}) {
  const toast = useToast();
  const { params, update, pending: loading, refresh } = useUrlFilters();
  const role = params.get("role") ?? "";
  const status = params.get("status") ?? "active"; // the page shows active accounts unless told otherwise
  const [query, setQuery] = useDebouncedSearch(params.get("q") ?? "", (v) => update({ q: v, page: 1 }));
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<StaffAccountRow | null>(null);
  const [confirming, setConfirming] = useState<Confirming>(null);
  const filtered = Boolean(query || role || status !== "active");

  // Returns the error to show inside the dialog, or null once it worked.
  const changeActive = async (row: StaffAccountRow, isActive: boolean): Promise<string | null> => {
    try {
      const res = await setAccountActive(row.id, isActive);
      if (!res.success) return res.message; // e.g. a department with open complaints can't be deactivated
      toast(`${fullName(row)} ${isActive ? "reactivated" : "deactivated"}.`, "success");
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
          <h1 className="page-title">Staffs' Accounts</h1>
          {/* Counts the accounts matching the search, role and status filters. */}
          <span className={`${s.countPill} ${s.pillTotal}`} aria-label={`${total} of ${overallTotal} accounts shown`}>
            {total}
          </span>
        </div>
        <p className={s.subtitle}>Administrator accounts and one active, shared account per department. Only the Super Admin can create, rename, deactivate or reactivate them.</p>
      </div>

      <section className={s.panel} aria-label="Accounts" aria-busy={loading} style={{ opacity: loading ? 0.6 : 1 }}>
        <div className={s.toolbar}>
          <SearchBox value={query} onChange={setQuery} label="Search by name, email or department" />
          <select aria-label="Filter by role" className={`select ${s.filter}`} value={role} onChange={(e) => update({ role: e.target.value, page: 1 })}>
            <option value="">All roles</option>
            <option value="admin">Administrators</option>
            <option value="department">Departments</option>
          </select>
          <select
            aria-label="Filter by status"
            className={`select ${s.filter}`}
            value={status}
            onChange={(e) => update({ status: e.target.value === "active" ? "" : e.target.value, page: 1 })}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Deactivated</option>
          </select>
          <button type="button" className={`btn btn-primary ${x.toolbarAction}`} onClick={() => setCreating(true)}>
            <Icon name="plus" size={16} strokeWidth={2.4} /> Create account
          </button>
        </div>

        {error ? (
          <p className="alert alert-error" role="alert" style={{ margin: 16 }}>
            {error}
          </p>
        ) : null}

        <div className={s.tableWrap}>
          <table className={s.table}>
            <caption className="visually-hidden">Administrator and department accounts</caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Role</th>
                <th scope="col">Department</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={r.is_active ? undefined : x.inactiveRow}>
                  <td data-label="Name">
                    <span className={x.person}>
                      <span className={x.initial} aria-hidden="true">
                        {r.first_name.charAt(0)}
                      </span>
                      <span>
                        <span className={s.strong}>{fullName(r)}</span>
                        <span className={x.sub}>{r.role_id === ROLE_ADMIN ? "Administrator" : "Department account"}</span>
                      </span>
                    </span>
                  </td>
                  <td data-label="Email">{r.email}</td>
                  <td data-label="Role">{r.role_id === ROLE_ADMIN ? "Administrator" : "Department"}</td>
                  <td data-label="Department">{r.department ?? <span className={s.muted}>—</span>}</td>
                  <td data-label="Status">
                    <span className={`${s.pill} ${r.is_active ? x.active : x.inactive}`}>{r.is_active ? "Active" : "Deactivated"}</span>
                  </td>
                  <td data-label="">
                    <div className={x.rowActions}>
                      <button type="button" className={`${s.ghostBtn} ${x.slotA}`} onClick={() => setRenaming(r)}>
                        Rename
                      </button>
                      {r.is_active ? (
                        <button type="button" className={`${s.outlineBtn} ${x.slotB} ${x.dangerOutline}`} onClick={() => setConfirming({ row: r, action: "deactivate" })}>
                          Deactivate
                        </button>
                      ) : (
                        <button type="button" className={`${s.outlineBtn} ${x.slotB}`} onClick={() => setConfirming({ row: r, action: "reactivate" })}>
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
              message={filtered ? "No accounts match these filters." : "No accounts yet."}
              action={
                filtered
                  ? {
                      label: "Clear filters",
                      onClick: () => {
                        setQuery("");
                        update({ q: "", role: "", status: "", page: 1 });
                      },
                    }
                  : undefined
              }
            />
          ) : null}
        </div>
        <Pager page={page} pageSize={pageSize} total={total} onPage={(p) => update({ page: p })} />
      </section>

      {creating ? (
        <CreateAccountModal
          departments={departments}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            refresh();
          }}
        />
      ) : null}

      {renaming ? (
        <RenameAccountModal
          account={renaming}
          onClose={() => setRenaming(null)}
          onSaved={() => {
            setRenaming(null);
            refresh();
          }}
        />
      ) : null}

      {confirming?.action === "deactivate" ? (
        <ConfirmDialog
          title="Deactivate this account?"
          subtitle={`${fullName(confirming.row)} · ${confirming.row.email}`}
          body={
            <>
              <p>
                They won&apos;t be able to log in. Their past actions stay in the Activity Log
                {confirming.row.role_id !== ROLE_ADMIN ? ", and the department's complaints stay with the department" : ""}.
              </p>
              <p>
                You can reactivate the account later from this page.
                {confirming.row.role_id !== ROLE_ADMIN
                  ? " A department account can't be deactivated while the department has assigned or in-progress complaints. You can also create a new account for the department instead."
                  : ""}
              </p>
            </>
          }
          confirmLabel="Deactivate"
          danger
          onCancel={() => setConfirming(null)}
          onConfirm={() => changeActive(confirming.row, false)}
        />
      ) : null}

      {confirming?.action === "reactivate" ? (
        <ConfirmDialog
          title="Reactivate this account?"
          subtitle={`${fullName(confirming.row)} · ${confirming.row.email}`}
          body={
            confirming.row.role_id === ROLE_ADMIN ? (
              <p>They&apos;ll be able to log in again and review complaints.</p>
            ) : (
              <>
                <p>
                  It becomes the shared account of <strong>{confirming.row.department}</strong> again. Its staff can log in and work on the department&apos;s complaints.
                </p>
                <p>
                  A department can have only one active account, so this works only if {confirming.row.department} is active and has no other active account.
                </p>
              </>
            )
          }
          confirmLabel="Reactivate"
          onCancel={() => setConfirming(null)}
          onConfirm={() => changeActive(confirming.row, true)} // a blocked reactivation stays open with the reason
        />
      ) : null}
    </div>
  );
}

type FormKey = "firstName" | "lastName" | "email" | "departmentId";

function CreateAccountModal({
  departments,
  onClose,
  onCreated,
}: {
  departments: Department[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<{ role: StaffRole; firstName: string; lastName: string; email: string; departmentId: string }>({
    role: "admin",
    firstName: "",
    lastName: "",
    email: "",
    departmentId: "",
  });
  const [errors, setErrors] = useState<Partial<Record<FormKey, string | null>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // One active account per department: only departments without one can be picked.
  const noneLeft = form.role === "department" && departments.length === 0;

  const set = (key: FormKey, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: null }));
    setFormError(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || noneLeft) return;
    const next: Record<FormKey, string | null> = {
      firstName: validateName(form.firstName, "First name"),
      lastName: validateName(form.lastName, "Last name"),
      email: validateEmail(form.email),
      departmentId: form.role === "department" && !form.departmentId ? "Choose the department this account is for." : null,
    };
    setErrors(next);
    setFormError(null);
    if (Object.values(next).some(Boolean)) return;

    setBusy(true);
    try {
      const res = await createAccount({
        email: form.email,
        first_name: form.firstName,
        last_name: form.lastName,
        role: form.role,
        department_id: form.role === "department" ? Number(form.departmentId) : undefined,
      });
      if (res.success) {
        const dept = departments.find((d) => String(d.id) === form.departmentId)?.name;
        toast(`${form.role === "admin" ? "Administrator" : (dept ?? "Department")} account created for ${form.email.trim().toLowerCase()}.`, "success");
        onCreated();
        return;
      }
      // put the server's message next to the field it is about
      if (/email/i.test(res.message)) setErrors({ email: res.message });
      else if (/department/i.test(res.message)) setErrors({ departmentId: res.message });
      else setFormError(res.message);
    } catch (err) {
      console.error(err);
      setFormError("Something went wrong. Please try again.");
    }
    setBusy(false);
  };

  const field = (key: FormKey, label: string, input: ReactNode, full = false) => (
    <div className={`field ${errors[key] ? "has-error" : ""} ${full ? x.full : ""}`}>
      <label htmlFor={`acc-${key}`} className={m.label}>
        {label} <span className="req">*</span>
      </label>
      {input}
      {errors[key] ? <span className="field-error">{errors[key]}</span> : null}
    </div>
  );

  return (
    <Modal open onClose={onClose} align="left" size="md" title="Create account" subtitle="Staff accounts can't be created through public sign-up.">
      <form onSubmit={submit} noValidate className={m.form}>
        <div className={x.formGrid}>
          <div className={`field ${x.full}`}>
            <label htmlFor="acc-role" className={m.label}>
              Account type <span className="req">*</span>
            </label>
            <select
              id="acc-role"
              className="select"
              value={form.role}
              onChange={(e) => {
                setForm((f) => ({ ...f, role: e.target.value as StaffRole, departmentId: "" }));
                setErrors((er) => ({ ...er, departmentId: null }));
                setFormError(null);
              }}
            >
              <option value="admin">Administrator</option>
              <option value="department">Department (one shared account)</option>
            </select>
          </div>
          {field("firstName", "First name", <input id="acc-firstName" className="input" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />)}
          {field("lastName", "Last name", <input id="acc-lastName" className="input" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />)}
          {field(
            "email",
            "University email",
            <input id="acc-email" className="input" type="email" placeholder="name@rtu.edu.ph" value={form.email} onChange={(e) => set("email", e.target.value)} />,
            true,
          )}
          {form.role === "department" ? (
            noneLeft ? (
              <p className={`alert alert-info ${x.full}`} role="status">
                Every active department already has an active account. Add a new department first (Departments page), or deactivate a department&apos;s account to replace it.
              </p>
            ) : (
              field(
                "departmentId",
                "Department",
                // Only departments without an active account are listed.
                <select id="acc-departmentId" className="select" value={form.departmentId} onChange={(e) => set("departmentId", e.target.value)}>
                  <option value="" disabled>
                    Choose a department
                  </option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>,
                true,
              )
            )
          ) : null}
        </div>
        {formError ? (
          <p className="alert alert-error" role="alert">
            {formError}
          </p>
        ) : null}
        <p className={m.help}>
          {form.role === "department" ? (
            <>
              Each department has <strong>one active, shared account</strong>, used by its head and staff. Departments that already have one aren&apos;t listed.{" "}
            </>
          ) : null}
          They sign in with a one-time code sent to this email address.
        </p>
        <div className={m.footer}>
          <button type="button" className={`btn btn-soft ${m.btn}`} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className={`btn btn-primary ${m.btn}`} disabled={busy || noneLeft}>
            Create account
          </button>
        </div>
      </form>
    </Modal>
  );
}

function RenameAccountModal({ account, onClose, onSaved }: { account: StaffAccountRow; onClose: () => void; onSaved: () => void }) {
  const toast = useToast();
  const [first, setFirst] = useState(account.first_name);
  const [last, setLast] = useState(account.last_name);
  const [errors, setErrors] = useState<{ first: string | null; last: string | null }>({ first: null, last: null });
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const next = { first: validateName(first, "First name"), last: validateName(last, "Last name") };
    setErrors(next);
    setFormError(null);
    if (next.first || next.last) return;

    setBusy(true);
    try {
      const res = await renameAccount(account.id, first, last);
      if (res.success) {
        toast(`${fullName(account)} renamed to ${first.trim()} ${last.trim()}.`, "success");
        onSaved();
        return;
      }
      setFormError(res.message);
    } catch (err) {
      console.error(err);
      setFormError("Something went wrong. Please try again.");
    }
    setBusy(false);
  };

  return (
    <Modal open onClose={onClose} align="left" size="sm" title="Rename account" subtitle={`${account.email}. The email stays the same.`}>
      <form onSubmit={submit} noValidate className={m.form}>
        <div className={x.formGrid}>
          <div className={`field ${errors.first ? "has-error" : ""}`}>
            <label htmlFor="ren-first" className={m.label}>
              First name <span className="req">*</span>
            </label>
            <input
              id="ren-first"
              className="input"
              value={first}
              onChange={(e) => {
                setFirst(e.target.value);
                setErrors((er) => ({ ...er, first: null }));
              }}
            />
            {errors.first ? <span className="field-error">{errors.first}</span> : null}
          </div>
          <div className={`field ${errors.last ? "has-error" : ""}`}>
            <label htmlFor="ren-last" className={m.label}>
              Last name <span className="req">*</span>
            </label>
            <input
              id="ren-last"
              className="input"
              value={last}
              onChange={(e) => {
                setLast(e.target.value);
                setErrors((er) => ({ ...er, last: null }));
              }}
            />
            {errors.last ? <span className="field-error">{errors.last}</span> : null}
          </div>
        </div>
        {formError ? (
          <p className="alert alert-error" role="alert">
            {formError}
          </p>
        ) : null}
        <div className={m.footer}>
          <button type="button" className={`btn btn-soft ${m.btn}`} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className={`btn btn-primary ${m.btn}`} disabled={busy}>
            Rename
          </button>
        </div>
      </form>
    </Modal>
  );
}