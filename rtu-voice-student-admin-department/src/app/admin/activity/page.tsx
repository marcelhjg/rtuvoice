"use client";

import { useState } from "react";
import { BackToDashboard, Pager, SearchBox, adminStyles as s } from "@/components/admin/bits";
import { useComplaintModals } from "@/components/admin/useComplaintModals";
import { useDemoStore } from "@/lib/demo-store";
import { formatLongDate, formatTime } from "@/lib/format";
import { ACTIVITY_ACTIONS, type ActivityAction } from "@/lib/types";
import { normalizeTrackingId } from "@/lib/validation";
import styles from "./activity.module.css";

const PAGE_SIZE = 10;
const ACTION_CLASS: Record<ActivityAction, string> = {
  Assigned: styles.aAssigned,
  Reassigned: styles.aReassigned,
  Rejected: styles.aRejected,
  "Status changed": styles.aStatus,
  "Update posted": styles.aUpdate,
};

/** Activity Log (roadmap Sprint 4): changes made by admins and departments. Admin-only. */
export default function ActivityLogPage() {
  const { activity } = useDemoStore();
  const modals = useComplaintModals();
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);

  const q = normalizeTrackingId(query);
  const rows = activity
    .filter((a) => (!action || a.action === action) && (!role || a.actorRole === role))
    .filter((a) => !q || a.trackingId.includes(q))
    .sort((a, b) => b.at.localeCompare(a.at));
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div className="container">
      <div className={s.head}>
        <BackToDashboard />
        <div className={s.listTitleRow}>
          <h1 className={s.listTitle}>Activity Log</h1>
          <span className={`${s.countPill} ${s.pillTotal}`}>{activity.length}</span>
        </div>
        <p className={s.subtitle}>Assignments, reassignments, rejections and status changes made by administrators and departments.</p>
      </div>

      <section className={s.panel} aria-label="Activity log">
        <div className={s.toolbar}>
          <SearchBox
            value={query}
            onChange={(v) => {
              setQuery(v);
              setPage(1);
            }}
          />
          <select
            aria-label="Filter by action"
            className={`select ${s.filter}`}
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All actions</option>
            {ACTIVITY_ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by actor"
            className={`select ${s.filter}`}
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Admins and departments</option>
            <option value="Admin">Admins only</option>
            <option value="Department">Departments only</option>
          </select>
        </div>

        <div className={s.tableWrap}>
          <table className={s.table}>
            <caption className="visually-hidden">Activity log</caption>
            <thead>
              <tr>
                <th scope="col">Date &amp; time</th>
                <th scope="col">Tracking ID</th>
                <th scope="col">Actor</th>
                <th scope="col">Action</th>
                <th scope="col">Department</th>
                <th scope="col">Details</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((a) => (
                <tr key={a.id}>
                  <td data-label="Date & time" className={s.date}>
                    {formatLongDate(a.at)}
                    <span className={styles.time}>{formatTime(a.at)}</span>
                  </td>
                  <td data-label="Tracking ID">
                    <button type="button" className={s.idLink} onClick={() => modals.openDetails(a.trackingId)}>
                      {a.trackingId}
                    </button>
                  </td>
                  <td data-label="Actor">
                    <span className={s.strong}>{a.actor}</span>
                    <span className={styles.role}>{a.actorRole}</span>
                  </td>
                  <td data-label="Action">
                    <span className={`${s.pill} ${ACTION_CLASS[a.action]}`}>{a.action}</span>
                  </td>
                  <td data-label="Department">{a.department ?? "—"}</td>
                  <td data-label="Details" className={styles.detail}>
                    {a.detail ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 ? <p className={s.empty}>No activity matches these filters.</p> : null}
        </div>
        <Pager page={current} pageSize={PAGE_SIZE} total={rows.length} onPage={setPage} />
      </section>
      {modals.modals}
    </div>
  );
}
