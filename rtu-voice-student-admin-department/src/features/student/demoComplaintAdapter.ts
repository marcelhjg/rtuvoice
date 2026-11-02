import type { TrackedComplaint } from "./studentTypes";
import type { Complaint, Status } from "@/lib/types";

const STATUS_IDS: Record<Status, number> = {
  Pending: 1,
  Assigned: 2,
  "In Progress": 3,
  Resolved: 4,
  Rejected: 5,
};

export function toTrackedComplaint(complaint: Complaint): TrackedComplaint {
  return {
    tracking_id: complaint.trackingId,
    title: complaint.title,
    description: complaint.description,
    status_id: STATUS_IDS[complaint.status],
    status_name: complaint.status.toLowerCase().replaceAll(" ", "_"),
    category_name: complaint.category,
    department_name: complaint.department ?? null,
    created_at: complaint.submittedAt,
    attachments: complaint.files.map((file, index) => ({
      id: index + 1,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
    })),
    progress: complaint.timeline.map((event, index) => ({
      entry_kind: index === 0 && event.status === "Pending" ? "submitted" : "status",
      entry_status_id: index === 0 && event.status === "Pending" ? null : STATUS_IDS[event.status],
      entry_message: event.status === "Rejected" ? complaint.rejectionReason ?? null : null,
      entry_at: event.at,
    })),
    updates: complaint.updates.map((update) => ({
      entry_kind: "update",
      entry_status_id: null,
      entry_message: update.message,
      entry_at: update.at,
    })),
  };
}
