"use client";

import { RouteError } from "@/components/RouteStates";

// Catches a page that fails to render in this section; the header and menu stay usable.
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <RouteError error={error} retry={retry} />;
}
