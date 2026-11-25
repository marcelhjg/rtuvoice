"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/features/auth/guards";
import type { ActionResult, ActionState, ComplaintListData } from "@/features/shared/sharedTypes";
import { UUID_RE, cleanSearch, roundTo, toPage, pageParams, totalPagesOf } from "@/features/shared/sharedUtils";
import { runAfterResponse } from "@/features/shared/background";
import {
  DEPARTMENT_LISTS,
  MAX_REASON,
  MAX_UPDATE_MESSAGE,
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
import { sendReturnedToAdminEmails, sendStatusUpdateEmail, sendUpdateMessageEmail } from "@/lib/email/notification";

/* ---------------- helpers (not exported) ---------------- */

// The student who filed a complaint, for notification emails. Runs after the response is sent.
// (If complaints.user_id has a foreign key to users, this can become one embedded select:
//  .select("tracking_id, student:user_id(rtu_email, first_name, last_name)") )
async function loadStudentForEmail(complaintId: string, tag: string) {
  const supabaseAdmin = await createAdminClient();

  const { data: complaint, error: complaintError } = await supabaseAdmin
    .from("complaints")
    .select("tracking_id, user_id")
    .eq("id", complaintId)
    .maybeSingle();

  if (complaintError || !complaint) {
    console.error(`[${tag}] email skipped, complaint lookup failed:`, { complaintId, complaintError });
    return null;
  }

  const { data: student, error: studentError } = await supabaseAdmin
    .from("users")
    .select("rtu_email, first_name, last_name")
    .eq("id", complaint.user_id)
    .maybeSingle();

  if (studentError || !student) {
    console.error(`[${tag}] email skipped, student lookup failed:`, { userId: complaint.user_id, studentError });
    return null;
  }

  return { student, trackingId: complaint.tracking_id as string };
}

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

  // the two email lookups + SMTP happen after the response
  runAfterResponse(async () => {
    const found = await loadStudentForEmail(complaintId, "updateStatus");
    if (!found) return;
    await sendStatusUpdateEmail({ ...found.student, tracking_id: found.trackingId, status: newStatus });
  }, "updateComplaintStatus email");

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
  if (trimmed.length > MAX_UPDATE_MESSAGE) {
    return { success: false, message: `Update message is too long (max ${MAX_UPDATE_MESSAGE} characters).` };
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

  runAfterResponse(async () => {
    const found = await loadStudentForEmail(complaintId, "updateMessage");
    if (!found) return;
    await sendUpdateMessageEmail({ ...found.student, tracking_id: found.trackingId });
  }, "addComplaintUpdate email");

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
  // Re-enabled (it was commented out). If your complaint ids are not UUIDs, remove it again.
  if (!UUID_RE.test(complaintId)) return { success: false, message: "Invalid request." };
  if (!trimmed) return { success: false, message: "Please provide a reason for returning." };
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

  runAfterResponse(async () => {
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
          .eq("role_id", 2)
          .eq("is_active", true), // deactivated admins shouldn't be emailed
      ]);

    if (complaintError || !complaintData || adminsError || !admins?.length) {
      console.error("[returnComplaint] email skipped, lookup failed:", {
        complaintId,
        complaintError,
        adminsError,
        adminCount: admins?.length ?? 0,
      });
      return;
    }

    await sendReturnedToAdminEmails({
      trackingId: complaintData.tracking_id,
      admins,
      reason: trimmed, // the same text that was saved, not the untrimmed input
    });
  }, "returnComplaint email");

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
  if (!cfg) return { success: false, message: "Invalid request." };

  const page = toPage(opts.page);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_complaints_department", {
    p_status_ids: cfg.statusIds ? [...cfg.statusIds] : null,
    p_search: cleanSearch(opts.search),
    p_sort: opts.sort === "oldest" ? "oldest" : "newest",
    p_date_field: cfg.dateField,
    ...pageParams(page),
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
    totalPages: totalPagesOf(total),
  };
}

export async function getComplaintDetailsDepartment(
  trackingId: string
): Promise<ActionResult<{ trackResult: DepartmentComplaintDetails }>> {
  const me = await getCurrentUser();
  if (!me || me.role !== "department") return { success: false, message: "Not allowed." };

  const id = trackingId?.trim() ?? "";
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

  const page = toPage(opts.page);
  const priorityId = Number.isInteger(opts.priorityId) ? (opts.priorityId as number) : null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_needs_attention_department", {
    p_search: cleanSearch(opts.search),
    p_priority_id: priorityId,
    ...pageParams(page),
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
    totalPages: totalPagesOf(total),
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