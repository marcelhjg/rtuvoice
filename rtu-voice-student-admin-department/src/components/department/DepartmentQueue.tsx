"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useDemoStore } from "@/lib/demo-store";
import { formatMonthDay, formatShortDate, formatTime } from "@/lib/format";
import { attentionInfo, slaInfo } from "@/lib/sla";
import { DEPARTMENT_STATUSES, PRIORITIES, type Complaint, type DepartmentStatus } from "@/lib/types";
import { normalizeTrackingId } from "@/lib/validation";
import { Icon } from "../Icon";
import { Modal } from "../Modal";
import { useToast } from "../Toast";
import { BackToDashboard, Pager, PriorityDot, SearchBox, StatusPill, adminStyles as s } from "../admin/bits";
import { StatCards } from "../admin/StatCards";
import { useComplaintModals } from "../admin/useComplaintModals";
import m from "../admin/modals.module.css";
import d from "./department.module.css";

const PAGE_SIZE = 8;
const UPDATE_MAX = 500;
const UPDATE_MIN = 10;

const matches = (c: Complaint, query: string) => {
  const q = normalizeTrackingId(query);
  return !q || c.trackingId.includes(q) || c.title.toUpperCase().includes(query.trim().toUpperCase());
};

/** Rows of the department's own queue. Student identity is never part of a complaint row (pseudonymous). */
function useQueueActions() {
  const { updateDepartmentStatus } = useDemoStore();
  const toast = useToast();
  const [updating, setUpdating] = useState<string | null>(null);
  const modals = useComplaintModals();

  const setStatus = (c: Complaint, status: DepartmentStatus) => {
    if (updateDepartmentStatus(c.trackingId, status)) {
      toast(`${c.trackingId} marked ${status === "In Progress" ? "In progress" : status}. The student is notified by email (simulated).`, "success");
    }
  };

  return {
    modals,
    setStatus,
    openUpdate: (id: string) => setUpdating(id),
    updateModal: updating ? <AddUpdateModal key={updating} id={updating} onClose={() => setUpdating(null)} /> : null,
  };
}

/** One row's "Update status" dropdown and "Add Update" button (Figma: end of every row). */
function RowActions({
  c,
  onStatus,
  onAdd,
  onView,
}: {
  c: Complaint;
  onStatus: (c: Complaint, s: DepartmentStatus) => void;
  onAdd: (id: string) => void;
  onView: (id: string) => void;
}) {
  if (c.status === "Resolved") {
    return (
      <div className={d.rowActions}>
        <button type="button" className={d.viewUpdatesBtn} onClick={() => onView(c.trackingId)}>
          View updates
        </button>
        <span className={d.resolvedNote}>Resolved — no further changes can be made.</span>
      </div>
    );
  }

  return (
    <div className={d.rowActions}>
      <select
        aria-label={`Update status of ${c.trackingId}`}
        className={`select ${d.updateSelect}`}
        value=""
        onChange={(e) => onStatus(c, e.target.value as DepartmentStatus)}
      >
        <option value="" disabled>
          Update status
        </option>
        {/* "Assigned" is never offered: it is set automatically when an administrator assigns the complaint. */}
        {DEPARTMENT_STATUSES.map((st) => (
          <option key={st} value={st} disabled={c.status === st}>
            {st === "In Progress" ? "In progress" : st}
            {c.status === st ? " (current)" : ""}
          </option>
        ))}
      </select>
      <button type="button" className={d.addBtn} onClick={() => onAdd(c.trackingId)} aria-label={`Add update to ${c.trackingId}`}>
        <Icon name="plus" size={15} strokeWidth={2.6} /> Add Update
      </button>
    </div>
  );
}

function Table({
  caption,
  rows,
  actions,
  mode = "queue",
}: {
  caption: string;
  rows: Complaint[];
  actions: ReturnType<typeof useQueueActions>;
  mode?: "queue" | "attention";
}) {
  return (
    <table className={s.table}>
      <caption className="visually-hidden">{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Date</th>
          <th scope="col">Tracking ID</th>
          <th scope="col">Title</th>
          {mode === "queue" ? <th scope="col">Assigned</th> : null}
          <th scope="col">Priority</th>
          <th scope="col">Status</th>
          <th scope="col">{mode === "attention" ? "Needs attention" : "SLA"}</th>
          <th scope="col">
            <span className="visually-hidden">Update status and add update</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((c) => {
          const sla = slaInfo(c);
          const attention = mode === "attention" ? attentionInfo(c) : null;
          // Before work starts the clock that matters is "acknowledge within": show it (and flag it once missed).
          const unack = c.status === "Assigned" ? attentionInfo(c) : null;
          const slaCell = unack?.reason === "unacknowledged" ? { label: unack.label, tone: unack.days > 0 ? "danger" : "neutral" } : sla;
          const slaTone = c.status === "Resolved" ? "neutral" : slaCell.tone;
          const attentionOverdue = attention?.reason === "overdue" || (attention?.reason === "unacknowledged" && attention.days > 0);
          return (
            <tr key={c.trackingId}>
              <td data-label="Date" className={s.date}>
                {formatShortDate(c.submittedAt)}
              </td>
              <td data-label="Tracking ID">
                <button type="button" className={s.idLink} onClick={() => actions.modals.openDetails(c.trackingId)}>
                  {c.trackingId}
                </button>
              </td>
              <td data-label="Title" className={`${s.strong} ${d.titleCell}`}>
                {c.title}
              </td>
              {mode === "queue" ? (
                <td data-label="Assigned" className={s.date}>
                  {c.assignedAt ? formatShortDate(c.assignedAt) : "—"}
                </td>
              ) : null}
              <td data-label="Priority">
                <PriorityDot priority={c.priority} />
              </td>
              <td data-label="Status">
                <StatusPill status={c.status} />
              </td>
              {mode === "attention" ? (
                <td data-label="Needs attention" className={`${d.reason} ${attentionOverdue ? d.reasonLate : d.reasonWait}`}>
                  {attention?.reason === "overdue" ? attention.label : `Unacknowledged · ${attention?.label ?? ""}`}
                </td>
              ) : (
                <td data-label="SLA" className={`${d.slaCell} ${slaTone === "danger" ? d.slaOverdue : s.muted}`}>
                  {slaCell.label}
                </td>
              )}
              <td data-label="Actions">
                <RowActions c={c} onStatus={actions.setStatus} onAdd={actions.openUpdate} onView={actions.modals.openUpdates} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ------------------------------------------------------------------------------------------ */

/** Department Dashboard (Figma: Department Portal / Dashboard). */
export function DepartmentDashboard() {
  const { departmentComplaints: all, session } = useDemoStore();
  const actions = useQueueActions();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const counts = useMemo(
    () => ({
      total: all.length,
      assigned: all.filter((c) => c.status === "Assigned").length,
      inProgress: all.filter((c) => c.status === "In Progress").length,
      resolved: all.filter((c) => c.status === "Resolved").length,
    }),
    [all],
  );

  const rows = all
    .filter((c) => (!status || c.status === status) && matches(c, query))
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div className="container">
      <div className={s.head}>
        <h1 className={s.title}>Dashboard</h1>
        <p className={s.subtitle}>Complaints assigned to your department. Student identities are never shown.</p>
      </div>

      <StatCards counts={counts} base="/department" />

      <section className={s.panel} aria-label={`${session?.department ?? "Department"} complaint queue`}>
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
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
        <div className={s.tableWrap}>
          <Table caption="Complaints assigned to your department" rows={visible} actions={actions} />
          {rows.length === 0 ? <p className={s.empty}>{all.length === 0 ? "No complaints are assigned to your department yet." : "No complaints match these filters."}</p> : null}
        </div>
        <Pager page={current} pageSize={PAGE_SIZE} total={rows.length} onPage={setPage} />
        <p className={d.footnote}>Assigned isn’t selectable — it’s set automatically on assignment. Departments cannot reject or reassign complaints.</p>
      </section>
      {actions.modals.modals}
      {actions.updateModal}
    </div>
  );
}

export type DepartmentListKind = "total" | "assigned" | "progress" | "resolved";

const LISTS: Record<DepartmentListKind, { title: string; subtitle: string; pill: string; filter: (c: Complaint) => boolean }> = {
  total: { title: "Total complaints", subtitle: "Every complaint assigned to your department.", pill: s.pillTotal, filter: () => true },
  assigned: { title: "Assigned", subtitle: "Waiting for your department to start work.", pill: s.pillAssigned, filter: (c) => c.status === "Assigned" },
  progress: { title: "In progress", subtitle: "Complaints your department is currently working on.", pill: s.pillProgress, filter: (c) => c.status === "In Progress" },
  resolved: { title: "Resolved", subtitle: "Complaints your department has resolved.", pill: s.pillResolved, filter: (c) => c.status === "Resolved" },
};

/** Total complaints / Assigned / In progress / Resolved pages (reached from the menu or the stat boxes). */
export function DepartmentList({ kind }: { kind: DepartmentListKind }) {
  const { departmentComplaints } = useDemoStore();
  const actions = useQueueActions();
  const cfg = LISTS[kind];
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);

  const all = departmentComplaints.filter(cfg.filter);
  const rows = all
    .filter((c) => matches(c, query))
    .sort((a, b) => (sort === "newest" ? b.submittedAt.localeCompare(a.submittedAt) : a.submittedAt.localeCompare(b.submittedAt)));
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div className="container">
      <div className={s.head}>
        <BackToDashboard href="/department" />
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
          <select aria-label="Sort" className={`select ${s.filter}`} value={sort} onChange={(e) => setSort(e.target.value as "newest" | "oldest")}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
        <div className={s.tableWrap}>
          <Table caption={cfg.title} rows={visible} actions={actions} />
          {rows.length === 0 ? <p className={s.empty}>{all.length === 0 ? "No complaints in this list yet." : "No complaints match these filters."}</p> : null}
        </div>
        <Pager page={current} pageSize={PAGE_SIZE} total={rows.length} onPage={setPage} />
      </section>
      {actions.modals.modals}
      {actions.updateModal}
    </div>
  );
}

/** Needs Attention: overdue and unacknowledged complaints, most overdue first, with a priority filter. */
export function NeedsAttention() {
  const { departmentComplaints } = useDemoStore();
  const actions = useQueueActions();
  const [query, setQuery] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);

  const flagged = departmentComplaints.map((c) => ({ c, a: attentionInfo(c) })).filter((x): x is { c: Complaint; a: NonNullable<ReturnType<typeof attentionInfo>> } => !!x.a);
  const rows = flagged
    .filter((x) => (!priority || x.c.priority === priority) && matches(x.c, query))
    .sort((a, b) => a.a.rank - b.a.rank || (a.c.assignedAt ?? "").localeCompare(b.c.assignedAt ?? ""))
    .map((x) => x.c);
  const overdueCount = flagged.filter((x) => x.a.reason === "overdue").length;
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  return (
    <div className="container">
      <div className={s.head}>
        <BackToDashboard href="/department" />
        <div className={s.listTitleRow}>
          <h1 className={s.listTitle}>Needs attention</h1>
          <span className={`${s.countPill} ${s.pillTotal}`} aria-label={`${flagged.length} complaints need attention`}>
            {flagged.length}
          </span>
        </div>
        <p className={s.subtitle}>
          {overdueCount} overdue · {flagged.length - overdueCount} waiting to be acknowledged. Most overdue first; the SLA clock started when each complaint was assigned.
        </p>
      </div>
      <section className={s.panel} aria-label="Complaints that need attention">
        <div className={s.toolbar}>
          <SearchBox
            value={query}
            onChange={(v) => {
              setQuery(v);
              setPage(1);
            }}
          />
          <select
            aria-label="Filter by priority"
            className={`select ${s.filter}`}
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All priority levels</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className={s.tableWrap}>
          <Table caption="Complaints that need attention" rows={visible} actions={actions} mode="attention" />
          {rows.length === 0 ? <p className={s.empty}>{flagged.length === 0 ? "Nothing needs attention right now. Well done!" : "No complaints match these filters."}</p> : null}
        </div>
        <Pager page={current} pageSize={PAGE_SIZE} total={rows.length} onPage={setPage} />
      </section>
      {actions.modals.modals}
      {actions.updateModal}
    </div>
  );
}

/* ------------------------------------------------------------------------------------------ */

const when = (iso: string) => `${formatMonthDay(iso)}, ${formatTime(iso)}`;

/** "Add Update": writes the message the student reads through View Update (never public). */
function AddUpdateModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { departmentComplaints, addDepartmentUpdate } = useDemoStore();
  const toast = useToast();
  const c = departmentComplaints.find((x) => x.trackingId === id);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  if (!c || c.status === "Resolved") return null;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = message.trim();
    if (text.length < UPDATE_MIN) {
      setError(text ? `Write a little more (at least ${UPDATE_MIN} characters).` : "Enter the update for the student.");
      return;
    }
    if (addDepartmentUpdate(c.trackingId, text)) {
      toast(`Update added to ${c.trackingId}. The student is notified by email (simulated).`, "success");
      onClose();
    }
  };

  const previous = [...c.updates].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <Modal open onClose={onClose} align="left" size="md" variant="dialog" title="Add update" subtitle={`${c.trackingId} · ${c.title}`}>
      <form onSubmit={submit} noValidate className={m.form}>
        <div className={`field ${error ? "has-error" : ""}`}>
          <label htmlFor="dept-update" className={m.label}>
            Update message <span className="req">*</span>
          </label>
          <textarea
            id="dept-update"
            className={`textarea ${m.textarea}`}
            maxLength={UPDATE_MAX}
            placeholder="e.g. Our maintenance team inspected the area. Repair is scheduled for this week."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setError(null);
            }}
          />
          {error ? <span className="field-error">{error}</span> : null}
          <span className={d.counter}>
            {message.length}/{UPDATE_MAX}
          </span>
          <span className={m.help}>
            The student who submitted this complaint reads it through <strong>View Update</strong>, and administrators see it in the Master Tracking Queue. It is
            never shown on the public dashboard. Do not include personal details. <em>(Email notification is simulated in this demo; emails contain no links.)</em>
          </span>
        </div>

        {previous.length > 0 ? (
          <div>
            <p className={d.prevTitle}>Previous updates</p>
            <ul className={d.prevList}>
              {previous.map((u) => (
                <li key={u.at} className={d.prevItem}>
                  <span className={d.prevTime}>{when(u.at)}</span>
                  {u.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className={m.footer}>
          <button type="button" className={`btn btn-soft ${m.btn}`} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={`btn btn-primary ${m.btn}`}>
            Post update
          </button>
        </div>
      </form>
    </Modal>
  );
}
