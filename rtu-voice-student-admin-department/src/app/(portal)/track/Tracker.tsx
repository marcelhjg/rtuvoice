"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent, useState, type FormEvent } from "react";
import { UpdateMessages } from "@/components/ComplaintDetailsDialog";
import { ComplaintStatusDetails } from "@/components/ComplaintStatusDetails";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { useDemoStore } from "@/lib/demo-store";
import type { Complaint } from "@/lib/types";
import { normalizeTrackingId } from "@/lib/validation";
import styles from "./track.module.css";

const ID_PATTERN = /^STU-[A-Z0-9]{5}$/;

type Lookup = { state: "idle" } | { state: "invalid"; message: string } | { state: "notfound"; id: string } | { state: "found"; complaint: Complaint };

export function Tracker() {
  const params = useSearchParams();
  const pathname = usePathname();
  const { findMyComplaint, ready } = useDemoStore();

  const initial = params.get("id") ?? "";
  const [query, setQuery] = useState(initial);
  const [lookup, setLookup] = useState<Lookup>({ state: "idle" });
  const [busy, setBusy] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);

  const run = (raw: string) => {
    const id = normalizeTrackingId(raw);
    if (!id) {
      setLookup({ state: "invalid", message: "Enter a tracking ID." });
      return;
    }
    if (!ID_PATTERN.test(id)) {
      setLookup({ state: "invalid", message: "Tracking IDs look like STU-A3F1B (STU, a dash, then 5 letters or numbers)." });
      return;
    }
    // SIMULATED lookup against this browser's demo data (the real system calls a secure RPC).
    setBusy(true);
    window.setTimeout(() => {
      const found = findMyComplaint(id);
      setLookup(found ? { state: "found", complaint: found } : { state: "notfound", id });
      setQuery(id);
      setBusy(false);
      // Keep the URL shareable (?id=…). The native History API updates it without a server round trip
      // (it stays in sync with useSearchParams); router.replace fetched the page again and that request
      // was cancelled. Skipped when the URL already shows this ID.
      if (params.get("id") !== id) window.history.replaceState(null, "", `${pathname}?id=${encodeURIComponent(id)}`);
    }, 350);
  };

  // Auto-track when arriving with ?id= — once, when the demo store has loaded. An effect event reads the
  // latest ID without re-running the effect each time the URL changes.
  const autoTrack = useEffectEvent(() => {
    if (initial) run(initial);
  });
  useEffect(() => {
    if (ready) autoTrack();
  }, [ready]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    run(query);
  };


  return (
    <div className="container">
      <div className="page-head">
        <h1 className="page-title">Status Tracker</h1>
        <p className="page-subtitle">Look up a concern with its tracking ID.</p>
      </div>

      <form className={styles.searchCard} onSubmit={submit} role="search" noValidate>
        <label htmlFor="tracking-id" className="visually-hidden">
          Tracking ID
        </label>
        <div className={`${styles.searchBox} ${lookup.state === "invalid" ? styles.searchError : ""}`}>
          <Icon name="search" size={24} strokeWidth={2} />
          <input
            id="tracking-id"
            className={styles.searchInput}
            placeholder="Enter tracking ID, e.g. STU-A3F1B"
            value={query}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={lookup.state === "invalid" || undefined}
            aria-describedby={lookup.state === "invalid" ? "tracking-err" : undefined}
            onChange={(e) => {
              setQuery(e.target.value.toUpperCase());
              if (lookup.state === "invalid") setLookup({ state: "idle" });
            }}
          />
        </div>
        <button type="submit" className={styles.trackBtn} disabled={busy}>
          {busy ? <span className="spinner" /> : null}
          Track
        </button>
        {lookup.state === "invalid" ? (
          <p id="tracking-err" className={`field-error ${styles.searchMsg}`} role="alert">
            <Icon name="alert-triangle" size={13} strokeWidth={2.2} /> {lookup.message}
          </p>
        ) : null}
      </form>

      <div aria-live="polite">
        {lookup.state === "notfound" ? (
          <section className={`${styles.resultCard} ${styles.empty}`}>
            <Icon name="search" size={34} strokeWidth={1.6} />
            <h2>No concern found for {lookup.id}</h2>
            <p>Check the ID on your receipt. You can only look up concerns submitted from your account.</p>
            <Link href="/history" className="btn btn-outline" style={{ marginTop: 14, minHeight: 44, padding: "0 22px" }}>
              Open your History
            </Link>
          </section>
        ) : null}

        {lookup.state === "idle" && !busy ? (
          <section className={`${styles.resultCard} ${styles.empty}`}>
            <Icon name="file-text" size={34} strokeWidth={1.6} />
            <h2>Enter a tracking ID to see its progress</h2>
            <p>Your tracking ID was shown after you submitted. It is also listed on your History page.</p>
          </section>
        ) : null}

        {lookup.state === "found" ? <ComplaintStatusDetails complaint={lookup.complaint} onViewUpdate={() => setShowUpdate(true)} /> : null}
      </div>

      {lookup.state === "found" ? (
        <Modal
          open={showUpdate}
          onClose={() => setShowUpdate(false)}
          title="Update from the department"
          mobileContent
          footer={
            <button type="button" className={`btn btn-primary ${styles.closeBtn}`} onClick={() => setShowUpdate(false)}>
              Close
            </button>
          }
        >
          {/* Shared with History's details: newest first, or an empty state when there's no update yet. */}
          <UpdateMessages complaint={lookup.complaint} />
          {lookup.complaint.updates.length ? (
            <div className={styles.updateNote}>
              <Icon name="info" size={20} />
              This message is visible only to you and the administrators. It is never shown on the public dashboard.
            </div>
          ) : null}
        </Modal>
      ) : null}
    </div>
  );
}
