"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/features/auth/guards";
import { analyzeComplaint, type ComplaintAnalysis } from "@/features/ai/analyzeComplaint";
import type { ActionResult, ActionState, ComplaintListData } from "@/features/shared/sharedTypes";
import { cleanSearch, roundTo, toPage, pageParams, totalPagesOf } from "@/features/shared/sharedUtils";
import { runAfterResponse } from "@/features/shared/background";
import {
  ADMIN_LISTS,
  ASSIGN_ACTIONS,
  MASTER_STATUSES,
  MAX_REJECT_REASON,
  PRIORITY_ID,
  type AdminComplaintDetails,
  type AdminDashboardStats,
  type AdminListKey,
  type AssignAction,
  type ComplaintRow,
  type MasterQueueFilters,
  type OngoingComplaint,
  type OngoingComplaintState,
  type PendingComplaint,
  type PendingComplaintState,
  type PendingQueueFilters,
  type StatsType,
} from "@/features/admin/adminTypes";
import { sendAssignmentEmail, sendReassignmentEmails } from "@/lib/email/notification";

/* ---------------- validation + master tracking queues ---------------- */

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

/* ---------------- assign / reject ---------------- */

const DEPT_ACCOUNT_COLUMNS = "rtu_email, first_name, last_name";

export async function assignComplaint(formData: FormData): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") return { success: false, message: "Not allowed." };

  const complaintId = String(formData.get("complaint_id") ?? "");
  const departmentId = Number(formData.get("department_id"));
  const reason = String(formData.get("reason") ?? "").trim() || null;
  const action = String(formData.get("action") ?? "");

  if (!complaintId || !Number.isInteger(departmentId) || departmentId <= 0) {
    return { success: false, message: "Invalid request." };
  }
  if (!(ASSIGN_ACTIONS as readonly string[]).includes(action)) {
    return { success: false, message: "Invalid action." };
  }
  const assignAction = action as AssignAction;

  const supabase = await createClient();
  const supabaseAdmin = await createAdminClient();

  // The complaint and the target department's account don't depend on each other: fetch them together.
  // (tracking_id never changes, so it comes along here instead of a second lookup after the RPC.)
  const [complaintRes, deptRes] = await Promise.all([
    supabase
      .from("complaints")
      .select("tracking_id, title, description, is_public, priority_id, department_id")
      .eq("id", complaintId)
      .maybeSingle(),
    supabaseAdmin
      .from("users")
      .select(DEPT_ACCOUNT_COLUMNS)
      .eq("department_id", departmentId)
      .eq("role_id", 3)
      .eq("is_active", true)
      .maybeSingle(),
  ]);

  const { data: complaint, error: fetchError } = complaintRes;
  if (fetchError) {
    console.error("[complaints] fetch failed:", fetchError);
    return { success: false, message: "Couldn't fetch the complaint. Please try again." };
  }
  if (!complaint) return { success: false, message: "Complaint not found." };

  // verify the target department has an active account BEFORE spending an AI call
  const { data: dept, error: deptError } = deptRes;
  if (deptError) {
    console.error("[assignComplaint] department lookup failed:", deptError);
    return { success: false, message: "Couldn't verify the department. Please try again." };
  }
  if (!dept) {
    return {
      success: false,
      message: "This department has no active account. Activate one before assigning.",
    };
  }

  // capture the current department BEFORE the rpc overwrites it
  const previousDepartmentId = complaint.department_id;

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
      message:
        error.code === "P0001"
          ? error.message
          : "Couldn't assign to a department. Please try again.",
    };
  }

  // Emails go out after the response, so the admin doesn't wait on the previous-department lookup or SMTP.
  const trackingId: string | null = complaint.tracking_id ?? null;
  if (!trackingId) {
    console.error("[assignComplaint] email skipped, no tracking id:", { complaintId });
  } else {
    runAfterResponse(async () => {
      if (assignAction === "assign") {
        await sendAssignmentEmail({ ...dept, tracking_id: trackingId });
        return;
      }

      const { data: previousDept } = previousDepartmentId != null
        ? await supabaseAdmin
            .from("users")
            .select(DEPT_ACCOUNT_COLUMNS)
            .eq("department_id", previousDepartmentId)
            .eq("role_id", 3)
            .eq("is_active", true)
            .maybeSingle()
        : { data: null };

      if (previousDept) {
        await sendReassignmentEmails({ trackingId, previousDept, newDept: dept });
      } else {
        // no previous department found: still notify the new one
        console.error("[assignComplaint] previous department not found, sending assignment email only");
        await sendAssignmentEmail({ ...dept, tracking_id: trackingId });
      }
    }, "assignComplaint emails");
  }

  // revalidatePath("/admin", "layout");
  return { success: true, message: "Complaint assigned." };
}

export async function rejectComplaint(formData: FormData): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") return { success: false, message: "Not allowed." };

  const complaintId = String(formData.get("complaint_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!complaintId) return { success: false, message: "Invalid request." };
  if (!reason) return { success: false, message: "A reason is required to reject." };
  if (reason.length > MAX_REJECT_REASON) {
    return { success: false, message: `Reason is too long (max ${MAX_REJECT_REASON} characters).` };
  }

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

  // revalidatePath("/admin", "layout");
  return { success: true, message: "Complaint rejected." };
}

/* ---------------- complaint lists + details ---------------- */

export async function getComplaintsAdmin(
  list: AdminListKey,
  opts: { departmentId?: number; search?: string; sort?: "newest" | "oldest"; page?: number } = {}
): Promise<ActionResult<ComplaintListData<ComplaintRow>>> {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") return { success: false, message: "Not allowed." };

  const cfg = ADMIN_LISTS[list];
  if (!cfg) return { success: false, message: "Invalid request." };

  const page = toPage(opts.page);
  const departmentId = Number.isInteger(opts.departmentId) ? (opts.departmentId as number) : null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_complaints_admin", {
    p_status_ids: cfg.statusIds ? [...cfg.statusIds] : null,
    p_department_id: departmentId,
    p_search: cleanSearch(opts.search),
    p_sort: opts.sort === "oldest" ? "oldest" : "newest",
    p_date_field: cfg.dateField,
    ...pageParams(page),
  });

  if (error) {
    console.error("[get_complaints_admin] rpc failed:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }

  const { total, status_total, rows } = data as { total: number; status_total: number; rows: ComplaintRow[] };
  return {
    success: true,
    rows,
    total,
    statusTotal: status_total,
    page,
    totalPages: totalPagesOf(total),
  };
}

export async function getComplaintDetails(
  trackingId: string
): Promise<ActionResult<{ trackResult: AdminComplaintDetails }>> {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") return { success: false, message: "Not allowed." };

  const id = trackingId?.trim() ?? "";
  if (!id) return { success: false, message: "Invalid request." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_complaint_details_admin", { p_tracking_id: id });

  if (error) {
    console.error("[get_complaint_details_admin] rpc failed:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
  if (!data) return { success: false, message: "Complaint not found." };

  return { success: true, message: "", trackResult: data as AdminComplaintDetails };
}

/* ---------------- dashboard stats ---------------- */

export async function getAdminDashboardStats(
  department_id?: number
): Promise<ActionResult<{ stats: AdminDashboardStats }>> {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") {
    return { success: false, message: "Not allowed." };
  }

  const supabase = await createClient(); // must use the user's session

  const { data, error } = await supabase.rpc("get_admin_dashboard_stats", {
    p_department_id: department_id ?? null,
  });

  if (error || !data) {
    console.error("[get_admin_dashboard_stats] rpc failed:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }

  const { kpis, by_category, by_department, monthly, by_priority } = data as StatsType;

  const resolve_rate = kpis.approved > 0 ? roundTo((kpis.resolved / kpis.approved) * 100) : 0;
  const avg_time_resolve =
    kpis.resolve_time_count > 0
      ? roundTo(kpis.resolve_time_total_days / kpis.resolve_time_count, 1)
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
  };
}