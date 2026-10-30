"use client";

import { useEffect } from "react";
import "@/styles/globals.css";

// Last-resort error screen: replaces the root layout when it fails, so it brings its own <html>/<body>
// and can't use the demo store or the header. "Try again" re-renders; the link reloads the landing page.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <html lang="en">
      <body>
        <title>Something went wrong · RTU Voice</title>
        <main id="main" className="portal-bg" style={{ minHeight: "100svh", display: "grid", placeItems: "center" }}>
          <div className="route-state route-state-error" role="alert">
            <h1 className="route-state-title">Something went wrong</h1>
            <p className="route-state-text">RTU Voice couldn&apos;t load. Try again, or reload the home page.</p>
            <div className="route-state-actions">
              <button type="button" className="btn btn-primary" onClick={() => retry()}>
                Try again
              </button>
              {/* A plain link (full reload) on purpose: the app's own navigation may be what failed. */}
              <a href="/" className="btn btn-outline">
                Go to home page
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
