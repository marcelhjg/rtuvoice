"use client";

import type { ReactNode } from "react";
import type { Role } from "@/lib/types";
import { ConsoleShell, type ConsoleNavItem } from "./ConsoleShell";

const SUPERADMIN_ROLES: Role[] = ["superadmin"];

/**
 * Superadmin Portal (SRS §3, §7): a separate, deliberately small portal. It manages accounts and
 * departments and owns the Activity Log; it has none of the admin console's complaint pages.
 */
const NAV: ConsoleNavItem[] = [
  { href: "/superadmin", label: "Accounts", icon: "users-cog" },
  { href: "/superadmin/departments", label: "Departments", icon: "building" },
  { href: "/superadmin/activity", label: "Activity Log", icon: "history" },
];

export function SuperadminShell({ children }: { children: ReactNode }) {
  return (
    <ConsoleShell roles={SUPERADMIN_ROLES} nav={NAV} homeHref="/superadmin" profileHref="/superadmin/profile" consoleLabel="Super Admin Portal" menuLabel="Super Admin menu">
      {children}
    </ConsoleShell>
  );
}
