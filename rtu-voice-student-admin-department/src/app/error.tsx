"use client";

import { RouteError } from "@/components/RouteStates";

// Fallback for pages outside the portals (public and auth pages), and for errors in a portal's own layout.
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main id="main" className="portal-bg">
      <RouteError error={error} retry={retry} />
    </main>
  );
}
