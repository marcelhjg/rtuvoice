/* ---------------- submit complaint ---------------- */

export type SubmitComplaintErrors = {
    title?: string;
    category?: string;
    description?: string;
    evidence?: string;
};

export type SubmitComplaintState = {
    success: boolean;
    message: string;
    errors?: SubmitComplaintErrors;
    trackingId?: string;
};

// what we send to submit_complaint for each uploaded file
export type UploadedFile = {
    path: string;
    name: string;
    type: string;
    size: number;
};

/* ---------------- track complaint ---------------- */

export type TrackedComplaint = {
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

export type TrackComplaintState = {
    success: boolean;
    message: string;
    errors?: {
        trackingId?: string;
    };
    trackResult?: TrackedComplaint | null;
};

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

/* ---------------- history ---------------- */

export type HistoryRow = {
    id: string;
    tracking_id: string;
    title: string;
    description: string;
    category_id: number;
    status_id: number;
    department_id: number | null;
    created_at: string;
};

export type HistoryState = {
    success: boolean;
    message: string;
    historyData?: HistoryRow[];
};

/** Statuses that can appear on the public dashboard (only released complaints). */
export const PUBLIC_STATUSES = ["Assigned", "In Progress", "Resolved"] as const;
export type PublicStatus = (typeof PUBLIC_STATUSES)[number];

export const CATEGORIES = [
  "Academic",
  "Facilities & Infrastructure",
  "Administrative",
  "Student Life",
  "Safety and Security",
  "Technology & Online Systems",
  "Food, Health & Sanitation",
  "Library & Learning Resources",
  "Others",
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface PublicConcern {
  id: string;
  title: string;
  summary: string;
  category: Category;
  status: PublicStatus;
  date: string;
}

export type PublicRow = {
  id: string;
  ai_title: string;
  ai_summary: string;
  category_id: number;
  status_id: number;
  created_at: string;
  total_count: number;
};

export const MAX_FILES = 5;

export const TITLE_MAX = 100;
export const DESCRIPTION_MAX = 2000;
export const MAX_TOTAL_BYTES = 5 * 1024 * 1024; // 5 MB total per submission

// allowed types -> the extension we store (we never use the uploaded file name in the path).
// If you add a type here, add its extension to the regex in submit_complaint too.
export const EXTENSIONS: Record<string, string> = {
    // Images
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",

    // Audio
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/x-m4a": "m4a",
    "audio/wav": "wav",
    "audio/wave": "wav",
    "audio/x-wav": "wav",

    // Documents
    "application/pdf": "pdf",

    // Video
    "video/mp4": "mp4",
};

export const EVIDENCE_ACCEPT_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.mp3,.m4a,.wav,.pdf,.mp4";

export function isAllowedEvidenceType(type: string) {
    return Object.prototype.hasOwnProperty.call(EXTENSIONS, type);
}