"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/features/auth/guards";
import { analyzeComplaint, type ComplaintAnalysis } from "@/features/ai/analyzeComplaint";
import { revalidatePath } from "next/cache";

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
  status?: "assigned" | "in_progress" | "resolved";
  department_id?: number;
};

const MASTER_STATUSES = ["assigned", "in_progress", "resolved"] as const;

// trim, cap length, and turn "" into null
const cleanSearch = (s?: string) => {
  const v = s?.trim().slice(0, 50);
  return v ? v : null;
};

export async function getPendingComplaints(
  filters: PendingQueueFilters = {}
): Promise<PendingComplaintState> {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") return { success: false, message: "Not allowed." };

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_pending_validation_queue", {
    p_search: cleanSearch(filters.search),
    p_sort: filters.sort === "oldest" ? "oldest" : "newest",
  });

  if (error) {
    console.error("[getPendingComplaints] rpc failed:", error);
    return { success: false, message: "Couldn't load pending complaints. Please try again." };
  }

  // an empty list is a valid result (especially while searching), not an error
  return { success: true, message: "", pending_complaints: (data ?? []) as PendingComplaint[] };
}

export async function getMasterTrackingQueue(
  filters: MasterQueueFilters = {}
): Promise<OngoingComplaintState> {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") return { success: false, message: "Not allowed." };

  const supabase = await createClient();

  const status = MASTER_STATUSES.find((s) => s === filters.status) ?? null;

  const { data, error } = await supabase.rpc("get_master_tracking_queue", {
    p_search: cleanSearch(filters.search),
    p_status: status,
    p_department_id: filters.department_id ?? null,
  });

  if (error) {
    console.error("[getMasterTrackingQueue] rpc failed:", error);
    return { success: false, message: "Couldn't load ongoing complaints. Please try again." };
  }

  return { success: true, message: "", ongoing_complaints: (data ?? []) as OngoingComplaint[] };
}

const PRIORITY_ID = { low: 1, mid: 2, high: 3 } as const; // confirm against priority_levels

export async function assign_complaint(formData: FormData) {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") return { success: false, message: "Not allowed." };

  const complaintId = String(formData.get("complaint_id") ?? "");
  const departmentId = Number(formData.get("department_id"));
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!complaintId || !Number.isInteger(departmentId)) {
    return { success: false, message: "Invalid request." };
  }

  const supabase = await createClient();

  const { data: complaint, error: fetchError } = await supabase
    .from("complaints")
    .select("title, description, is_public, priority_id")
    .eq("id", complaintId)
    .maybeSingle();

  if (fetchError) {
    console.error("[complaints] fetch failed:", fetchError);
    return { success: false, message: "Couldn't fetch the complaint. Please try again." };
  }
  if (!complaint) return { success: false, message: "Complaint not found." };

  // AI runs only the first time (no priority saved yet)
  let ai: ComplaintAnalysis | null = null;
  if (complaint.priority_id == null) {
    ai = await analyzeComplaint({
      title: complaint.title,
      description: complaint.description,
      is_public: complaint.is_public,
    });
    if (!ai) return { success: false, message: "AI analysis failed. Please try again." };
  }

  const { error } = await supabase.rpc("assign_complaint", {
    p_complaint_id: complaintId,
    p_department_id: departmentId,
    p_reason: reason,
    p_ai_title: ai?.ai_title ?? null,
    p_ai_summary: ai?.ai_summary ?? null,
    p_priority_id: ai ? PRIORITY_ID[ai.priority] : null,
  });

  if (error) {
    console.error("[assign_complaint] rpc failed:", error);
    return {
      success: false,
      // P0001 = the messages you wrote with `raise exception`; anything else stays generic
      message:
        error.code === "P0001"
          ? error.message
          : "Couldn't assign to a department. Please try again.",
    };
  }

//   revalidatePath("/admin", "layout");
  return { success: true, message: "Complaint assigned." };
}

export async function reject_complaint(formData: FormData) {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") return { success: false, message: "Not allowed." };

  const complaintId = String(formData.get("complaint_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!complaintId) return { success: false, message: "Invalid request." };
  if (!reason) return { success: false, message: "A reason is required to reject." };
  if (reason.length > 500) return { success: false, message: "Reason is too long (max 500 characters)." };

  const supabase = await createClient();

  const { error } = await supabase.rpc("reject_complaint", {
    p_complaint_id: complaintId,
    p_reason: reason,
  });

  if (error) {
    console.error("[reject_complaint] rpc failed:", error);
    return {
      success: false,
      message:
        error.code === "P0001"
          ? error.message
          : "Something went wrong. Please try again.",
    };
  }

//   revalidatePath("/admin", "layout");
  return { success: true, message: "Complaint rejected." };
}

const PAGE_SIZE = 8;

type SlaFields = {
  assigned_at: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  ack_due_at: string | null;
  resolve_due_at: string | null;   // set once at first assignment
  ack_days: number | null;
  resolve_days: number | null;
};

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

type ReturnInfo = {
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

// status ids: 1 pending, 2 assigned, 3 in_progress, 4 resolved, 5 rejected
export const ADMIN_LISTS = {
  total:       { statusIds: undefined, dateField: "created"  },
  assigned:    { statusIds: [2],       dateField: "assigned" },
  in_progress: { statusIds: [3],       dateField: "assigned" },
  resolved:    { statusIds: [4],       dateField: "resolved" },
} as const;

export async function getComplaintsAdmin(
  list: keyof typeof ADMIN_LISTS,
  opts: { departmentId?: number; search?: string; sort?: "newest" | "oldest"; page?: number } = {}
) {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") return { success: false as const, message: "Not allowed." };

  const cfg = ADMIN_LISTS[list];
  const page = Math.max(1, Math.floor(opts.page ?? 1));
  const departmentId =
    opts.departmentId !== undefined && Number.isInteger(opts.departmentId) ? opts.departmentId : null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_complaints_admin", {
    p_status_ids: cfg.statusIds ? [...cfg.statusIds] : null,
    p_department_id: departmentId,
    p_search: opts.search?.trim() || null,
    p_sort: opts.sort === "oldest" ? "oldest" : "newest",
    p_date_field: cfg.dateField,
    p_limit: PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE,
  });

  if (error) {
    console.error("[get_complaints_admin] rpc failed:", error);
    return { success: false as const, message: "Something went wrong. Please try again." };
  }

  const { total, status_total, rows } = data as { total: number; status_total: number; rows: ComplaintRow[] };
  return {
    success: true as const,
    rows,
    total,
    statusTotal: status_total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getComplaintDetails(trackingId: string) {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") return { success: false as const, message: "Not allowed." };

  const id = trackingId.trim();
  if (!id) return { success: false as const, message: "Invalid request." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_complaint_details_admin", { p_tracking_id: id });

  if (error) {
    console.error("[get_complaint_details_admin] rpc failed:", error);
    return { success: false as const, message: "Something went wrong. Please try again." };
  }
  if (!data) return { success: false as const, message: "Complaint not found." };

  return { success: true as const, message: "", trackResult: data as AdminComplaintDetails };
}


/* ---------------- evidence files ---------------- */

export type EvidenceUrlState = {
    success: boolean;
    message: string;
    url?: string;
};

// one row returned by get_attachment_for_download
export type EvidenceFileRow = {
    out_path: string;
    out_filename: string | null;
};

export const EVIDENCE_BUCKET = "complaint-evidence"; // your PRIVATE bucket
export const URL_LIFETIME_SECONDS = 60;

export async function getEvidenceUrl(
    attachmentId: number,
    download: boolean = false
): Promise<EvidenceUrlState> {
    const me = await getCurrentUser();
    if (!me) return { success: false, message: "Not allowed." };

    if (!Number.isInteger(attachmentId) || attachmentId <= 0) {
        return { success: false, message: "File not found." };
    }

    // permission check: the function returns a row only if this user may see the file
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_attachment_for_download", {
        p_attachment_id: attachmentId,
    });

    const file = (Array.isArray(data) ? data[0] : data) as EvidenceFileRow | null | undefined;
    if (error || !file) {
        return { success: false, message: "File not found." };
    }

    // signed URL (admin client, because the bucket is private and has no student policies)
    const admin = await createAdminClient();
    const { data: signed, error: signError } = await admin.storage
        .from(EVIDENCE_BUCKET)
        .createSignedUrl(
            file.out_path,
            URL_LIFETIME_SECONDS,
            download ? { download: file.out_filename ?? true } : undefined // download = save with the original name
        );

    if (signError || !signed) {
        console.error("[getEvidenceUrl] sign failed:", signError);
        return { success: false, message: "Couldn't open the file. Please try again." };
    }

    return { success: true, message: "", url: signed.signedUrl };
}

export type StatsType = {
  kpis: {
    total: number,
    approved: number,
    resolved: number,
    overdue: number,
    resolve_time_count: number,
    resolve_time_total_days: number,
  },
  by_category: {
    id: number,
    name: string,
    count: number,
  }[],
  by_department: {
    id: number,
    name: string,
    acronym: string,
    count: number,
  }[],
  monthly: {
    month_start: string,
    submitted: number,
    resolved: number,
  }[],
  by_priority: {
    id: number,
    name: string,
    count: number,
  }[]
}

const round = (n: number, digits = 0) => {
  const f = 10 ** digits;
  return Math.round((n + Number.EPSILON) * f) / f;
};

export async function getAdminDashboardStats(department_id?: number) {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") {
    return { success: false, message: "Not allowed." } as const;
  }

  const supabase = await createClient(); // must use the user's session

  const { data, error } = await supabase.rpc("get_admin_dashboard_stats", {
    p_department_id: department_id ?? null,
  });

  if (error || !data) {
    console.error("[get_admin_dashboard_stats] rpc failed:", error);
    return { success: false, message: "Something went wrong. Please try again." } as const;
  }

  const { kpis, by_category, by_department, monthly, by_priority } = data as StatsType;

  const resolve_rate = kpis.approved > 0 ? round((kpis.resolved / kpis.approved) * 100) : 0;
  const avg_time_resolve =
    kpis.resolve_time_count > 0
      ? round(kpis.resolve_time_total_days / kpis.resolve_time_count, 1)
      : 0;

  const byCountDesc = <T extends { count: number }>(rows: T[]) =>
    [...rows].sort((a, b) => b.count - a.count);

  return {
    success: true,
    message: "",
    stats: {
      kpis: {
        total: kpis.total,
        approved: kpis.approved,   
        resolved: kpis.resolved,
        resolve_rate,
        overdue: kpis.overdue,
        avg_time_resolve,
      },
      by_category: byCountDesc(by_category),
      by_department: byCountDesc(by_department),
      monthly,                      
      by_priority,
    },
  } as const;
}

