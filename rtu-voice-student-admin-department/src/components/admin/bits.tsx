"use client";

import Link from "next/link";
import type { Priority, Status } from "@/lib/types";
import { Icon } from "../Icon";
import s from "./admin.module.css";

/** Status labels follow the admin Figma screens ("In progress", sentence case). */
export function statusLabel(status: Status) {
  return status === "In Progress" ? "In progress" : status;
}

export function StatusPill({ status }: { status: Status }) {
  const cls = { Pending: s.pPending, Assigned: s.pAssigned, "In Progress": s.pProgress, Resolved: s.pResolved, Rejected: s.pRejected }[status];
  return <span className={`${s.pill} ${cls}`}>{statusLabel(status)}</span>;
}

export function PriorityPill({ priority }: { priority?: Priority }) {
  if (!priority) return <span className={s.muted}>—</span>;
  const cls = { High: s.prHigh, Medium: s.prMedium, Low: s.prLow }[priority];
  return <span className={`${s.pill} ${cls}`}>{priority}</span>;
}

export function PriorityDot({ priority }: { priority?: Priority }) {
  if (!priority) return <span className={s.muted}>—</span>;
  const cls = { High: s.dHigh, Medium: s.dMedium, Low: s.dLow }[priority];
  return <span className={`${s.dot} ${cls}`}>{priority}</span>;
}

export function BackToDashboard({ href = "/admin" }: { href?: string }) {
  return (
    <Link href={href} className={s.back}>
      <Icon name="arrow-left" size={16} strokeWidth={2.2} /> Back to Dashboard
    </Link>
  );
}

export function SearchBox({ value, onChange, label = "Search by Tracking ID" }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <div className={s.search}>
      <Icon name="search" size={17} strokeWidth={2} />
      <input
        type="search"
        className={s.searchInput}
        placeholder={label}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        autoComplete="off"
      />
    </div>
  );
}

/** Pagination in the Figma list pages: "Showing 1–8 of 128" · Previous 1 2 3 … 16 Next. */
export function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  const nums: (number | "…")[] = [];
  if (pageCount <= 6) {
    for (let i = 1; i <= pageCount; i++) nums.push(i);
  } else {
    const around = [page - 1, page, page + 1].filter((n) => n > 1 && n < pageCount);
    nums.push(1);
    if (around[0] > 2) nums.push("…");
    nums.push(...around);
    if (around[around.length - 1] < pageCount - 1) nums.push("…");
    nums.push(pageCount);
  }

  return (
    <div className={s.pager}>
      <span>
        Showing {from}–{to} of {total}
      </span>
      {pageCount > 1 && (
        <nav className={s.pages} aria-label="Pagination">
          <button type="button" className={`${s.pageBtn} ${s.pageWide}`} disabled={page === 1} onClick={() => onPage(page - 1)}>
            Previous
          </button>
          {nums.map((n, i) =>
            n === "…" ? (
              <span key={`e${i}`} className={s.ellipsis} aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                className={`${s.pageBtn} ${n === page ? s.pageActive : ""}`}
                aria-current={n === page ? "page" : undefined}
                aria-label={`Page ${n}`}
                onClick={() => onPage(n)}
              >
                {n}
              </button>
            ),
          )}
          <button type="button" className={`${s.pageBtn} ${s.pageWide}`} disabled={page === pageCount} onClick={() => onPage(page + 1)}>
            Next
          </button>
        </nav>
      )}
    </div>
  );
}

export { s as adminStyles };
