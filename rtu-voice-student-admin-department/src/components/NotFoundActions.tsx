"use client";

import Link from "next/link";
import { useHomeHref } from "@/components/RouteStates";

/**
 * 404 buttons. One link back to the right place for whoever is signed in: the student dashboard,
 * the admin console, the department portal or the Super Admin portal; the landing page when signed out.
 */
export function NotFoundActions() {
  const home = useHomeHref();
  return (
    <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
      <Link href={home.href} className="btn btn-primary" style={{ minHeight: 44 }}>
        {home.label}
      </Link>
    </div>
  );
}
