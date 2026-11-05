"use client";

import type { ReactNode } from "react";
import type { PortalUser } from "../portal/PortalHeader";
import { ConsoleShell, type ConsoleNavItem } from "./ConsoleShell";

const NAV: ConsoleNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "grid" },
  { href: "/admin/complaints", label: "Total Complaints", icon: "list" },
  { href: "/admin/assigned", label: "Assigned", icon: "flag" },
  { href: "/admin/in-progress", label: "In Progress", icon: "clock" },
  { href: "/admin/resolved", label: "Resolved", icon: "check" },
  { href: "/admin/statistics", label: "Statistics", icon: "bar-chart" },
  { href: "/admin/admins", label: "View Admin", icon: "users" },
];

export function AdminShell({ user, children }: { user: PortalUser; children: ReactNode }) {
  return (
    <ConsoleShell user={user} nav={NAV} homeHref="/admin" profileHref="/admin/profile" consoleLabel="Central Admin Console" menuLabel="Admin menu">
      {children}
    </ConsoleShell>
  );
}
