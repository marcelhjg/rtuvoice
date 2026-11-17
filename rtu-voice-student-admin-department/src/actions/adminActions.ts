"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/features/auth/guards";
import { analyzeComplaint, type ComplaintAnalysis } from "@/features/ai/analyzeComplaint";
import { revalidatePath } from "next/cache";

export type PendingComplaint = {
    id: string
    created_at: string
    tracking_id: string
    title: string
    category: string
    is_returned: boolean
    returned_at: string | null
    returned_by_department_id: number | null
    returned_by_department: string | null
    return_reason: string | null
}

export type PendingComplaintState = {
    success: boolean
    message: string
    pending_complaints?: PendingComplaint[]
}

export type OngoingComplaint = {
    id: string
    created_at: string
    tracking_id: string
    title: string
    priority: string
    status: string
    department_id: number
    can_reassign: boolean
    returned_department_ids: number
    first_assigned_at: string
    resolved_at: string
    acknowledge_days: string       
    resolve_days: string 
}

export type OngoingComplaintState = {
    success: boolean
    message: string
    ongoing_complaints?: OngoingComplaint[]
}

export async function getPendingComplaints(): Promise<PendingComplaintState>{
    const me = await getCurrentUser();
    if (!me || me.role !== 'admin') return {success: false, message: "Not allowed."};

    const supabase = await createClient();

    const {data, error} = await supabase.rpc("get_pending_validation_queue", {}, {count: "exact"});

    if (error) {
        console.error("[getPendingComplaints] rpc failed:", error);
        return { success: false, message: "Couldn't load pending complaints. Please try again." };
    }
    if (!data) {
        return { success: false, message: "No complaint submitted yet." };
    }

    return {success: true, message: "", pending_complaints: [data as PendingComplaint]};
}

export async function getMasterTrackingQueue(): Promise<OngoingComplaintState>{
    const me = await getCurrentUser();
    if (!me || me.role !== 'admin') return {success: false, message: "Not allowed."};

    const supabase = await createClient();
    const {data, error} = await supabase.rpc("get_master_tracking_queue", {}, {count: "exact"});

    if (error) {
        console.error("[get_master_tracking_queue] rpc failed:", error);
        return { success: false, message: "Couldn't load ongoing complaints. Please try again." };
    }
    if (!data) {
        return { success: false, message: "No ongoing complaints yet." };
    }

    return {success: true, message: "", ongoing_complaints: [data as OngoingComplaint]};
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

export type TrackedComplaint = {
    id: string
    tracking_id: string;
    title: string;
    description: string;
    status_id: number;
    status_name: string;
    category_name: string;
    department_name: string | null; // null while pending or rejected
    created_at: string;             // ISO timestamp, UTC
    attachments: {
        id: number;
        file_name: string | null;
        file_type: string;
        file_size: number | null;   // bytes
    }[];
    progress: {
        entry_kind: "submitted" | "status";
        entry_status_id: number | null;
        entry_message: string | null; // only set for a rejection reason
        entry_at: string;
    }[];
    updates: {
        entry_kind: "update";
        entry_status_id: null;
        entry_message: string;        // the department's message
        entry_at: string;
    }[];
};

export async function getComplaintDetails(trackingId: string){
    const me = await getCurrentUser();
    if (!me || me.role !== "admin") return { success: false, message: "Not allowed." };

    const supabase = await createClient();

    const {data, error} = await supabase.rpc("get_complaint_details_admin", {p_tracking_id: trackingId});

    if (error) {
        console.error("[get_complaint_details_admin] rpc failed:", error);
        return { success: false, message: "Something went wrong. Please try again." };
    }
    if (!data) return { success: false, message: "Complaint not found." };

    return { success: true, message: "", trackResult: data as TrackedComplaint };
}


