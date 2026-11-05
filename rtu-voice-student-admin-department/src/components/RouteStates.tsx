"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Icon } from "@/components/Icon";

export function RouteLoading({ label = "Loading…", compact = false }: { label?: string; compact?: boolean }) {
  return (
    <div className={`route-state ${compact ? "route-state-compact" : ""}`} role="status" aria-live="polite">
      <span className="spinner spinner-lg" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function RouteError({
  error,
  retry,
  homeHref = "/",
  homeLabel = "Go to home page",
}: {
  error: Error & { digest?: string };
  retry: () => void;
  homeHref?: string;
  homeLabel?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="route-state route-state-error" role="alert">
      <Icon name="alert-triangle" size={36} strokeWidth={1.8} />
      <h1 className="route-state-title">Something went wrong</h1>
      <p className="route-state-text">This page couldn&apos;t load. Try again, or go back to your home page.</p>
      <div className="route-state-actions">
        <button type="button" className="btn btn-primary" onClick={() => retry()}>
          Try again
        </button>
        <Link href={homeHref} className="btn btn-outline">
          {homeLabel}
        </Link>
      </div>
    </div>
  );
}