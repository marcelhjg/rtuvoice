"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Icon } from "@/components/Icon";
import { LockedChip, Pager, PriorityDot, SearchBox, StatusPill, adminStyles as s } from "@/components/admin/bits";
import { StatCards } from "@/components/admin/StatCards";
import { useComplaintModals } from "@/components/admin/useComplaintModals";
import { useDemoStore } from "@/lib/demo-store";
import { formatShortDate } from "@/lib/format";
import { slaInfo } from "@/lib/sla";
import type { Department } from "@/lib/types";
import { normalizeTrackingId } from "@/lib/validation";
import styles from "./dashboard.module.css";

const PAGE_SIZE = 8;
const MASTER_STATUSES = [
  { value: "Assigned", label: "Assigned" },
  { value: "In Progress", label: "In progress" },
  { value: "Resolved", label: "Resolved" },
] as const;

export function AdminDashboard() {
  const { complaints } = useDemoStore();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = params.get("tab") === "master" ? "master" : "pending";
  const modals = useComplaintModals();

  const setTab = (t: "pending" | "master") => router.replace(t === "master" ? `${pathname}?tab=master` : pathname, { scroll: false });

  const counts = useMemo(
    () => ({
      total: complaints.length,
      assigned: complaints.filter((c) => c.status === "Assigned").length,
      inProgress: complaints.filter((c) => c.status === "In Progress").length,
      resolved: complaints.filter((c) => c.status === "Resolved").length,
    }),
    [complaints],
  );
  const pendingCount = complaints.filter((c) => c.status === "Pending").length;
  const masterCount = complaints.filter((c) => c.status === "Assigned" || c.status === "In Progress" || c.status === "Resolved").length;

  return (
    <div className="container">
      <div className={s.head}>
        <h1 className={s.title}>Dashboard</h1>
        <p className={s.subtitle}>
          {tab === "master" ? "Master Tracking Queue — approved complaints now in department portals." : "Select a box to open its list."}
        </p>
      </div>

      <StatCards counts={counts} />

      <section className={s.panel} aria-label="Complaint queues">
        <div className={styles.tabs} role="tablist" aria-label="Queues">
          <button
            type="button"
            role="tab"
            id="tab-pending"
            aria-selected={tab === "pending"}
            aria-controls="panel-pending"
            className={`${styles.tab} ${tab === "pending" ? styles.tabActive : ""}`}
            onClick={() => setTab("pending")}
          >
            <span className={styles.tabText}>
              Pending Validation<br className={styles.mobileTabBreak} /> Queue
            </span>
            <span className={styles.tabCount}>{pendingCount}</span>
          </button>
          <button
            type="button"
            role="tab"
            id="tab-master"
            aria-selected={tab === "master"}
            aria-controls="panel-master"
            className={`${styles.tab} ${tab === "master" ? styles.tabActive : ""}`}
            onClick={() => setTab("master")}
          >
            <span className={styles.tabText}>
              Master Tracking<br className={styles.mobileTabBreak} /> Queue
            </span>
            <span className={styles.tabCount}>{masterCount}</span>
          </button>
        </div>

        {tab === "pending" ? <PendingQueue modals={modals} /> : <MasterQueue modals={modals} />}
      </section>
      {modals.modals}
    </div>
  );
}

type Modals = ReturnType<typeof useComplaintModals>;

function PendingQueue({ modals }: { modals: Modals }) {
  // Only active departments can receive new assignments (Super Admin › Departments).
  const { complaints, activeDepartments } = useDemoStore();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");

  const q = normalizeTrackingId(query);
  const rows = complaints
    .filter((c) => c.status === "Pending")
    .filter((c) => !q || c.trackingId.includes(q) || c.title.toUpperCase().includes(query.trim().toUpperCase()))
    .sort((a, b) => (sort === "newest" ? b.submittedAt.localeCompare(a.submittedAt) : a.submittedAt.localeCompare(b.submittedAt)));

  return (
    <div id="panel-pending" role="tabpanel" aria-labelledby="tab-pending">
      <div className={s.toolbar}>
        <SearchBox value={query} onChange={setQuery} />
        <select aria-label="Sort" className={`select ${s.filter}`} value={sort} onChange={(e) => setSort(e.target.value as "newest" | "oldest")}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
        <p className={s.hint}>Choosing a department approves the complaint and runs the AI step.</p>
      </div>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <caption className="visually-hidden">Pending validation queue</caption>
          <thead>
            <tr>
              <th scope="col" data-col="date">Date</th>
              <th scope="col" data-col="id">Tracking ID</th>
              <th scope="col" data-col="title">Title</th>
              <th scope="col" data-col="category">Category</th>
              <th scope="col" data-col="assign">Assign</th>
              <th scope="col" data-col="reject">
                <span className="visually-hidden">Reject</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.trackingId}>
                <td data-label="Date" className={s.date}>
                  {formatShortDate(c.submittedAt)}
                </td>
                <td data-label="Tracking ID">
                  <button type="button" className={s.idLink} onClick={() => modals.openDetails(c.trackingId)}>
                    {c.trackingId}
                  </button>
                </td>
                <td data-label="Title" className={s.strong}>
                  {c.title}
                </td>
                <td data-label="Category">{c.category}</td>
                <td data-label="Assign">
                  <select
                    aria-label={`Assign ${c.trackingId} to a department`}
                    className={`select ${s.rowSelect}`}
                    value=""
                    onChange={(e) => modals.openAssign(c.trackingId, e.target.value as Department)}
                  >
                    <option value="" disabled>
                      Assign department...
                    </option>
                    {activeDepartments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </td>
                <td data-label="">
                  <div className={s.actions}>
                    <button type="button" className={s.reject} onClick={() => modals.openReject(c.trackingId)} aria-label={`Reject ${c.trackingId}`}>
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className={s.empty}>{q ? `No pending complaint matches “${query.trim()}”.` : "All caught up — no complaints are waiting for validation."}</p>
        ) : null}
      </div>
    </div>
  );
}

function MasterQueue({ modals }: { modals: Modals }) {
  // The filter lists every department, including deactivated ones that still have history.
  const { complaints, departments } = useDemoStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [dept, setDept] = useState("");
  const [page, setPage] = useState(1);

  const q = normalizeTrackingId(query);
  const rows = complaints
    .filter((c) => c.status === "Assigned" || c.status === "In Progress" || c.status === "Resolved")
    .filter((c) => (!status || c.status === status) && (!dept || c.department === dept))
    .filter((c) => !q || c.trackingId.includes(q) || c.title.toUpperCase().includes(query.trim().toUpperCase()))
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div id="panel-master" role="tabpanel" aria-labelledby="tab-master">
      <div className={s.toolbar}>
        <SearchBox
          value={query}
          onChange={(v) => {
            setQuery(v);
            setPage(1);
          }}
        />
        <select
          aria-label="Filter by status"
          className={`select ${s.filter}`}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {MASTER_STATUSES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
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
          {departments.map(({ name: d }) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div className={s.tableWrap}>
        <table className={s.table}>
          <caption className="visually-hidden">Master tracking queue</caption>
          <thead>
            <tr>
              <th scope="col" data-col="date">Date</th>
              <th scope="col" data-col="id">Tracking ID</th>
              <th scope="col" data-col="title">Title</th>
              <th scope="col" data-col="priority">Priority</th>
              <th scope="col" data-col="status">Status</th>
              <th scope="col" data-col="sla">SLA</th>
              <th scope="col" data-col="actions-admin">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((c) => {
              const sla = slaInfo(c);
              const canReassign = c.status === "Assigned" && c.updates.length === 0;
              return (
                <tr key={c.trackingId}>
                  <td data-label="Date" className={s.date}>
                    {formatShortDate(c.submittedAt)}
                  </td>
                  <td data-label="Tracking ID">
                    <button type="button" className={s.idLink} onClick={() => modals.openDetails(c.trackingId)}>
                      {c.trackingId}
                    </button>
                  </td>
                  <td data-label="Title" className={`${s.strong} ${styles.titleCell}`}>
                    {c.title}
                  </td>
                  <td data-label="Priority">
                    <PriorityDot priority={c.priority} />
                  </td>
                  <td data-label="Status">
                    <StatusPill status={c.status} />
                  </td>
                  <td data-label="SLA" className={sla.tone === "danger" ? s.danger : sla.tone === "success" ? s.success : s.muted}>
                    {sla.label}
                  </td>
                  <td data-label="">
                    <div className={s.actions}>
                      <button type="button" className={`${s.ghostBtn} ${s.slotView}`} onClick={() => modals.openUpdates(c.trackingId)}>
                        View updates
                      </button>
                      {canReassign ? (
                        <button type="button" className={`${s.outlineBtn} ${s.slotMain}`} onClick={() => modals.openReassign(c.trackingId)}>
                          <Icon name="swap" size={16} strokeWidth={2.2} /> Reassign
                        </button>
                      ) : (
                        <LockedChip
                          reason={
                            c.status === "Resolved"
                              ? "The complaint is resolved, so it can't be reassigned."
                              : "The department has started working on this, so it can't be reassigned."
                          }
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 ? <p className={s.empty}>No complaints match these filters.</p> : null}
      </div>
      <Pager page={current} pageSize={PAGE_SIZE} total={rows.length} onPage={setPage} />
    </div>
  );
}
