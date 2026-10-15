export const CATEGORIES = [
  "Academic",
  "Facilities & Infrastructure",
  "Administrative",
  "Student Life",
  "Other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const STATUSES = ["Pending", "Assigned", "In Progress", "Resolved", "Rejected"] as const;
export type Status = (typeof STATUSES)[number];

/** Statuses that can appear on the public dashboard (only released complaints). */
export const PUBLIC_STATUSES = ["Assigned", "In Progress", "Resolved"] as const;
export type PublicStatus = (typeof PUBLIC_STATUSES)[number];

/** Department portals that complaints can be assigned to (names as used in the Figma admin screens). */
export const DEPARTMENTS = [
  "Facilities Office",
  "Registrar's Office",
  "Academic Affairs",
  "Student Affairs",
  "Cashier's Office",
  "ICT Office",
] as const;
export type Department = (typeof DEPARTMENTS)[number];

/** Set by the (simulated) AI step when a complaint is assigned. Never shown to students. */
export const PRIORITIES = ["High", "Medium", "Low"] as const;
export type Priority = (typeof PRIORITIES)[number];

/** SLA targets from the RTU Voice roadmap (days, counted from assignment). */
export const SLA: Record<Priority, { acknowledge: number; resolve: number }> = {
  High: { acknowledge: 1, resolve: 7 },
  Medium: { acknowledge: 3, resolve: 14 },
  Low: { acknowledge: 5, resolve: 21 },
};

export type Role = "student" | "admin" | "department";

export interface EvidenceFile {
  name: string;
  size: number; // bytes
  type: string;
}

export interface TimelineEvent {
  status: Status;
  label: string;
  at: string; // ISO date-time
}

export interface DepartmentUpdate {
  department: string;
  at: string; // ISO date-time
  message: string;
}

export interface Complaint {
  trackingId: string;
  title: string;
  category: Category;
  description: string;
  submittedAt: string;
  status: Status;
  /** True when submitted by the signed-in demo student (shown on History / Status Tracker). */
  mine: boolean;
  department?: Department;
  priority?: Priority;
  assignedAt?: string;
  acknowledgedAt?: string; // when the department started work (moved to In Progress)
  resolvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  optOutOfPublic: boolean;
  /** AI-written, depersonalized text for the public dashboard (simulated in this build). */
  aiTitle?: string;
  aiSummary?: string;
  files: EvidenceFile[];
  timeline: TimelineEvent[];
  updates: DepartmentUpdate[];
}

/** A released, depersonalized entry on the Public Dashboard. */
export interface PublicConcern {
  id: string;
  title: string;
  summary: string;
  category: Category;
  status: PublicStatus;
  date: string;
}

export interface Account {
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  /** Set for department-head accounts only: the one office whose complaints they can see. */
  department?: Department;
}

/** A department-head login (created manually in the real system; never through public sign-up). */
export interface DepartmentAccount {
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  department: Department;
}

/** The only statuses a department can set (Assigned is set automatically on assignment). */
export const DEPARTMENT_STATUSES = ["In Progress", "Resolved"] as const;
export type DepartmentStatus = (typeof DEPARTMENT_STATUSES)[number];

export interface AdminAccount {
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  addedAt: string;
  lastActiveAt: string;
}

export const ACTIVITY_ACTIONS = ["Assigned", "Reassigned", "Rejected", "Status changed", "Update posted"] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export interface ActivityEntry {
  id: string;
  at: string;
  actor: string;
  actorRole: "Admin" | "Department";
  action: ActivityAction;
  trackingId: string;
  department?: string;
  detail?: string;
}
