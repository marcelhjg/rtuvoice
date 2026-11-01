"use client";

import { useState, type ReactNode } from "react";
import { useDemoStore } from "@/lib/demo-store";
import { formatShortDate } from "@/lib/format";
import { daysBetween, slaInfo } from "@/lib/sla";
import type { Complaint } from "@/lib/types";
import { normalizeTrackingId } from "@/lib/validation";
import { BackToDashboard, EmptyState, Pager, PriorityPill, SearchBox, StatusPill, adminStyles as s, colType } from "./bits";
import { useComplaintModals } from "./useComplaintModals";

const PAGE_SIZE = 8;

export type ListKind = "total" | "assigned" | "progress" | "resolved";

interface Column {
  label: string;
  cell: (c: Complaint) => ReactNode;
  className?: string | ((c: Complaint) => string | undefined);
}

const CONFIG: Record<ListKind, { title: string; subtitle: string; pill: string; filter: (c: Complaint) => boolean; dateOf: (c: Complaint) => string }> = {
  total: { title: "Total complaints", subtitle: "Every complaint submitted to RTU Voice.", pill: s.pillTotal, filter: () => true, dateOf: (c) => c.submittedAt },
  assigned: { title: "Assigned", subtitle: "Complaints that have been assigned to a department.", pill: s.pillAssigned, filter: (c) => c.status === "Assigned", dateOf: (c) => c.assignedAt ?? c.submittedAt },
  progress: { title: "In progress", subtitle: "Complaints a department is currently working on.", pill: s.pillProgress, filter: (c) => c.status === "In Progress", dateOf: (c) => c.assignedAt ?? c.submittedAt },
  resolved: { title: "Resolved", subtitle: "Complaints that have been resolved.", pill: s.pillResolved, filter: (c) => c.status === "Resolved", dateOf: (c) => c.resolvedAt ?? c.submittedAt },
};

/** Total complaints / Assigned / In progress / Resolved list pages (Figma admin list frames). */
export function ComplaintList({ kind }: { kind: ListKind }) {
  const { complaints, departments } = useDemoStore();
  const modals = useComplaintModals();
  const cfg = CONFIG[kind];
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);

  const all = complaints.filter(cfg.filter);
  const q = normalizeTrackingId(query);
  const rows = all
    .filter((c) => !dept || (dept === "__none" ? !c.department : c.department === dept))
    .filter((c) => !q || c.trackingId.includes(q) || c.title.toUpperCase().includes(query.trim().toUpperCase()))
    .sort((a, b) => (sort === "newest" ? cfg.dateOf(b).localeCompare(cfg.dateOf(a)) : cfg.dateOf(a).localeCompare(cfg.dateOf(b))));
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const idCell = (c: Complaint) => (
    <button type="button" className={s.idLink} onClick={() => modals.openDetails(c.trackingId)}>
      {c.trackingId}
    </button>
  );
  const dueCell = (iso: Date | undefined, overdue: boolean) =>
    iso ? (
      <span className={overdue ? s.danger : undefined}>
        {formatShortDate(iso.toISOString())}
        {overdue ? " · overdue" : ""}
      </span>
    ) : (
      "—"
    );

  const columns: Column[] =
    kind === "total"
      ? [
          { label: "Date", cell: (c) => formatShortDate(c.submittedAt), className: s.date },
          { label: "Tracking ID", cell: idCell },
          { label: "Title", cell: (c) => c.title, className: s.strong },
          { label: "Category", cell: (c) => c.category },
          { label: "Department", cell: (c) => c.department ?? "Not assigned", className: (c) => (c.department ? undefined : s.muted) },
          { label: "Status", cell: (c) => <StatusPill status={c.status} /> },
        ]
      : kind === "assigned"
        ? [
            { label: "Assigned", cell: (c) => formatShortDate(c.assignedAt!), className: s.date },
            { label: "Tracking ID", cell: idCell },
            { label: "Title", cell: (c) => c.title, className: s.strong },
            { label: "Department", cell: (c) => c.department },
            { label: "Priority", cell: (c) => <PriorityPill priority={c.priority} /> },
            { label: "Acknowledge by", cell: (c) => dueCell(slaInfo(c).acknowledgeBy, false) },
            { label: "Resolve by", cell: (c) => dueCell(slaInfo(c).resolveBy, slaInfo(c).overdueDays > 0) },
          ]
        : kind === "progress"
          ? [
              { label: "Assigned", cell: (c) => formatShortDate(c.assignedAt!), className: s.date },
              { label: "Tracking ID", cell: idCell },
              { label: "Title", cell: (c) => c.title, className: s.strong },
              { label: "Department", cell: (c) => c.department },
              { label: "Priority", cell: (c) => <PriorityPill priority={c.priority} /> },
              { label: "Acknowledged", cell: (c) => (c.acknowledgedAt ? formatShortDate(c.acknowledgedAt) : "—") },
              { label: "Resolve by", cell: (c) => dueCell(slaInfo(c).resolveBy, slaInfo(c).overdueDays > 0) },
            ]
          : [
              { label: "Resolved", cell: (c) => formatShortDate(c.resolvedAt!), className: s.date },
              { label: "Tracking ID", cell: idCell },
              { label: "Title", cell: (c) => c.title, className: s.strong },
              { label: "Department", cell: (c) => c.department },
              { label: "Priority", cell: (c) => <PriorityPill priority={c.priority} /> },
              {
                label: "Resolved in",
                cell: (c) => {
                  const n = daysBetween(c.assignedAt!, c.resolvedAt!);
                  const late = slaInfo(c).tone === "danger";
                  return <span className={late ? s.danger : undefined}>{`${n} day${n === 1 ? "" : "s"}${late ? " · late" : ""}`}</span>;
                },
              },
            ];

  return (
    <div className="container">
      <div className={s.head}>
        <BackToDashboard />
        <div className={s.listTitleRow}>
          <h1 className={s.listTitle}>{cfg.title}</h1>
          <span className={`${s.countPill} ${cfg.pill}`} aria-label={`${all.length} complaints`}>
            {all.length}
          </span>
        </div>
        <p className={s.subtitle}>{cfg.subtitle}</p>
      </div>

      <section className={s.panel} aria-label={cfg.title}>
        <div className={s.toolbar}>
          <SearchBox
            value={query}
            onChange={(v) => {
              setQuery(v);
              setPage(1);
            }}
          />
          <select
            aria-label="Filter by department"
            className={`select ${s.filter}`}
            value={dept}
            onChange={(e) => {
              setDept(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All departments</option>
            {kind === "total" ? <option value="__none">Not assigned</option> : null}
            {departments.map(({ name: d }) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select aria-label="Sort" className={`select ${s.filter}`} value={sort} onChange={(e) => setSort(e.target.value as "newest" | "oldest")}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>

        <div className={s.tableWrap}>
          <table className={s.table}>
            <caption className="visually-hidden">{cfg.title}</caption>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.label} scope="col" data-col={colType(col.label)}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c.trackingId}>
                  {columns.map((col) => (
                    <td key={col.label} data-label={col.label} className={typeof col.className === "function" ? col.className(c) : col.className}>
                      {col.cell(c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? (
            all.length === 0 ? (
              <EmptyState message="No complaints in this list yet." action={{ label: "Back to dashboard", href: "/admin" }} />
            ) : (
              <EmptyState
                message="No complaints match these filters."
                action={{
                  label: "Clear filters",
                  onClick: () => {
                    setQuery("");
                    setDept("");
                    setPage(1);
                  },
                }}
              />
            )
          ) : null}
        </div>
        <Pager page={current} pageSize={PAGE_SIZE} total={rows.length} onPage={setPage} />
      </section>
      {modals.modals}
    </div>
  );
}
