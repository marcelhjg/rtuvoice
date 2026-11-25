// Department-only types and constants.
// No "use server" here: a "use server" file may only export async functions.

import type { SlaFields } from "@/features/shared/sharedTypes";

/* ---------------- constants ---------------- */

export const NEXT_STATUSES = ["in_progress", "resolved"] as const;
export type NextStatus = (typeof NEXT_STATUSES)[number];

export const MAX_REASON = 500;
export const MAX_UPDATE_MESSAGE = 500; // the old check enforced 500 but its error text said 2000; change this if 2000 was intended

// status ids: 2 assigned, 3 in_progress, 4 resolved
export const DEPARTMENT_LISTS = {
  total:       { statusIds: undefined, dateField: "created"  },
  assigned:    { statusIds: [2],       dateField: "assigned" },
  in_progress: { statusIds: [3],       dateField: "assigned" },
  resolved:    { statusIds: [4],       dateField: "resolved" },
} as const;

export type DepartmentListKey = keyof typeof DEPARTMENT_LISTS;

/* ---------------- complaint lists + details ---------------- */

export type DepartmentComplaintRow = SlaFields & {
  id: string
  tracking_id: string;
  title: string;
  category_name: string;
  status_id: number;
  status_name: string;
  priority_name: string | null;
  created_at: string;
};

// SlaFields = assigned_at, acknowledged_at (when it was set to in progress), resolved_at,
// ack_due_at, resolve_due_at (set once at first assignment), ack_days, resolve_days
export type DepartmentComplaintDetails = SlaFields & {
  id: string;
  tracking_id: string;
  title: string;
  description: string;
  status_id: number;
  status_name: string;
  category_name: string;
  department_name: string | null;
  priority_name: string | null;
  created_at: string;               // ISO timestamp, UTC

  attachments: {
    id: number;
    file_name: string | null;
    file_type: string;
    file_size: number | null;       // bytes
  }[];

  progress: {
    entry_kind: "submitted" | "status";
    entry_status_id: number | null;
    entry_message: string | null;   // only set for a rejection reason
    entry_at: string;
  }[];

  updates: {
    entry_kind: "update";
    entry_status_id: null;
    entry_message: string;          // the department's message
    entry_at: string;
  }[];
};

/* ---------------- needs attention ---------------- */

export type NeedsAttentionRow = {
  id: string;
  tracking_id: string;
  title: string;
  category_name: string;
  status_id: number;
  status_name: string;
  priority_id: number | null;
  priority_name: string | null;
  created_at: string;
  assigned_at: string | null;
  resolved_at: string | null;      // always null here; kept so slaLabel accepts the row
  ack_due_at: string | null;
  resolve_due_at: string | null;
  ack_days: number | null;
  resolve_days: number | null;
  is_overdue: boolean;
};

/* ---------------- dashboard stats ---------------- */

export type DepartmentStatsType = {
  kpis: {
    total: number;
    resolved: number;
    overdue: number;
    needs_attention: number;
    resolve_time_count: number;
    resolve_time_total_days: number;
  };
  by_priority: { id: number; name: string; count: number }[];
  monthly: { month_start: string; received: number; resolved: number }[];
};

// payload of getNeedsAttention
export type NeedsAttentionData = {
  rows: NeedsAttentionRow[];
  total: number;        // "Showing 1-5 of 5"
  overdueCount: number; // "1 overdue"
  waitingCount: number; // "4 waiting to be acknowledged"
  badge: number;        // the number next to the title
  page: number;
  totalPages: number;
};

// what getDepartmentDashboardStats returns after the server-side math
export type DepartmentDashboardStats = {
  kpis: {
    total: number;
    resolved: number;
    resolve_rate: number;
    overdue: number;
    needs_attention: number;
    avg_time_resolve: number;
  };
  by_priority: DepartmentStatsType["by_priority"];
  monthly: DepartmentStatsType["monthly"];
};