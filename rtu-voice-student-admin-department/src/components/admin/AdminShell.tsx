"use client";

import type { ReactNode } from "react";
import { useDemoStore } from "@/lib/demo-store";
import type { Role } from "@/lib/types";
import { ConsoleShell, type ConsoleNavItem } from "./ConsoleShell";

/** The admin console is shared: the superadmin sees everything the admin sees, plus its own pages. */
const CONSOLE_ROLES: Role[] = ["admin", "superadmin"];

/** Pages both admin and superadmin use, in the order given by the SRS. */
const SHARED_NAV: ConsoleNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "grid" },
  { href: "/admin/complaints", label: "Total Complaints", icon: "list" },
  { href: "/admin/assigned", label: "Assigned", icon: "flag" },
  { href: "/admin/in-progress", label: "In Progress", icon: "clock" },
  { href: "/admin/resolved", label: "Resolved", icon: "check" },
  { href: "/admin/statistics", label: "Statistics", icon: "bar-chart" },
];

/** Admin: SRS §3 menu ends with View Admin (read-only list of administrators). */
const ADMIN_NAV: ConsoleNavItem[] = [...SHARED_NAV, { href: "/admin/admins", label: "View Admin", icon: "users" }];

/** Superadmin: account and department management, plus the superadmin-only Activity Log (SRS §3, §7). */
const SUPERADMIN_NAV: ConsoleNavItem[] = [
  ...SHARED_NAV,
  { href: "/admin/accounts", label: "Accounts", icon: "users-cog" },
  { href: "/admin/departments", label: "Departments", icon: "building" },
  { href: "/admin/activity", label: "Activity Log", icon: "history" },
];

/** Layout for every Central Admin Console page (admin and superadmin). */
export function AdminShell({ children }: { children: ReactNode }) {
  const { session } = useDemoStore();
  const superadmin = session?.role === "superadmin";
  return (
    <ConsoleShell
      roles={CONSOLE_ROLES}
      nav={superadmin ? SUPERADMIN_NAV : ADMIN_NAV}
      homeHref="/admin"
      profileHref="/admin/profile"
      consoleLabel={superadmin ? "Super Admin Console" : "Central Admin Console"}
      menuLabel={superadmin ? "Super admin menu" : "Admin menu"}
    >
      {children}
    </ConsoleShell>
  );
}
