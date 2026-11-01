"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent, useRef, useState, type FormEvent } from "react";
import { UpdateMessages } from "@/components/ComplaintDetailsDialog";
import { ComplaintStatusDetails } from "@/components/ComplaintStatusDetails";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { trackComplaint } from "@/actions/studentActions";
import type { TrackedComplaint } from "@/features/student/studentTypes";
import styles from "./track.module.css";

const ID_PATTERN = /^STU-[A-Z0-9]{5}$/;
const NOT_FOUND_MESSAGE = "Complaint not found."; // must match the text the action returns

type Lookup =
  | { state: "idle" }
  | { state: "invalid"; message: string }
  | { state: "notfound"; id: string }
  | { state: "error"; message: string }
  | { state: "found"; complaint: TrackedComplaint };

export function Tracker() {
  const params = useSearchParams();
  const pathname = usePathname();

  const initial = params.get("id") ?? "";
  const [query, setQuery] = useState(initial);
  const [lookup, setLookup] = useState<Lookup>({ state: "idle" });
  const [busy, setBusy] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const latest = useRef(0); // ignore a response that arrives after a newer lookup started

  const run = async (raw: string) => {
    const id = raw.trim().toUpperCase();
    if (!id) {
      setLookup({ state: "invalid", message: "Enter a tracking ID." });
      return;
    }
    if (!ID_PATTERN.test(id)) {
      setLookup({ state: "invalid", message: "Tracking IDs look like STU-A3F1B (STU, a dash, then 5 letters or numbers)." });
      return;
    }

    const mine = ++latest.current;
    setBusy(true);
    setQuery(id);
    try {
      const fd = new FormData();
      fd.append("trackingId", id);
      const res = await trackComplaint(fd);
      if (mine !== latest.current) return;

      if (res.success && res.trackResult) {
        setLookup({ state: "found", complaint: res.trackResult });
      } else if (res.errors?.trackingId) {
        setLookup({ state: "invalid", message: res.errors.trackingId });
      } else if (res.message === NOT_FOUND_MESSAGE) {
        setLookup({ state: "notfound", id });
      } else {
        setLookup({ state: "error", message: res.message || "Something went wrong. Please try again." });
      }

      // Keep the URL shareable (?id=…) without a server round trip.
      if (params.get("id") !== id) window.history.replaceState(null, "", `${pathname}?id=${encodeURIComponent(id)}`);
    } catch (err) {
      console.error(err);
      if (mine === latest.current) setLookup({ state: "error", message: "Something went wrong. Please try again." });
    } finally {
      if (mine === latest.current) setBusy(false);
    }
  };

  // Auto-track once when arriving with ?id= (for example from the receipt page).
  const autoTrack = useEffectEvent(() => {
    if (initial) run(initial);
  });
  useEffect(() => {
    autoTrack();
  }, []);

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

        {lookup.state === "error" ? (
          <section className={`${styles.resultCard} ${styles.empty}`} role="alert">
            <Icon name="alert-triangle" size={34} strokeWidth={1.6} />
            <h2>We couldn&apos;t look that up</h2>
            <p>{lookup.message}</p>
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