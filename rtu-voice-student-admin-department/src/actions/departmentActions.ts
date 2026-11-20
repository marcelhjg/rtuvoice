"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/guards";
import type { ActionResult, ActionState, ComplaintListData } from "@/features/shared/sharedTypes";
import { PAGE_SIZE, UUID_RE, roundTo } from "@/features/shared/sharedUtils";
import {
  DEPARTMENT_LISTS,
  MAX_REASON,
  NEXT_STATUSES,
  type DepartmentComplaintDetails,
  type DepartmentComplaintRow,
  type DepartmentDashboardStats,
  type DepartmentListKey,
  type DepartmentStatsType,
  type NeedsAttentionData,
  type NeedsAttentionRow,
  type NextStatus,
} from "@/features/department/departmentTypes";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReturnedToAdminEmails, sendStatusUpdateEmail, sendUpdateMessageEmail } from "@/lib/email/notification";

/* ---------------- status + updates + return ---------------- */

export async function updateComplaintStatus(
  complaintId: string,
  newStatus: NextStatus
): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me || me.role !== "department") return { success: false, message: "Not allowed." };

  if (!UUID_RE.test(complaintId) || !NEXT_STATUSES.includes(newStatus)) {
    return { success: false, message: "Invalid request." };
  }

  const supabase = await createClient(); // user's session, not service-role

  const { error } = await supabase.rpc("update_complaint_status", {
    p_complaint_id: complaintId,
    p_new_status: newStatus,
  });

  if (error) {
    console.error("[updateComplaintStatus] rpc failed:", error);
    if (error.code === "42501") return { success: false, message: "Not allowed." };
    if (error.code === "P0001") {
      return {
        success: false,
        message: "This complaint can't be moved to that status. It may have already been updated.",
      };
    }
    return { success: false, message: "Something went wrong. Please try again." };
  }

  const supabaseAdmin = await createAdminClient();

  const { data: complaint, error: complaintError } = await supabaseAdmin
    .from("complaints")
    .select("tracking_id, user_id")
    .eq("id", complaintId)
    .maybeSingle();

  if (complaintError || !complaint) {
    console.error("[updateStatus] email skipped, complaint lookup failed:", { complaintId, complaintError });
  } else {
    const { data: student, error: studentError } = await supabaseAdmin
      .from("users")
      .select("rtu_email, first_name, last_name")
      .eq("id", complaint.user_id)
      .maybeSingle();

    if (studentError || !student) {
      console.error("[updateStatus] email skipped, student lookup failed:", { userId: complaint.user_id, studentError });
    } else {
      await sendStatusUpdateEmail({
        ...student,
        tracking_id: complaint.tracking_id,
        status: newStatus,
      });
    }
  }

  // revalidatePath("/department/complaints"); // <- your route, if using Next.js caching
  return {
    success: true,
    message: newStatus === "in_progress" ? "Complaint marked as in progress." : "Complaint marked as resolved.",
  };
}

export async function addComplaintUpdate(
  complaintId: string,
  message: string
): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me || me.role !== "department") return { success: false, message: "Not allowed." };

  const trimmed = message?.trim() ?? "";
  if (!UUID_RE.test(complaintId)) return { success: false, message: "Invalid request." };
  if (!trimmed) return { success: false, message: "Please enter an update message." };
  if (trimmed.length > 2000) {
    return { success: false, message: "Update message is too long (max 2000 characters)." };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("add_complaint_update", {
    p_complaint_id: complaintId,
    p_message: trimmed,
  });

  if (error) {
    console.error("[addComplaintUpdate] rpc failed:", error);
    if (error.code === "42501") return { success: false, message: "Not allowed." };
    if (error.code === "P0001") {
      return { success: false, message: "You can't add an update to this complaint." };
    }
    return { success: false, message: "Something went wrong. Please try again." };
  }

  const supabaseAdmin = await createAdminClient();

  const { data: complaintData, error: complaintError } = await supabaseAdmin
    .from("complaints")
    .select("user_id, tracking_id")
    .eq("id", complaintId)
    .maybeSingle();

  if (complaintError || !complaintData) {
    console.error("[updateMessage] email skipped, complaint lookup failed:", { complaintId, complaintError });
  } else {
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("rtu_email, first_name, last_name")
      .eq("id", complaintData.user_id)
      .maybeSingle();

    if (userError || !userData) {
      console.error("[updateMessage] email skipped, student lookup failed:", { userId: complaintData.user_id, userError });
    } else {
      await sendUpdateMessageEmail({ ...userData, tracking_id: complaintData.tracking_id });
    }
  }
  return { success: true, message: "Update added." };
}

// the department "rejects" a complaint = returns it to the admin validation queue
export async function returnComplaint(
  complaintId: string,
  reason: string
): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!me || me.role !== "department") return { success: false, message: "Not allowed." };

  const trimmed = reason?.trim() ?? "";
  if (!UUID_RE.test(complaintId)) return { success: false, message: "Invalid request." };
  if (!trimmed) return { success: false, message: "Please provide a reason for rejecting." };
  if (trimmed.length > MAX_REASON) {
    return { success: false, message: `Reason is too long (max ${MAX_REASON} characters).` };
  }

  const supabase = await createClient(); // user's session, not service-role

  const { error } = await supabase.rpc("return_complaint", {
    p_complaint_id: complaintId,
    p_reason: trimmed,
  });

  if (error) {
    console.error("[returnComplaint] rpc failed:", error);
    if (error.code === "42501") return { success: false, message: "Not allowed." };
    if (error.code === "P0001") {
      return {
        success: false,
        message:
          "This complaint can't be rejected. It may no longer be in your department or may already be in progress.",
      };
    }
    return { success: false, message: "Something went wrong. Please try again." };
  }

  const supabaseAdmin = await createAdminClient();

  const [{ data: complaintData, error: complaintError }, { data: admins, error: adminsError }] =
    await Promise.all([
      supabaseAdmin
        .from("complaints")
        .select("tracking_id")
        .eq("id", complaintId)
        .maybeSingle(),
      supabaseAdmin
        .from("users")
        .select("rtu_email, first_name, last_name")
        .eq("role_id", 2),
    ]);

  if (complaintError || !complaintData || adminsError || !admins?.length) {
    console.error("[returnComplaint] email skipped, lookup failed:", {
      complaintId,
      complaintError,
      adminsError,
      adminCount: admins?.length ?? 0,
    });
  } else {
    await sendReturnedToAdminEmails({
      trackingId: complaintData.tracking_id,
      admins,
      reason, // only if your action has one
    });
  }

  return { success: true, message: "Complaint returned to admin." };
  // revalidatePath("/department/complaints"); // <- your route, if using Next.js caching
}

/* ---------------- complaint lists + details ---------------- */

export async function getComplaintsDepartment(
  list: DepartmentListKey,
  opts: { search?: string; sort?: "newest" | "oldest"; page?: number } = {}
): Promise<ActionResult<ComplaintListData<DepartmentComplaintRow>>> {
  const me = await getCurrentUser();
  if (!me || me.role !== "department") return { success: false, message: "Not allowed." };

  const cfg = DEPARTMENT_LISTS[list];
  const page = Math.max(1, Math.floor(opts.page ?? 1));

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_complaints_department", {
    p_status_ids: cfg.statusIds ? [...cfg.statusIds] : null,
    p_search: opts.search?.trim() || null,
    p_sort: opts.sort === "oldest" ? "oldest" : "newest",
    p_date_field: cfg.dateField,
    p_limit: PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE,
  });

  if (error) {
    console.error("[get_complaints_department] rpc failed:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }

  const { total, status_total, rows } = data as {
    total: number;
    status_total: number;
    rows: DepartmentComplaintRow[];
  };

  return {
    success: true,
    rows,
    total,                       // follows the search: "Showing 1-8 of 13"
    statusTotal: status_total,   // header badge
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getComplaintDetailsDepartment(
  trackingId: string
): Promise<ActionResult<{ trackResult: DepartmentComplaintDetails }>> {
  const me = await getCurrentUser();
  if (!me || me.role !== "department") return { success: false, message: "Not allowed." };

  const id = trackingId.trim();
  if (!id) return { success: false, message: "Invalid request." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_complaint_details_department", {
    p_tracking_id: id,
  });

  if (error) {
    console.error("[get_complaint_details_department] rpc failed:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }
  if (!data) return { success: false, message: "Complaint not found." };

  return { success: true, message: "", trackResult: data as DepartmentComplaintDetails };
}

/* ---------------- needs attention ---------------- */

export async function getNeedsAttention(
  opts: { search?: string; priorityId?: number; page?: number } = {}
): Promise<ActionResult<NeedsAttentionData>> {
  const me = await getCurrentUser();
  if (!me || me.role !== "department") return { success: false, message: "Not allowed." };

  const page = Math.max(1, Math.floor(opts.page ?? 1));
  const priorityId =
    opts.priorityId !== undefined && Number.isInteger(opts.priorityId) ? opts.priorityId : null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_needs_attention_department", {
    p_search: opts.search?.trim() || null,
    p_priority_id: priorityId,
    p_limit: PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE,
  });

  if (error) {
    console.error("[get_needs_attention_department] rpc failed:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }

  const { total, overdue_count, waiting_count, rows } = data as {
    total: number;
    overdue_count: number;
    waiting_count: number;
    rows: NeedsAttentionRow[];
  };

  return {
    success: true,
    rows,
    total,                                  // "Showing 1-5 of 5"
    overdueCount: overdue_count,            // "1 overdue"
    waitingCount: waiting_count,            // "4 waiting to be acknowledged"
    badge: overdue_count + waiting_count,   // the number next to the title
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

/* ---------------- dashboard stats ---------------- */

export async function getDepartmentDashboardStats(): Promise<
  ActionResult<{ stats: DepartmentDashboardStats }>
> {
  const me = await getCurrentUser();
  if (!me || me.role !== "department") {
    return { success: false, message: "Not allowed." };
  }

  const supabase = await createClient(); // user's session, not service-role

  const { data, error } = await supabase.rpc("get_department_dashboard_stats");

  if (error || !data) {
    console.error("[get_department_dashboard_stats] rpc failed:", error);
    return { success: false, message: "Something went wrong. Please try again." };
  }

  const { kpis, by_priority, monthly } = data as DepartmentStatsType;

  const resolve_rate = kpis.total > 0 ? roundTo((kpis.resolved / kpis.total) * 100) : 0;
  const avg_time_resolve =
    kpis.resolve_time_count > 0
      ? roundTo(kpis.resolve_time_total_days / kpis.resolve_time_count, 1)
      : 0;

  return {
    success: true,
    message: "",
    stats: {
      kpis: {
        total: kpis.total,                     // "13 assigned to your department"
        resolved: kpis.resolved,               // "5 of 13 complaints"
        resolve_rate,                          // 38%
        overdue: kpis.overdue,                 // 1
        needs_attention: kpis.needs_attention, // "5 need attention in total"
        avg_time_resolve,                      // 7.6d
      },
      by_priority,
      monthly,                                 // chronological, 6 entries
    },
  };
}