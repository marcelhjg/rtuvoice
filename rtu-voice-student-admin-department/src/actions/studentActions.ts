"use server";

import { getCurrentUser } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { str } from "@/features/shared/sharedUtils";
import type {
    SubmitComplaintState,
    TrackComplaintState,
    TrackedComplaint,
    EvidenceUrlState,
    EvidenceFileRow,
    HistoryState,
    HistoryRow,
    PublicRow,
    Category,
    PublicStatus
} from "@/features/student/studentTypes";
import {
    EVIDENCE_BUCKET,
    URL_LIFETIME_SECONDS,
    parseComplaintForm,
    validateComplaintInput,
    uploadEvidence,
    removeFiles,
    readTrackingId,
} from "@/features/student/studentUtils";

/* ---------------- submit ---------------- */

export async function submitComplaint(formData: FormData): Promise<SubmitComplaintState> {
    // who is submitting? (from the session, never from the form)
    const me = await getCurrentUser();
    if (!me || me.role !== "student") {
        return { success: false, message: "Not allowed." };
    }

    const input = parseComplaintForm(formData);
    const errors = validateComplaintInput(input);
    if (errors) return { success: false, message: "", errors };

    // upload first, so the RPC only receives paths + metadata
    const admin = await createAdminClient();
    const uploaded = await uploadEvidence(admin, input.evidence);
    if (!uploaded) {
        return { success: false, message: "", errors: { evidence: "Couldn't upload your evidence. Please try again." } };
    }

    // create the complaint through the database function (runs as the student)
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("submit_complaint", {
        p_title: input.title,
        p_description: input.description,
        p_category_id: input.categoryId,
        p_is_public: input.releaseToPublic,
        p_attachments: uploaded, // [{ path, name, type, size }]
    });

    if (error || !data) {
        console.error("[submitComplaint] rpc failed:", error);
        await removeFiles(admin, uploaded.map((u) => u.path)); // don't leave orphaned files
        return { success: false, message: "Couldn't submit your concern. Please try again." };
    }

    const trackingId = readTrackingId(data);
    if (!trackingId) {
        return { success: false, message: "Your concern was saved, but we couldn't read its tracking ID." };
    }

    return { success: true, message: "You successfully submitted your complaint", trackingId };
}

/* ---------------- track ---------------- */

// shared by trackComplaint (and anything else that needs one complaint's details)
async function fetchTrackedComplaint(trackingId: string): Promise<TrackComplaintState> {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("track_complaint", { p_tracking_id: trackingId });

    if (error) {
        console.error("[fetchTrackedComplaint] rpc failed:", error);
        return { success: false, message: "Something went wrong. Please try again." };
    }
    if (!data) return { success: false, message: "Complaint not found." };

    return { success: true, message: "", trackResult: data as unknown as TrackedComplaint };
}

export async function trackComplaint(formData: FormData): Promise<TrackComplaintState> {
    const me = await getCurrentUser();
    if (!me || me.role !== "student") {
        return { success: false, message: "Not allowed." };
    }

    const trackingId = str(formData.get("trackingId")).trim();
    if (!trackingId) {
        return { success: false, message: "", errors: { trackingId: "Please enter a valid tracking id" } };
    }

    return fetchTrackedComplaint(trackingId);
}

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

/* ---------------- history ---------------- */

export async function getHistory(): Promise<HistoryState> {
    const me = await getCurrentUser();
    if (!me || me.role !== "student") return { success: false, message: "Not allowed." };

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_my_complaints");

    if (error) {
        console.error("[getHistory] rpc failed:", error);
        return { success: false, message: "Couldn't load your history. Please try again." };
    }
    if (!data) {
        return { success: false, message: "No complaint submitted yet." };
    }

    return { success: true, message: "", historyData: data as HistoryRow[] };
}

export async function getComplaintDetails(trackingId: string){
    const me = await getCurrentUser();
    if (!me || me.role !== "student") return { success: false, message: "Not allowed." };
    
    return fetchTrackedComplaint(trackingId);
}

/* ---------------- Public Dashboard ---------------- */

const STATUS_IDS: Record<string, number> = { Assigned: 2, "In Progress": 3, Resolved: 4 };
const STATUS_NAMES: Record<number, string> = { 2: "Assigned", 3: "In Progress", 4: "Resolved" };

export async function getPublicComplaints(offset: number, status: string, category: string) {
    const me = await getCurrentUser();
    if (!me || me.role !== "student") return {success: false, message: "Not allowed."};
    
    const supabase = await createClient();

    const { data: catData } = await supabase.from("categories").select("id, name");
    const cats = (catData ?? []) as { id: number; name: string }[];
    const catId = cats.find((c) => c.name === category)?.id ?? null;
    const catNames = new Map<number, string>(cats.map((c): [number, string] => [c.id, c.name]));

    const { data, error } = await supabase.rpc("get_public_complaints", {
        p_offset: offset,
        p_status: STATUS_IDS[status] ?? null,
        p_category: catId,
    });
    if (error) return {success: false, message: "Could not load complaints."};

    const rows = (data ?? []) as PublicRow[];
    return {
        success: true,
        message: "",
        total: Number(rows[0]?.total_count ?? 0),
        rows: rows.map((r) => ({
            id: r.id,
            title: r.ai_title,
            summary: r.ai_summary,
            category: catNames.get(r.category_id) as Category,
            status: STATUS_NAMES[r.status_id] as PublicStatus,
            date: r.created_at,
            })),
    };
}