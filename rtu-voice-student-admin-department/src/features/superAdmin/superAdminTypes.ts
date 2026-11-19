// Super-admin-only types and constants.
// No "use server" here: a "use server" file may only export async functions.

/* ---------------- constants ---------------- */

export const STAFF_ROLE_ID = { admin: 2, department: 3 } as const;
export type StaffRole = keyof typeof STAFF_ROLE_ID;

export const EMAIL_DOMAIN = "@rtu.edu.ph";
export const MAX_PERSON_NAME = 100;
export const MAX_DEPARTMENT_NAME = 150;

/* ---------------- paging ---------------- */

export type PagedData<Row> = {
  rows: Row[];
  total: number;        // rows matching the current filters/search (pagination)
  overallTotal: number; // all rows of this page's kind, ignoring filters (badge)
  page: number;
  totalPages: number;
};

/* ---------------- accounts page (admins + departments) ---------------- */

export type StaffAccountRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role_id: number;
  role: string | null;
  department_id: number | null;
  department: string | null;
  department_acronym: string | null;
  is_active: boolean;
  created_at: string;
};

export type StaffAccountListData = PagedData<StaffAccountRow> & {
  roleCounts: { admin: number; department: number };
};

export type StaffAccountFilters = {
  search?: string;
  role?: StaffRole;      // undefined = all roles
  isActive?: boolean;    // undefined = all
  page?: number;
};

/* ---------------- department accounts page ---------------- */

// one row per DEPARTMENT; the account fields are null if it has no account yet
export type DepartmentAccountRow = {
  department_id: number;
  department: string;
  department_acronym: string | null;
  is_active: boolean;               // the department's status
  account_id: string | null;
  account_name: string | null;
  email: string | null;
  account_active: boolean | null;
  open_complaints: number;          // assigned + in_progress
  added_at: string | null;
};

export type DepartmentAccountFilters = {
  search?: string;
  isActive?: boolean;
  page?: number;
};

/* ---------------- admin accounts page ---------------- */

export type AdminAccountRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
};

export type AdminAccountFilters = {
  search?: string;
  isActive?: boolean;
  page?: number;
};

/* ---------------- activity log ---------------- */

// as returned by get_activity_log
export type ActivityLogRawRow = {
  id: number;
  created_at: string;
  tracking_id: string;
  actor_id: string;
  actor_name: string;          // department name for department accounts
  actor_role: "admin" | "department";
  action_id: number;
  action: string;              // actions.name
  department_id: number | null;
  department: string | null;
  reason: string | null;
  from_status: string | null;
  to_status: string | null;
  priority: string | null;
};

// what the UI gets: the raw status/priority fields are folded into `details`
export type ActivityLogRow = Omit<
  ActivityLogRawRow,
  "reason" | "from_status" | "to_status" | "priority"
> & {
  details: string | null;
};

export type ActivityLogFilters = {
  search?: string;                       // tracking id
  action?: string;                       // actions.name, undefined = all actions
  role?: StaffRole;                      // undefined = admins and departments
  page?: number;
};

/* ---------------- create / edit ---------------- */

export type CreateAccountInput = {
  email: string;
  first_name: string;
  last_name: string;
  role: StaffRole;
  department_id?: number;                // required when role is "department"
};