"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { StatusBadge } from "@/components/StatusBadge";
import { useDemoStore } from "@/lib/demo-store";
import { formatCardDate } from "@/lib/format";
import { CATEGORIES, PUBLIC_STATUSES, type Category, type PublicStatus } from "@/lib/types";
import styles from "./public.module.css";

const PAGE_SIZE = 6;

export function PublicDashboard() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const status = (PUBLIC_STATUSES as readonly string[]).includes(params.get("status") ?? "") ? (params.get("status") as PublicStatus) : "";
  // "Other" was renamed "Others"; old shared links (?category=Other) still filter correctly.
  const rawCategory = params.get("category") === "Other" ? "Others" : (params.get("category") ?? "");
  const category = (CATEGORIES as readonly string[]).includes(rawCategory) ? (rawCategory as Category) : "";
  const page = Math.max(1, Number.parseInt(params.get("page") ?? "1", 10) || 1);

  // Filters live in the URL so results can be bookmarked and the back button works.
  const update = (next: { status?: string; category?: string; page?: number }) => {
    const q = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === "" || v === undefined || (k === "page" && v === 1)) q.delete(k);
      else q.set(k, String(v));
    }
    const qs = q.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const { publicConcerns: all } = useDemoStore();
  const filtered = all.filter((c) => (!status || c.status === status) && (!category || c.category === category));
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const resolvedCount = all.filter((c) => c.status === "Resolved").length;

  return (
    <div className="container">
      <div className="page-head">
        <h1 className="page-title">Public Dashboard</h1>
        <p className="page-subtitle">
          A transparent view of concerns raised across campus. Titles and summaries are written by AI and contain no personal details.
        </p>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <span className={styles.filterLabel} id="filter-label">
            Filter:
          </span>
          <select
            aria-label="Filter by status"
            className={`select ${styles.filter}`}
            value={status}
            onChange={(e) => update({ status: e.target.value, page: 1 })}
          >
            <option value="">Status</option>
            {PUBLIC_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter by category"
            className={`select ${styles.filter}`}
            value={category}
            onChange={(e) => update({ category: e.target.value, page: 1 })}
          >
            <option value="">Category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button type="button" className={styles.clear} onClick={() => update({ status: "", category: "", page: 1 })} disabled={!status && !category}>
            Clear
          </button>
        </div>
        <p className={styles.count} aria-live="polite">
          {status || category ? `${filtered.length} matching • ` : ""}
          {all.length} shared concerns • {resolvedCount} resolved
        </p>
      </div>

      {visible.length === 0 ? (
        <div className={styles.empty}>
          <Icon name="search" size={30} strokeWidth={1.6} />
          <p>No shared concerns match these filters.</p>
          <button type="button" className="btn btn-outline" onClick={() => update({ status: "", category: "", page: 1 })}>
            Clear filters
          </button>
        </div>
      ) : (
        <ul className={styles.grid}>
          {visible.map((c) => (
            <li key={c.id} className={`${styles.item} ${styles[accent(c.status)]}`}>
              <div className={styles.itemTop}>
                <span className={styles.category}>{c.category}</span>
                <StatusBadge status={c.status} />
              </div>
              <h2 className={styles.itemTitle}>{c.title}</h2>
              <p className={styles.summary}>{c.summary}</p>
              <p className={styles.date}>{formatCardDate(c.date)}</p>
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 && (
        <nav className={styles.pager} aria-label="Pagination">
          <button type="button" className={styles.pageArrow} aria-label="Previous page" disabled={current === 1} onClick={() => update({ page: current - 1 })}>
            <Icon name="chevron-left" size={18} strokeWidth={2.2} />
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              className={`${styles.pageNum} ${n === current ? styles.pageActive : ""}`}
              aria-current={n === current ? "page" : undefined}
              onClick={() => update({ page: n })}
            >
              {n}
            </button>
          ))}
          <button type="button" className={styles.pageArrow} aria-label="Next page" disabled={current === pageCount} onClick={() => update({ page: current + 1 })}>
            <Icon name="chevron-right" size={18} strokeWidth={2.2} />
          </button>
        </nav>
      )}
      <p className={styles.demo}>
        <span className="demo-note">
          <Icon name="info" size={14} /> Demo data: these entries are samples, not real campus concerns.
        </span>
      </p>
    </div>
  );
}

function accent(status: PublicStatus): "accentProgress" | "accentAssigned" | "accentResolved" {
  return status === "In Progress" ? "accentProgress" : status === "Assigned" ? "accentAssigned" : "accentResolved";
}
