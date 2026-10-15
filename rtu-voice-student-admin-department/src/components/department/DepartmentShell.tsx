"use client";

import type { ReactNode } from "react";
import { useDemoStore } from "@/lib/demo-store";
import { ConsoleShell, type ConsoleNavItem } from "../admin/ConsoleShell";

/** Hamburger menu from the Figma "Department Portal" sidebar frame (roadmap Sprint 5). */
const NAV: ConsoleNavItem[] = [
  { href: "/department", label: "Dashboard", icon: "grid" },
  { href: "/department/needs-attention", label: "Needs Attention", icon: "alert-triangle" },
  { href: "/department/complaints", label: "Total Complaints", icon: "list" },
  { href: "/department/assigned", label: "Assigned", icon: "flag" },
  { href: "/department/in-progress", label: "In Progress", icon: "clock" },
  { href: "/department/resolved", label: "Resolved", icon: "check" },
  { href: "/department/statistics", label: "Statistics", icon: "bar-chart" },
];

/** Layout for every Department Portal page: same shell as the admin console, restricted to department-head accounts. */
export function DepartmentShell({ children }: { children: ReactNode }) {
  const { session } = useDemoStore();
  return (
    <ConsoleShell
      role="department"
      nav={NAV}
      homeHref="/department"
      profileHref="/department/profile"
      consoleLabel="Department Portal"
      consoleSub={session?.department}
      menuLabel="Department menu"
    >
      {children}
    </ConsoleShell>
  );
}
