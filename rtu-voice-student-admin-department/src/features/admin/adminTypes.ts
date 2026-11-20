// Admin-only types and constants.
// No "use server" here: a "use server" file may only export async functions.

import type { SlaFields } from "@/features/shared/sharedTypes";

/* ---------------- constants ---------------- */

export const MASTER_STATUSES = ["assigned", "in_progress", "resolved"] as const;

export const PRIORITY_ID = { high: 1, mid: 2, low: 3 } as const; // confirm against priority_levels

// status ids: 1 pending, 2 assigned, 3 in_progress, 4 resolved, 5 rejected
export const ADMIN_LISTS = {
  total:       { statusIds: undefined, dateField: "created"  },
  assigned:    { statusIds: [2],       dateField: "assigned" },
  in_progress: { statusIds: [3],       dateField: "assigned" },
  resolved:    { statusIds: [4],       dateField: "resolved" },
} as const;

export type AdminListKey = keyof typeof ADMIN_LISTS;

/* ---------------- validation + master tracking queues ---------------- */

export type PendingComplaint = {
  id: string;
  created_at: string;
  tracking_id: string;
  title: string;
  category: string | null;
  is_returned: boolean;
  returned_at: string | null;
  returned_by_department_id: number | null;
  returned_by_department: string | null;
  return_reason: string | null;
};

export type PendingComplaintState = {
  success: boolean;
  message: string;
  pending_complaints?: PendingComplaint[];
};

export type OngoingComplaint = {
  id: string;
  created_at: string;
  tracking_id: string;
  title: string;
  priority: string | null;
  status: string;
  department_id: number;
  department: string | null;
  can_reassign: boolean;
  returned_department_ids: number[];
  first_assigned_at: string | null;
  resolved_at: string | null;
  acknowledge_days: number | null;
  resolve_days: number | null;
};

export type OngoingComplaintState = {
  success: boolean;
  message: string;
  ongoing_complaints?: OngoingComplaint[];
};

export type PendingQueueFilters = {
  search?: string;
  sort?: "newest" | "oldest";
};

export type MasterQueueFilters = {
  search?: string;
  status?: (typeof MASTER_STATUSES)[number];
  department_id?: number;
};

/* ---------------- complaint lists + details ---------------- */

export type ComplaintRow = SlaFields & {
  tracking_id: string;
  title: string;
  category_name: string;
  department_name: string | null;
  department_acronym: string | null;
  status_id: number;
  status_name: string;
  priority_name: string | null;
  created_at: string;
};

export type ReturnInfo = {
  department_id: number;
  department_name: string | null;
  reason: string | null;
  returned_at: string;
};

export type AdminComplaintDetails = SlaFields & {
  id: string;
  tracking_id: string;
  title: string;
  description: string;
  status_id: number;
  status_name: string;
  category_name: string;
  priority_name: string | null;
  department_id: number | null;
  department_name: string | null;
  created_at: string;
  updated_at: string;
  attachments: { id: number; file_name: string | null; file_type: string; file_size: number | null }[];
  progress: { entry_kind: "submitted" | "status"; entry_status_id: number | null; entry_message: string | null; entry_at: string }[];
  updates: { entry_kind: "update"; entry_status_id: null; entry_message: string; entry_at: string }[];
  current_return: ReturnInfo | null;
  returns: ReturnInfo[];
};

/* ---------------- dashboard stats ---------------- */

export type StatsType = {
  kpis: {
    total: number;
    approved: number;
    resolved: number;
    overdue: number;
    resolve_time_count: number;
    resolve_time_total_days: number;
  };
  by_category: { id: number; name: string; count: number }[];
  by_department: { id: number; name: string; acronym: string; count: number }[];
  monthly: { month_start: string; submitted: number; resolved: number }[];
  by_priority: { id: number; name: string; count: number }[];
};

// what getAdminDashboardStats returns after the server-side math
export type AdminDashboardStats = {
  kpis: {
    total: number;
    approved: number;
    resolved: number;
    resolve_rate: number;
    overdue: number;
    avg_time_resolve: number;
  };
  by_category: StatsType["by_category"];
  by_department: StatsType["by_department"];
  monthly: StatsType["monthly"];
  by_priority: StatsType["by_priority"];
};