"use server";

import { getCurrentUser } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { str } from "@/features/shared/sharedUtils";
import type {
    SubmitComplaintState,
    TrackComplaintState,
    TrackedComplaint,
    HistoryState,
    HistoryRow,
    PublicRow,
    PublicComplaintsState,
    Category,
    PublicStatus,
    RecentResolvedRow
} from "@/features/student/studentTypes";
import {
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

    // upload first (in parallel), so the RPC only receives paths + metadata
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

// shared by trackComplaint and getComplaintDetails
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

    // No complaints yet is a valid result, not an error. (Before, the `!data` branch never fired for
    // an empty array because [] is truthy, so the UI only ever saw this case as success anyway.)
    return { success: true, message: "", historyData: (data ?? []) as HistoryRow[] };
}

export async function getComplaintDetails(trackingId: string): Promise<TrackComplaintState> {
    const me = await getCurrentUser();
    if (!me || me.role !== "student") return { success: false, message: "Not allowed." };

    const id = trackingId?.trim() ?? "";
    if (!id) return { success: false, message: "Invalid request." };

    return fetchTrackedComplaint(id);
}

/* ---------------- Public Dashboard ---------------- */

const STATUS_IDS: Record<string, number> = { Assigned: 2, "In Progress": 3, Resolved: 4 };
const STATUS_NAMES: Record<number, string> = { 2: "Assigned", 3: "In Progress", 4: "Resolved" };

// The categories table is tiny and static, so look it up once and reuse it instead of
// querying it on every page / filter change. It isn't user-specific, so sharing it across
// requests is safe. (A module-level variable in a "use server" file is fine; only exports matter.)
type CategoryMaps = { byName: Map<string, number>; byId: Map<number, string> };
const CATEGORY_TTL_MS = 10 * 60 * 1000;
let categoryCache: { maps: CategoryMaps; expiresAt: number } | null = null;
let categoryInflight: Promise<CategoryMaps | null> | null = null;

async function getCategoryMaps(): Promise<CategoryMaps | null> {
    if (categoryCache && categoryCache.expiresAt > Date.now()) return categoryCache.maps;

    // concurrent requests share one fetch
    categoryInflight ??= (async () => {
        try {
            const supabase = await createClient();
            const { data, error } = await supabase.from("categories").select("id, category");
            if (error || !data) {
                console.error("[getCategoryMaps] failed:", error);
                return null;
            }
            const rows = data as { id: number; category: string }[];
            const maps: CategoryMaps = {
                byName: new Map(rows.map((c): [string, number] => [c.category, c.id])),
                byId: new Map(rows.map((c): [number, string] => [c.id, c.category])),
            };
            categoryCache = { maps, expiresAt: Date.now() + CATEGORY_TTL_MS };
            return maps;
        } finally {
            categoryInflight = null;
        }
    })();

    return categoryInflight;
}

export async function getPublicComplaints(
    offset: number,
    status: string,
    category: string
): Promise<PublicComplaintsState> {
    const me = await getCurrentUser();
    if (!me || me.role !== "student") return { success: false, message: "Not allowed." };

    const safeOffset = Number.isFinite(offset) ? Math.max(0, Math.floor(offset)) : 0;

    const cats = await getCategoryMaps();
    if (!cats) return { success: false, message: "Could not load complaints." };

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_public_complaints", {
        p_offset: safeOffset,
        p_status: STATUS_IDS[status] ?? null,
        p_category: cats.byName.get(category) ?? null,
    });
    if (error) {
        console.error("[getPublicComplaints] rpc failed:", error);
        return { success: false, message: "Could not load complaints." };
    }

    const rows = (data ?? []) as PublicRow[];
    return {
        success: true,
        message: "",
        total: Number(rows[0]?.total_count ?? 0),
        rows: rows.map((r) => ({
            id: r.id,
            title: r.ai_title,
            summary: r.ai_summary,
            category: cats.byId.get(r.category_id) as Category,
            status: STATUS_NAMES[r.status_id] as PublicStatus,
            date: r.created_at,
        })),
    };
}

export async function getRecentResolvedPublic(): Promise<{ success: boolean; message: string; data?: RecentResolvedRow[] }> {
    const me = await getCurrentUser();
    if (!me || me.role !== "student") return { success: false, message: "Not allowed." };

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_recent_resolved_public");

    if (error) {
        console.error("[getRecentResolvedPublic] rpc failed:", error);
        return { success: false, message: "Couldn't load recent resolved complaints. Please try again." };
    }

    return { success: true, message: "", data: (data ?? []) as RecentResolvedRow[] };
}