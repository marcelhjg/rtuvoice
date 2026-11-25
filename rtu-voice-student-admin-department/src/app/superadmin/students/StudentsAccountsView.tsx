"use client";

import { useState, type FormEvent } from "react";
import { renameAccount } from "@/actions/superAdminActions";
import { EmptyState, Pager, SearchBox, adminStyles as s } from "@/components/admin/bits";
import m from "@/components/admin/modals.module.css";
import { StudentActiveDialog } from "@/components/admin/StudentActiveDialog";
import x from "@/components/admin/superadmin.module.css";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { useDebouncedSearch, useUrlFilters } from "@/components/admin/useUrlFilters";
import { formatShortDate } from "@/features/shared/sharedUtils";
import type { StudentAccountRow } from "@/features/superAdmin/superAdminTypes";
import { validateName } from "@/lib/validation";

type Confirming = { student: StudentAccountRow; action: "deactivate" | "reactivate" } | null;
const fullName = (student: StudentAccountRow) => `${student.first_name} ${student.last_name}`.trim();

/** Superadmin Portal › Students' Accounts: search, rename, and manage student account status. */
export function StudentsAccountsView({
  rows,
  total,
  overallTotal,
  page,
  pageSize,
  error,
}: {
  rows: StudentAccountRow[];
  total: number;
  overallTotal: number;
  page: number;
  pageSize: number;
  error: string | null;
}) {
  const { params, update, pending: loading, refresh } = useUrlFilters();
  const statusParam = params.get("status");
  const status = statusParam === "all" || statusParam === "inactive" ? statusParam : "active";
  const [query, setQuery] = useDebouncedSearch(params.get("q") ?? "", (value) => update({ q: value, page: 1 }));
  const [renaming, setRenaming] = useState<StudentAccountRow | null>(null);
  const [confirming, setConfirming] = useState<Confirming>(null);
  const filtered = Boolean(query || status !== "active");

  return (
    <div className="container">
      <div className={s.head}>
        <div className={s.listTitleRow}>
          <h1 className="page-title">Students&apos; Accounts</h1>
          <span className={`${s.countPill} ${s.pillTotal}`} aria-label={`${total} of ${overallTotal} student accounts shown`}>
            {total}
          </span>
        </div>
        <p className={s.subtitle}>Search student accounts, update a student&apos;s name, or manage account access.</p>
      </div>

      <section className={s.panel} aria-label="Students' Accounts" aria-busy={loading} style={{ opacity: loading ? 0.6 : 1 }}>
        <div className={s.toolbar}>
          <SearchBox value={query} onChange={setQuery} label="Search by name or email" />
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
        </div>

        {error ? (
          <p className="alert alert-error" role="alert" style={{ margin: 16 }}>
            {error}
          </p>
        ) : null}

        <div className={s.tableWrap}>
          <table className={s.table}>
            <caption className="visually-hidden">Student accounts</caption>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Registered</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="visually-hidden">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((student) => (
                <tr key={student.id} className={student.is_active ? undefined : x.inactiveRow}>
                  <td data-label="Name">
                    <span className={x.person}>
                      <span className={x.initial} aria-hidden="true">
                        {student.first_name.charAt(0)}
                      </span>
                      <span className={s.strong}>{fullName(student)}</span>
                    </span>
                  </td>
                  <td data-label="Email">{student.email}</td>
                  <td data-label="Registered">{formatShortDate(student.created_at)}</td>
                  <td data-label="Status">
                    <span className={`${s.pill} ${student.is_active ? x.active : x.inactive}`}>
                      {student.is_active ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td data-label="">
                    <div className={x.rowActions}>
                      <button type="button" className={`${s.ghostBtn} ${x.slotA}`} onClick={() => setRenaming(student)}>
                        Rename
                      </button>
                      {student.is_active ? (
                        <button
                          type="button"
                          className={`${s.outlineBtn} ${x.slotB} ${x.dangerOutline}`}
                          onClick={() => setConfirming({ student, action: "deactivate" })}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`${s.outlineBtn} ${x.slotB}`}
                          onClick={() => setConfirming({ student, action: "reactivate" })}
                        >
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
              message={filtered ? "No student accounts match these filters." : "No student accounts yet."}
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
        <Pager page={page} pageSize={pageSize} total={total} onPage={(nextPage) => update({ page: nextPage })} />
      </section>

      {renaming ? (
        <RenameStudentModal
          student={renaming}
          onClose={() => setRenaming(null)}
          onSaved={() => {
            setRenaming(null);
            refresh();
          }}
        />
      ) : null}

      {confirming ? (
        <StudentActiveDialog
          student={confirming.student}
          action={confirming.action}
          onClose={() => setConfirming(null)}
          onDone={() => {
            setConfirming(null);
            refresh();
          }}
        />
      ) : null}
    </div>
  );
}

function RenameStudentModal({
  student,
  onClose,
  onSaved,
}: {
  student: StudentAccountRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [first, setFirst] = useState(student.first_name);
  const [last, setLast] = useState(student.last_name);
  const [errors, setErrors] = useState<{ first: string | null; last: string | null }>({ first: null, last: null });
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const next = { first: validateName(first, "First name"), last: validateName(last, "Last name") };
    setErrors(next);
    setFormError(null);
    if (next.first || next.last) return;

    setBusy(true);
    try {
      const result = await renameAccount(student.id, first, last);
      if (result.success) {
        toast(`${fullName(student)} renamed to ${first.trim()} ${last.trim()}.`, "success");
        onSaved();
        return;
      }
      setFormError(result.message);
    } catch (err) {
      console.error(err);
      setFormError("Something went wrong. Please try again.");
    }
    setBusy(false);
  };

  return (
    <Modal open onClose={onClose} align="left" size="sm" title="Rename student account" subtitle={`${student.email}. The email stays the same.`}>
      <form onSubmit={submit} noValidate className={m.form}>
        <div className={x.formGrid}>
          <div className={`field ${errors.first ? "has-error" : ""}`}>
            <label htmlFor="student-ren-first" className={m.label}>
              First name <span className="req">*</span>
            </label>
            <input
              id="student-ren-first"
              className="input"
              value={first}
              onChange={(event) => {
                setFirst(event.target.value);
                setErrors((current) => ({ ...current, first: null }));
              }}
            />
            {errors.first ? <span className="field-error">{errors.first}</span> : null}
          </div>
          <div className={`field ${errors.last ? "has-error" : ""}`}>
            <label htmlFor="student-ren-last" className={m.label}>
              Last name <span className="req">*</span>
            </label>
            <input
              id="student-ren-last"
              className="input"
              value={last}
              onChange={(event) => {
                setLast(event.target.value);
                setErrors((current) => ({ ...current, last: null }));
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
