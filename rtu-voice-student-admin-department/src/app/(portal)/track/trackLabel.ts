import type { TrackedComplaint } from "@/features/student/studentTypes";

// The database names are snake_case (in_progress), so show these labels instead of status_name.
export const STATUS_LABELS: Record<number, string> = {
  1: "Pending",
  2: "Assigned",
  3: "In Progress",
  4: "Resolved",
  5: "Rejected",
};

export type TimelineStep = {
  key: string;
  label: string;
  at: string | null; // null = hasn't happened yet
  note: string | null; // rejection reason
  state: "done" | "current" | "upcoming";
};

export function buildSteps(c: TrackedComplaint): TimelineStep[] {
  const pick = (id: number) => c.progress.filter((p) => p.entry_kind === "status" && p.entry_status_id === id).pop();
  const submitted = c.progress.find((p) => p.entry_kind === "submitted");

  const first = { key: "submitted", label: "Submitted", at: submitted?.entry_at ?? c.created_at, note: null };

  const rejected = pick(5);
  if (rejected) {
    return [
      { ...first, state: "done" },
      { key: "rejected", label: "Rejected", at: rejected.entry_at, note: rejected.entry_message, state: "done" },
    ];
  }

  const assigned = pick(2);
  const inProgress = pick(3);
  const resolved = pick(4);

  const steps = [
    first,
    {
      key: "assigned",
      label: c.department_name ? `Approved and assigned to ${c.department_name}` : "Approved and assigned",
      at: assigned?.entry_at ?? null,
      note: null,
    },
    { key: "in_progress", label: "In Progress", at: inProgress?.entry_at ?? null, note: null },
    { key: "resolved", label: "Resolved", at: resolved?.entry_at ?? null, note: null },
  ];

  const last = steps.reduce((acc, s, i) => (s.at ? i : acc), 0);
  return steps.map((s, i) => ({
    ...s,
    state: i < last ? "done" : i === last ? (resolved ? "done" : "current") : "upcoming",
  }));
}

// Department messages, newest first (the timestamps are ISO strings, so they sort as text).
export const sortedUpdates = (c: TrackedComplaint) => [...c.updates].sort((a, b) => b.entry_at.localeCompare(a.entry_at));