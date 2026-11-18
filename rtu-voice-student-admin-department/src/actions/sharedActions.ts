"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/features/auth/guards";
import type {
  ComplaintCounts,
  ComplaintCountsState,
  ComplaintUpdate,
  ComplaintUpdatesState,
  EvidenceFileRow,
  EvidenceUrlState,
} from "@/features/shared/sharedTypes";
import { EVIDENCE_BUCKET, URL_LIFETIME_SECONDS, UUID_RE } from "@/features/shared/sharedUtils";

/* ---------------- evidence files ---------------- */

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

/* ---------------- complaint updates (admin + department) ---------------- */

export async function getComplaintUpdates(
  complaintId: string
): Promise<ComplaintUpdatesState> {
  const me = await getCurrentUser();
  if (!me || (me.role !== "admin" && me.role !== "department")) {
    return { success: false, message: "Not allowed." };
  }

  if (!UUID_RE.test(complaintId)) return { success: false, message: "Invalid request." };

  const supabase = await createClient(); // user's session, not service-role

  const { data, error } = await supabase.rpc("get_complaint_updates", {
    p_complaint_id: complaintId,
  });

  if (error) {
    console.error("[getComplaintUpdates] rpc failed:", error);
    if (error.code === "42501") return { success: false, message: "Not allowed." };
    if (error.code === "P0001") return { success: false, message: "Complaint not found." };
    return { success: false, message: "Couldn't load updates. Please try again." };
  }

  // no updates yet is a valid result, not an error
  return { success: true, message: "", updates: (data ?? []) as ComplaintUpdate[] };
}

/* ---------------- summary card counts (admin + department) ---------------- */

export async function getComplaintCounts(): Promise<ComplaintCountsState> {
  const me = await getCurrentUser();
  if (!me || (me.role !== "admin" && me.role !== "department")) {
    return { success: false, message: "Not allowed." };
  }

  const supabase = await createClient(); // user's session, not service-role

  const { data, error } = await supabase.rpc("get_complaint_counts");

  if (error || !data) {
    console.error("[getComplaintCounts] rpc failed:", error);
    return { success: false, message: "Couldn't load complaint counts. Please try again." };
  }

  return { success: true, message: "", counts: data as ComplaintCounts };
}