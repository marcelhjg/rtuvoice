"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCardDate } from "@/lib/format";
import { CATEGORIES, PUBLIC_STATUSES, type Category, type PublicConcern, type PublicStatus } from "@/lib/types";
import { getPublicComplaints } from "@/actions/studentActions"; // your real path
import styles from "./public.module.css";

const PAGE_SIZE = 6;

export function PublicDashboard({ initialRows, total }: { initialRows: PublicConcern[]; total: number }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const status = (PUBLIC_STATUSES as readonly string[]).includes(params.get("status") ?? "") ? (params.get("status") as PublicStatus) : "";
  const rawCategory = params.get("category") ?? "";
  const category = (CATEGORIES as readonly string[]).includes(rawCategory) ? (rawCategory as Category) : "";

  const update = (next: { status?: string; category?: string }) => {
    const q = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === "" || v === undefined) q.delete(k);
      else q.set(k, String(v));
    }
    const qs = q.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const [extra, setExtra] = useState<PublicConcern[]>([]); // rows fetched by Load more for the current filter
  const [matchTotal, setMatchTotal] = useState<number | null>(null); // total matches, known after the first Load more
  const [exhausted, setExhausted] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Ignore a Load more response that arrives after the filter has changed.
  const filterKey = `${status}|${category}`;
  const keyRef = useRef(filterKey);
  keyRef.current = filterKey;

  // New filter: drop rows fetched for the old one, back to the first 48 and page 1.
  useEffect(() => {
    setExtra([]);
    setMatchTotal(null);
    setExhausted(false);
    setPage(1);
    setError(false);
  }, [status, category]);

  const filterActive = Boolean(status || category);
  const loaded = [...initialRows, ...extra];
  const filtered = loaded.filter((c) => (!status || c.status === status) && (!category || c.category === category));

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const everythingLoaded = total <= initialRows.length;
  const knownTotal = filterActive ? matchTotal : total;
  const hasMore = !everythingLoaded && !exhausted && (knownTotal === null || filtered.length < knownTotal);

  const loadMore = async () => {
    const started = keyRef.current;
    setLoading(true);
    setError(false);
    try {
      const res = await getPublicComplaints(filtered.length, status, category);
      if (keyRef.current !== started) return; // filter changed meanwhile
      if (res.total === undefined) {
        setError(true);
        return;
      }

      setMatchTotal(res.total);
      if (res.rows.length === 0) setExhausted(true);
      const seen = new Set(loaded.map((r) => r.id));
      const fresh = (res.rows as PublicConcern[]).filter((r) => !seen.has(r.id));
      setExtra([...extra, ...fresh]);
      if (fresh.length > 0) setPage(current + 1); // jump to the first new page
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

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
          <select aria-label="Filter by status" className={`select ${styles.filter}`} value={status} onChange={(e) => update({ status: e.target.value })}>
            <option value="">Status</option>
            {PUBLIC_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select aria-label="Filter by category" className={`select ${styles.filter}`} value={category} onChange={(e) => update({ category: e.target.value })}>
            <option value="">Category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button type="button" className={styles.clear} onClick={() => update({ status: "", category: "" })} disabled={!filterActive}>
            Clear
          </button>
        </div>
        <p className={styles.count} aria-live="polite">
          {filterActive ? `${filtered.length} matching so far` : `${total} shared concerns`}
        </p>
      </div>

      {visible.length === 0 ? (
        <div className={styles.empty}>
          <Icon name="search" size={30} strokeWidth={1.6} />
          {hasMore ? (
            <p>No matches among the most recent concerns. Load more to search older ones.</p>
          ) : (
            <>
              <p>No shared concerns match these filters.</p>
              <button type="button" className="btn btn-outline" onClick={() => update({ status: "", category: "" })}>
                Clear filters
              </button>
            </>
          )}
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
          <button type="button" className={styles.pageArrow} aria-label="Previous page" disabled={current === 1} onClick={() => setPage(current - 1)}>
            <Icon name="chevron-left" size={18} strokeWidth={2.2} />
          </button>
          <span aria-live="polite">
            Page {current} of {pageCount}
          </span>
          <button type="button" className={styles.pageArrow} aria-label="Next page" disabled={current === pageCount} onClick={() => setPage(current + 1)}>
            <Icon name="chevron-right" size={18} strokeWidth={2.2} />
          </button>
        </nav>
      )}

      {current === pageCount && hasMore && (
        <div className={styles.loadMore}>
          <button type="button" className="btn btn-outline" onClick={loadMore} disabled={loading}>
            {loading ? "Loading..." : "Load more"}
          </button>
        </div>
      )}
      {error && <p role="alert">Could not load more concerns. Please try again.</p>}
    </div>
  );
}

function accent(status: PublicStatus): "accentProgress" | "accentAssigned" | "accentResolved" {
  return status === "In Progress" ? "accentProgress" : status === "Assigned" ? "accentAssigned" : "accentResolved";
}