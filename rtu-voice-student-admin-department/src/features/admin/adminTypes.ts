import type { TrackedComplaint } from "../student/studentTypes"; // adjust to where TrackedComplaint lives

// One row of the admin timeline. Same first four keys as the complainant version,
// plus who acted and the raw log reason.
export type AdminTimelineEntry = {
    entry_kind: "submitted" | "status" | "update";
    entry_status_id: number | null;
    entry_message: string | null;   // rejection reason, assigned-to department, or the update text
    entry_at: string;
    department_name: string | null; // department on the log row, if any
    reason: string | null;          // raw log reason (e.g. why it was reassigned)
    user_id: string | null;         // who performed the action / posted the update
};

export type ComplaintReturn = {
    department_id: number | null;
    department_name: string | null;
    reason: string;
    returned_at: string;            // ISO timestamp, UTC
};

// get_complaint_details_admin(tracking_id)
export type AdminTrackedComplaint = Omit<TrackedComplaint, "progress" | "updates"> & {
    id: string;
    priority_name: string | null;
    department_id: number | null;
    updated_at: string;
    progress: AdminTimelineEntry[]; // entry_kind "submitted" | "status"
    updates: AdminTimelineEntry[];  // entry_kind "update"
    returns: ComplaintReturn[];     // newest first; empty if never returned
};