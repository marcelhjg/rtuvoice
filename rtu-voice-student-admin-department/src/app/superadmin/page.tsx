"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { SearchBox, adminStyles as s } from "@/components/admin/bits";
import m from "@/components/admin/modals.module.css";
import { ConfirmDialog } from "@/components/admin/superadmin";
import x from "@/components/admin/superadmin.module.css";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { useDemoStore, type NewStaffAccountInput } from "@/lib/demo-store";
import { formatLongDate } from "@/lib/format";
import { validateEmail, validateName } from "@/lib/validation";

interface Row {
  kind: "admin" | "department";
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  department?: string;
  active: boolean;
  addedAt?: string;
}

type Pending = { type: "deactivate" | "reactivate" | "reset"; row: Row } | null;

/** Superadmin Portal › Accounts (SRS §3, §7), the portal's home: lists every admin and department-head account; create, deactivate and reset them. */
export default function AccountsPage() {
  const { admins, deptAccounts, setStaffAccountActive } = useDemoStore();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState("");
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState<Pending>(null);

  const all: Row[] = useMemo(
    () => [
      ...admins.map((a) => ({ kind: "admin" as const, ...a, active: a.active !== false })),
      ...deptAccounts.map((d) => ({ kind: "department" as const, ...d, active: d.active !== false })),
    ],
    [admins, deptAccounts],
  );
  const q = query.trim().toLowerCase();
  const rows = all.filter(
    (r) =>
      (!kind || r.kind === kind) &&
      (!status || (status === "active") === r.active) &&
      (!q || `${r.firstName} ${r.lastName} ${r.email} ${r.department ?? ""}`.toLowerCase().includes(q)),
  );
  const name = (r: Row) => `${r.firstName} ${r.lastName}`.trim();

  return (
    <div className="container">
      <div className={s.head}>
        <div className={s.listTitleRow}>
          <h1 className={s.listTitle}>Accounts</h1>
          <span className={`${s.countPill} ${s.pillTotal}`} aria-label={`${all.length} accounts`}>
            {all.length}
          </span>
        </div>
        <p className={s.subtitle}>Administrator accounts and one shared account per department. Only the superadmin can create, deactivate or reset them.</p>
      </div>

      <section className={s.panel} aria-label="Accounts">
        <div className={s.toolbar}>
          <SearchBox value={query} onChange={setQuery} label="Search by name, email or department" />
          <select aria-label="Filter by role" className={`select ${s.filter}`} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">All roles</option>
            <option value="admin">Administrators</option>
            <option value="department">Department heads</option>
          </select>
          <select aria-label="Filter by status" className={`select ${s.filter}`} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Deactivated</option>
          </select>
          <button type="button" className={`btn btn-primary ${x.toolbarAction}`} onClick={() => setCreating(true)}>
            <Icon name="plus" size={16} strokeWidth={2.4} /> Create account
          </button>
        </div>

        <div className={s.tableWrap}>
          <table className={s.table}>
            <caption className="visually-hidden">Administrator and department-head accounts</caption>
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
                <tr key={r.email} className={r.active ? undefined : x.inactiveRow}>
                  <td data-label="Name">
                    <span className={x.person}>
                      <span className={x.initial} aria-hidden="true">
                        {r.firstName.charAt(0)}
                      </span>
                      <span>
                        <span className={s.strong}>{name(r)}</span>
                        <span className={x.sub}>{r.title}</span>
                      </span>
                    </span>
                  </td>
                  <td data-label="Email">{r.email}</td>
                  <td data-label="Role">{r.kind === "admin" ? "Administrator" : "Department head"}</td>
                  <td data-label="Department">{r.department ?? <span className={s.muted}>—</span>}</td>
                  <td data-label="Status">
                    <span className={`${s.pill} ${r.active ? x.active : x.inactive}`}>{r.active ? "Active" : "Deactivated"}</span>
                  </td>
                  <td data-label="">
                    <div className={x.rowActions}>
                      <button type="button" className={`${s.ghostBtn} ${x.slotA}`} onClick={() => setPending({ type: "reset", row: r })} disabled={!r.active}>
                        Reset password
                      </button>
                      {r.active ? (
                        <button type="button" className={`${s.outlineBtn} ${x.slotB} ${x.dangerOutline}`} onClick={() => setPending({ type: "deactivate", row: r })}>
                          Deactivate
                        </button>
                      ) : (
                        <button type="button" className={`${s.outlineBtn} ${x.slotB}`} onClick={() => setPending({ type: "reactivate", row: r })}>
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? <p className={x.empty}>No accounts match these filters.</p> : null}
        </div>
      </section>

      {creating ? <CreateAccountModal onClose={() => setCreating(false)} /> : null}

      {pending?.type === "reset" ? (
        <ConfirmDialog
          title="Reset password?"
          subtitle={`${name(pending.row)} · ${pending.row.email}`}
          body={<p>A password reset email will be sent to this address. Their current password stops working once they set a new one.</p>}
          confirmLabel="Send reset email"
          onCancel={() => setPending(null)}
          onConfirm={() => {
            toast(`Password reset email sent to ${pending.row.email} (simulated).`, "success");
            setPending(null);
            return null;
          }}
        />
      ) : null}
      {pending && pending.type !== "reset" ? (
        <ConfirmDialog
          title={pending.type === "deactivate" ? "Deactivate this account?" : "Reactivate this account?"}
          subtitle={`${name(pending.row)} · ${pending.row.email}`}
          body={
            pending.type === "deactivate" ? (
              <p>
                They won&apos;t be able to log in. Their past actions stay in the Activity Log
                {pending.row.kind === "department" ? ", and complaints stay with their department" : ""}. You can reactivate the account later.
              </p>
            ) : (
              <p>They will be able to log in again with their existing password.</p>
            )
          }
          confirmLabel={pending.type === "deactivate" ? "Deactivate" : "Reactivate"}
          danger={pending.type === "deactivate"}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            const error = setStaffAccountActive(pending.row.email, pending.type === "reactivate");
            if (error) return error;
            toast(`${name(pending.row)} ${pending.type === "deactivate" ? "deactivated" : "reactivated"}.`, "success");
            setPending(null);
            return null;
          }}
        />
      ) : null}
    </div>
  );
}

function CreateAccountModal({ onClose }: { onClose: () => void }) {
  const { activeDepartments, deptAccounts, createStaffAccount } = useDemoStore();
  // One account per department: only departments without an account can be picked.
  const hasAccount = (d: string) => deptAccounts.some((a) => a.department === d);
  const available = activeDepartments.filter((d) => !hasAccount(d));
  const toast = useToast();
  const [form, setForm] = useState<NewStaffAccountInput>({ kind: "admin", firstName: "", lastName: "", email: "", department: "" });
  const noneLeft = form.kind === "department" && available.length === 0;
  const [errors, setErrors] = useState<Partial<Record<keyof NewStaffAccountInput, string | null>>>({});
  const [busy, setBusy] = useState(false);
  const set = (key: keyof NewStaffAccountInput, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: null }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (busy || noneLeft) return;
    const next = {
      firstName: validateName(form.firstName, "First name"),
      lastName: validateName(form.lastName, "Last name"),
      email: validateEmail(form.email),
      department:
        form.kind === "department" && !form.department
          ? available.length
            ? "Choose the department this account is for."
            : "Every active department already has an account. Add a new department first."
          : null,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setBusy(true);
    const error = createStaffAccount({ ...form, department: form.kind === "department" ? form.department : undefined });
    if (error) {
      setErrors(error.includes("already has an account") || error.includes("department") ? { department: error } : { email: error });
      setBusy(false);
      return;
    }
    toast(`${form.kind === "admin" ? "Administrator" : `${form.department}`} account created for ${form.email.trim().toLowerCase()} (simulated: no email sent).`, "success");
    onClose();
  };

  const field = (key: keyof NewStaffAccountInput, label: string, input: ReactNode, full = false) => (
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
          {field(
            "kind",
            "Account type",
            <select
              id="acc-kind"
              className="select"
              value={form.kind}
              onChange={(e) => {
                const k = e.target.value as NewStaffAccountInput["kind"];
                setForm((f) => ({ ...f, kind: k, department: "" }));
              }}
            >
              <option value="admin">Administrator</option>
              <option value="department">Department (one shared account)</option>
            </select>,
            true,
          )}
          {field("firstName", "First name", <input id="acc-firstName" className="input" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />)}
          {field("lastName", "Last name", <input id="acc-lastName" className="input" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />)}
          {field(
            "email",
            "University email",
            <input id="acc-email" className="input" type="email" placeholder="name@rtu.edu.ph" value={form.email} onChange={(e) => set("email", e.target.value)} />,
            true,
          )}
          {form.kind === "department"
            ? noneLeft
              ? (
                  <p className={`alert alert-info ${x.full}`} role="status">
                    Every department already has its account. Add a new department first (Departments page), then create its account here.
                  </p>
                )
              : field(
                  "department",
                  "Department",
                  // Only departments without an account are listed: one shared account per department.
                  <select id="acc-department" className="select" value={form.department} onChange={(e) => set("department", e.target.value)}>
                    <option value="" disabled>
                      Choose a department
                    </option>
                    {available.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>,
                  true,
                )
            : null}
        </div>
        <p className={m.help}>
          {form.kind === "department" ? (
            <>
              Each department has <strong>one shared account</strong>, used by its head and staff. Departments that already have one aren&apos;t listed.{" "}
            </>
          ) : null}
          <em>Demo build: no email is sent. New accounts sign in with the demo password.</em>
        </p>
        <div className={m.footer}>
          <button type="button" className={`btn btn-soft ${m.btn}`} onClick={onClose}>
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
