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

export const STATUSES = ["Pending", "Assigned", "In Progress", "Resolved", "Rejected"] as const;
export type Status = (typeof STATUSES)[number];

/** Statuses that can appear on the public dashboard (only released complaints). */
export const PUBLIC_STATUSES = ["Assigned", "In Progress", "Resolved"] as const;
export type PublicStatus = (typeof PUBLIC_STATUSES)[number];

/**
 * The departments the demo starts with (names as used in the Figma admin screens). The live list
 * is state in the demo store: the superadmin can add, rename and deactivate departments.
 */
export const DEPARTMENTS = [
  "Facilities Office",
  "Registrar's Office",
  "Academic Affairs",
  "Student Affairs",
  "Cashier's Office",
  "ICT Office",
] as const;
/** A department name. Departments are managed by the superadmin, so this is any string. */
export type Department = string;

export interface DepartmentRecord {
  name: Department;
  /** Inactive departments can't receive new assignments; their history stays visible. */
  active: boolean;
  addedAt: string;
}

/** Set by the (simulated) AI step when a complaint is assigned. Never shown to students. */
export const PRIORITIES = ["High", "Medium", "Low"] as const;
export type Priority = (typeof PRIORITIES)[number];

/** SLA targets from the RTU Voice roadmap (days, counted from assignment). */
export const SLA: Record<Priority, { acknowledge: number; resolve: number }> = {
  High: { acknowledge: 1, resolve: 7 },
  Medium: { acknowledge: 3, resolve: 14 },
  Low: { acknowledge: 5, resolve: 21 },
};

/** SRS §6: four roles. The single superadmin has its own small portal (accounts, departments, Activity Log). */
export type Role = "student" | "admin" | "department" | "superadmin";

export interface EvidenceFile {
  name: string;
  size: number; // bytes
  type: string;
  /** Object path in the private "evidence" storage bucket, set by the backend after upload
   *  (e.g. "<complaint uuid>/<random>.jpg", never the original file name). Absent in this demo. */
  path?: string;
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
  /** True when submitted by a student account (shown on that student's History / Status Tracker). */
  mine: boolean;
  /** Which student submitted it (demo only; seed complaints belong to the demo student). Never shown to
   *  staff: the real system keeps this link internally (pseudonymous, SRS §1). */
  ownerEmail?: string;
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
  /** Deactivated accounts can't log in (Superadmin › Accounts). Missing means active. */
  active?: boolean;
  addedAt?: string;
}

/** The only statuses a department can set (Assigned is set automatically on assignment). */
export const DEPARTMENT_STATUSES = ["In Progress", "Resolved"] as const;
export type DepartmentStatus = (typeof DEPARTMENT_STATUSES)[number];

/**
 * The one status a department may move a complaint to next (SRS: Assigned → In Progress → Resolved).
 * No skipping (Assigned → Resolved) and no going back; Resolved has no next status.
 */
export function nextDepartmentStatus(status: Status): DepartmentStatus | null {
  if (status === "Assigned") return "In Progress";
  if (status === "In Progress") return "Resolved";
  return null;
}

export interface AdminAccount {
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  addedAt: string;
  lastActiveAt: string;
  /** Deactivated accounts can't log in (Superadmin › Accounts). Missing means active. */
  active?: boolean;
}

/** SRS §3/§4: the Activity Log records assignments, reassignments and status changes (a rejection is a status change). */
export const ACTIVITY_ACTIONS = ["Assigned", "Reassigned", "Rejected", "Status changed"] as const;
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
