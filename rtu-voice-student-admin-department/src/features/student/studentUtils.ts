import "server-only"; // uses the admin client: never import this from a "use client" file

import { randomUUID, randomInt } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { str, EVIDENCE_BUCKET } from "@/features/shared/sharedUtils";
import type { SubmitComplaintErrors, UploadedFile } from "@/features/student/studentTypes";
import {
    MAX_FILES,
    TITLE_MAX,
    DESCRIPTION_MAX,
    MAX_TOTAL_BYTES,
    EXTENSIONS,
    isAllowedEvidenceType,
} from "@/features/student/studentTypes";

/* ---------------- constants ---------------- */

// These two used to be defined here AND in sharedUtils. One copy now; re-exported so old imports keep working.
export { EVIDENCE_BUCKET, URL_LIFETIME_SECONDS } from "@/features/shared/sharedUtils";

// no I, O, 0 or 1, since students will read these out and type them
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateTrackingId(length: number = 5): string {
    let id = "";
    for (let i = 0; i < length; i++) {
        id += ALPHABET[randomInt(ALPHABET.length)];
    }
    return `STU-${id}`;
}


/* ---------------- reading + validating the complaint form ---------------- */

export type ComplaintInput = {
    title: string;
    description: string;
    categoryId: number;
    releaseToPublic: boolean;
    evidence: File[];
};

export function parseComplaintForm(formData: FormData): ComplaintInput {
    return {
        title: str(formData.get("title")).trim(),
        description: str(formData.get("description")).trim(),
        categoryId: Number(formData.get("categories")),
        releaseToPublic: formData.get("privacy_setting") === "public",
        evidence: formData
            .getAll("evidence")
            .filter((f): f is File => f instanceof File && f.size > 0),
    };
}

// returns the first problem found, or null when everything is fine
export function validateComplaintInput(input: ComplaintInput): SubmitComplaintErrors | null {
    const { title, description, categoryId, evidence } = input;

    if (!title) return { title: "Please enter a title." };
    if (title.length > TITLE_MAX) return { title: `Title must be ${TITLE_MAX} characters or fewer.` };

    if (!description) return { description: "Please enter a description." };
    if (description.length > DESCRIPTION_MAX) {
        return { description: `Description must be ${DESCRIPTION_MAX} characters or fewer.` };
    }

    if (!Number.isInteger(categoryId) || categoryId <= 0) {
        return { category: "Please choose a category." };
    }

    if (evidence.length > MAX_FILES) return { evidence: `You can attach up to ${MAX_FILES} files.` };

    const totalBytes = evidence.reduce((sum, f) => sum + f.size, 0);
    if (totalBytes > MAX_TOTAL_BYTES) return { evidence: "Evidence must be 5 MB or less in total." };

    // file.type comes from the browser; check file signatures too if you need stricter rules
    if (evidence.some((f) => !isAllowedEvidenceType(f.type))) {
        return { evidence: "One of the files has an unsupported type." };
    }

    return null;
}

/* ---------------- storage ---------------- */

type AdminClient = Awaited<ReturnType<typeof createAdminClient>>;

export async function removeFiles(admin: AdminClient, paths: string[]) {
    if (paths.length === 0) return;
    const { error } = await admin.storage.from(EVIDENCE_BUCKET).remove(paths);
    if (error) console.error("[removeFiles] cleanup failed:", error);
}

// Uploads every file under a random name (no user id, no original name in the path).
// Files upload in parallel (up to MAX_FILES). If any upload fails, the ones that
// succeeded are removed and null is returned.
export async function uploadEvidence(admin: AdminClient, files: File[]): Promise<UploadedFile[] | null> {
    if (files.length === 0) return [];

    const results = await Promise.allSettled(
        files.map(async (file): Promise<UploadedFile> => {
            const path = `${randomUUID()}.${EXTENSIONS[file.type]}`;
            const { error } = await admin.storage
                .from(EVIDENCE_BUCKET)
                .upload(path, file, { contentType: file.type });

            if (error) throw error;
            return { path, name: file.name, type: file.type, size: file.size };
        })
    );

    const uploaded: UploadedFile[] = [];
    let failed = false;

    for (const r of results) {
        if (r.status === "fulfilled") {
            uploaded.push(r.value);
        } else {
            failed = true;
            console.error("[uploadEvidence] upload failed:", r.reason);
        }
    }

    if (failed) {
        await removeFiles(admin, uploaded.map((u) => u.path));
        return null;
    }

    return uploaded; // same order as `files`
}

/* ---------------- rpc results ---------------- */

// submit_complaint returns TABLE (out_complaint_id, out_tracking_id), so data is an array
export function readTrackingId(rpcData: unknown): string | null {
    const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    const id = (row as { out_tracking_id?: unknown } | null | undefined)?.out_tracking_id;
    return typeof id === "string" ? id : null;
}