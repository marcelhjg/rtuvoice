"use client";

import { RouteError } from "@/components/RouteStates";

// Catches a page that fails to render in this section; the header and menu stay usable.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError error={error} retry={reset} homeHref="/dashboard" homeLabel="Go to dashboard" />;
}