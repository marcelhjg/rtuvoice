// src/features/admin/adminUi.ts
// Small shared helpers + types for the admin screens. No "use server" / "use client".
import type { ComponentProps } from "react";
import type { PriorityDot, StatusPill } from "@/components/admin/bits";
import type { OngoingComplaint } from "@/features/admin/adminTypes";
import { statusLabel } from "@/features/shared/sharedUtils";

export type DepartmentOption = { id: number; name: string; is_active: boolean };
export type SearchParamsInput = Promise<Record<string, string | string[] | undefined>>;

/** First value of a search param. */
export const param = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/* ---- database values -> the labels the existing pills/dots expect ---- */

export type StatusProp = ComponentProps<typeof StatusPill>["status"];
export type PriorityProp = ComponentProps<typeof PriorityDot>["priority"];

// statusLabel now lives in sharedUtils (superAdminActions had its own copy); re-exported so existing imports keep working.
export { statusLabel };
export const asStatus = (s: string) => statusLabel(s) as StatusProp;

// ADJUST if your priority_levels names differ (PRIORITY_ID uses high / mid / low)
const PRIORITY_LABEL: Record<string, string> = { high: "High", mid: "Medium", medium: "Medium", low: "Low" };
export const asPriority = (p: string | null | undefined) =>
  (p ? (PRIORITY_LABEL[p.toLowerCase()] ?? p) : null) as PriorityProp;

/* ---- SLA text for the master tracking queue ---- */

const DAY = 86_400_000;

// ASSUMPTION: resolve_days = days allowed to resolve, counted from first_assigned_at.
export function ongoingSla(c: OngoingComplaint): { label: string; tone: "danger" | "success" | "muted" } {
  if (!c.first_assigned_at || c.resolve_days == null) return { label: "—", tone: "muted" };
  const due = new Date(c.first_assigned_at).getTime() + c.resolve_days * DAY;

  if (c.status === "resolved" && c.resolved_at) {
    return new Date(c.resolved_at).getTime() > due
      ? { label: "Resolved late", tone: "danger" }
      : { label: "Resolved on time", tone: "success" };
  }
  const daysLeft = Math.ceil((due - Date.now()) / DAY);
  if (daysLeft < 0) return { label: `${-daysLeft}d overdue`, tone: "danger" };
  return { label: daysLeft === 0 ? "Due today" : `${daysLeft}d left`, tone: "muted" };
}