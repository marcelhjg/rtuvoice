"use client";

import type { ReactNode } from "react";
import { ConsoleShell, type ConsoleNavItem } from "./ConsoleShell";

/**
 * Superadmin Portal (SRS §3, §7): a separate, deliberately small portal. It manages staff and
 * student accounts and departments and owns the Activity Log; it has no complaint pages.
 * Who may enter is enforced on the server in app/superadmin/layout.tsx (requireRole), not here.
 */
const NAV: ConsoleNavItem[] = [
  { href: "/superadmin", label: "Accounts", icon: "users-cog" },
  { href: "/superadmin/students", label: "Students", icon: "users" },
  { href: "/superadmin/departments", label: "Departments", icon: "building" },
  { href: "/superadmin/activity", label: "Activity Log", icon: "history" },
];

export function SuperadminShell({ children }: { children: ReactNode }) {
  return (
    <ConsoleShell nav={NAV} homeHref="/superadmin" profileHref="/superadmin/profile" consoleLabel="Super Admin Portal" menuLabel="Super Admin menu">
      {children}
    </ConsoleShell>
  );
}