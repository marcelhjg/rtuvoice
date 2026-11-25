"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/features/auth/guards";
import type { ActionResult, ActionState } from "@/features/shared/sharedTypes";
import {
  UUID_RE,
  cleanSearch,
  hasKey,
  pageParams,
  statusLabel,
  toPage,
  totalPagesOf,
} from "@/features/shared/sharedUtils";
import { runAfterResponse } from "@/features/shared/background";
import { invalidateDepartmentOptions } from "@/features/admin/adminData";
import {
  EMAIL_DOMAIN,
  MAX_DEPARTMENT_NAME,
  MAX_PERSON_NAME,
  MAX_ACRONYM,
  STAFF_ROLE_ID,
  type ActivityLogFilters,
  type ActivityLogRawRow,
  type ActivityLogRow,
  type AdminAccountFilters,
  type AdminAccountRow,
  type CreateAccountInput,
  type DepartmentAccountFilters,
  type DepartmentAccountRow,
  type PagedData,
  type StaffAccountFilters,
  type StaffAccountListData,
  type StaffAccountRow,
  type StudentAccountFilters,
  type StudentAccountRow,
} from "@/features/superAdmin/superAdminTypes";

/* ---------------- helpers (not exported) ---------------- */

// adjust "superadmin" to whatever getCurrentUser() returns for the super admin
const isSuperAdmin = (me: { role?: string } | null | undefined) => me?.role === "superadmin";

// P0001 = messages we wrote with `raise exception` in the RPCs, safe to show
const rpcMessage = (error: { code?: string; message: string }, fallback: string) =>
  error.code === "42501" ? "Not allowed." : error.code === "P0001" ? error.message : fallback;

const optBool = (v: unknown) => (typeof v === "boolean" ? v : null);
const EMAIL_RE = /^[^@\s]+@rtu\.edu\.ph$/;

// (best effort: the database already blocks deactivated users, this also stops sign-in)
async function syncAuthBan(userId: string, active: boolean) {
  try {
    const admin = await createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: active ? "none" : "876000h",
    });
    if (error) console.error("[syncAuthBan] failed:", userId, error);
  } catch (e) {
    console.error("[syncAuthBan] threw:", userId, e);
  }
}

// builds the "Details" column text
function buildDetails(r: ActivityLogRawRow): string | null {
  if (r.action === "status_changed" && r.to_status) {
    return r.from_status
      ? `${statusLabel(r.from_status)} → ${statusLabel(r.to_status)}`
      : statusLabel(r.to_status);
  }
  if (r.reason) return r.reason;
  if (r.action === "department_assigned" && r.priority) return `AI priority: ${r.priority}`;
  return null;
}

/* ---------------- lists ---------------- */

export async function getStaffAccounts(
  opts: StaffAccountFilters = {}
): Promise<ActionResult<StaffAccountListData>> {
  const me = await getCurrentUser();
  if (!isSuperAdmin(me)) return { success: false, message: "Not allowed." };

  const page = toPage(opts.page);
  const role = opts.role && hasKey(STAFF_ROLE_ID, opts.role) ? opts.role : null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_staff_accounts", {
    p_search: cleanSearch(opts.search),
    p_role: role,
    p_is_active: optBool(opts.isActive),
    ...pageParams(page),
  });

  if (error || !data) {
    console.error("[get_staff_accounts] rpc failed:", error);
    return { success: false, message: "Couldn't load accounts. Please try again." };
  }

  const raw = data as {
    total: number;
    overall_total: number;
    role_counts: { admin: number; department: number };
    rows: StaffAccountRow[];
  };

  return {
    success: true,
    rows: raw.rows,
    total: raw.total,
    overallTotal: raw.overall_total,
    roleCounts: raw.role_counts,
    page,
    totalPages: totalPagesOf(raw.total),
  };
}

export async function getStudentAccounts(
  opts: StudentAccountFilters = {}
): Promise<ActionResult<PagedData<StudentAccountRow>>> {
  const me = await getCurrentUser();
  if (!isSuperAdmin(me)) return { success: false, message: "Not allowed." };

  const page = toPage(opts.page);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_student_accounts", {
    p_search: cleanSearch(opts.search),
    p_is_active: optBool(opts.isActive),
    ...pageParams(page),
  });

  if (error || !data) {
    console.error("[get_student_accounts] rpc failed:", error);
    return { success: false, message: "Couldn't load student accounts. Please try again." };
  }

  const raw = data as { total: number; overall_total: number; rows: StudentAccountRow[] };

  return {
    success: true,
    rows: raw.rows,
    total: raw.total,
    overallTotal: raw.overall_total,
    page,
    totalPages: totalPagesOf(raw.total),
  };
}

export async function getDepartmentAccounts(
  opts: DepartmentAccountFilters = {}
): Promise<ActionResult<PagedData<DepartmentAccountRow>>> {
  const me = await getCurrentUser();
  if (!isSuperAdmin(me)) return { success: false, message: "Not allowed." };

  const page = toPage(opts.page);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_department_accounts", {
    p_search: cleanSearch(opts.search),
    p_is_active: optBool(opts.isActive),
    ...pageParams(page),
  });

  if (error || !data) {
    console.error("[get_department_accounts] rpc failed:", error);
    return { success: false, message: "Couldn't load department accounts. Please try again." };
  }

  const raw = data as { total: number; overall_total: number; rows: DepartmentAccountRow[] };

  return {
    success: true,
    rows: raw.rows,
    total: raw.total,
    overallTotal: raw.overall_total,
    page,
    totalPages: totalPagesOf(raw.total),
  };
}

export async function getAdminAccounts(
  opts: AdminAccountFilters = {}
): Promise<ActionResult<PagedData<AdminAccountRow>>> {
  const me = await getCurrentUser();
  if (!isSuperAdmin(me)) return { success: false, message: "Not allowed." };

  const page = toPage(opts.page);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_admin_accounts", {
    p_search: cleanSearch(opts.search),
    p_is_active: optBool(opts.isActive),
    ...pageParams(page),
  });

  if (error || !data) {
    console.error("[get_admin_accounts] rpc failed:", error);
    return { success: false, message: "Couldn't load admin accounts. Please try again." };
  }

  const raw = data as { total: number; overall_total: number; rows: AdminAccountRow[] };

  return {
    success: true,
    rows: raw.rows,
    total: raw.total,
    overallTotal: raw.overall_total,
    page,
    totalPages: totalPagesOf(raw.total),
  };
}

export async function getActivityLog(
  opts: ActivityLogFilters = {}
): Promise<ActionResult<PagedData<ActivityLogRow>>> {
  const me = await getCurrentUser();
  if (!isSuperAdmin(me)) return { success: false, message: "Not allowed." };

  const page = toPage(opts.page);
  const role = opts.role && hasKey(STAFF_ROLE_ID, opts.role) ? opts.role : null;
  const action = opts.action && /^[a-z_]{1,50}$/.test(opts.action) ? opts.action : null;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_activity_log", {
    p_search: cleanSearch(opts.search),
    p_action: action,
    p_actor_role: role,
    ...pageParams(page),
  });

  if (error || !data) {
    console.error("[get_activity_log] rpc failed:", error);
    return { success: false, message: "Couldn't load the activity log. Please try again." };
  }

  const raw = data as { total: number; overall_total: number; rows: ActivityLogRawRow[] };

  const rows: ActivityLogRow[] = raw.rows.map((r) => ({
    id: r.id,
    created_at: r.created_at,
    tracking_id: r.tracking_id,
    actor_id: r.actor_id,
    actor_name: r.actor_name,
    actor_role: r.actor_role,
    action_id: r.action_id,
    action: r.action,
    department_id: r.department_id,
    department: r.department,
    details: buildDetails(r),
  }));

  return {
    success: true,
    rows,
    total: raw.total,
    overallTotal: raw.overall_total,
    page,
    totalPages: totalPagesOf(raw.total),
  };
}

/* ---------------- create account ---------------- */

export async function createAccount(input: CreateAccountInput): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!isSuperAdmin(me)) return { success: false, message: "Not allowed." };

  const email = input.email?.trim().toLowerCase() ?? "";
  const first = input.first_name?.trim() ?? "";
  const last = input.last_name?.trim() ?? "";
  // hasKey, not `in`: "constructor" / "toString" are `in` every object
  const roleId = hasKey(STAFF_ROLE_ID, input.role) ? STAFF_ROLE_ID[input.role] : null;

  if (!EMAIL_RE.test(email)) {
    return { success: false, message: `Email must be a valid ${EMAIL_DOMAIN} address.` };
  }
  if (!first || !last) return { success: false, message: "First name and last name are required." };
  if (first.length > MAX_PERSON_NAME || last.length > MAX_PERSON_NAME) {
    return { success: false, message: "Name is too long." };
  }
  if (roleId === null) return { success: false, message: "Invalid role." };

  if (input.role === "department") {
    if (!Number.isInteger(input.department_id) || (input.department_id as number) <= 0) {
      return { success: false, message: "Please choose a department." };
    }
  } else if (input.department_id !== undefined && input.department_id !== null) {
    return { success: false, message: "Admin accounts cannot belong to a department." };
  }

  // 1) the auth user (no password: the account is created already confirmed;
  //    the person sets a password through "forgot password", so check that this is the flow you want)
  const admin = await createAdminClient();
  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { first_name: first, last_name: last }
  });

  if (authError || !created?.user) {
    console.error("[createAccount] auth user failed:", authError);
    const exists = authError?.code === "email_exists" || /already/i.test(authError?.message ?? "");
    return {
      success: false,
      message: exists
        ? "An account with this email already exists."
        : "Couldn't create the account. Please try again.",
    };
  }

  // 2) the profile row; undo the auth user if this fails
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_staff_account", {
    p_user_id: created.user.id,
    p_email: email,
    p_first_name: first,
    p_last_name: last,
    p_role_id: roleId,
    p_department_id: input.role === "department" ? (input.department_id as number) : null,
  });

  if (error) {
    console.error("[create_staff_account] rpc failed:", error);
    const { error: rollbackError } = await admin.auth.admin.deleteUser(created.user.id);
    if (rollbackError) console.error("[createAccount] rollback failed:", created.user.id, rollbackError);
    return { success: false, message: rpcMessage(error, "Couldn't create the account. Please try again.") };
  }

  // revalidatePath("/superadmin", "layout");
  return { success: true, message: "Account created." };
}

/* ---------------- deactivate / reactivate ---------------- */

export async function setAccountActive(
  userId: string,
  isActive: boolean
): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!isSuperAdmin(me)) return { success: false, message: "Not allowed." };

  if (!UUID_RE.test(userId) || typeof isActive !== "boolean") {
    return { success: false, message: "Invalid request." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_account_active", {
    p_user_id: userId,
    p_is_active: isActive,
  });

  if (error) {
    console.error("[set_account_active] rpc failed:", error);
    return { success: false, message: rpcMessage(error, "Something went wrong. Please try again.") };
  }

  // The RPC already made the account inactive in the database (getCurrentUser and login both check that),
  // so mirroring it into Auth is belt-and-braces and can happen after the response.
  runAfterResponse(() => syncAuthBan(userId, isActive), "setAccountActive ban sync");

  // revalidatePath("/superadmin", "layout");
  return { success: true, message: isActive ? "Account reactivated." : "Account deactivated." };
}

export async function setDepartmentActive(
  departmentId: number,
  isActive: boolean
): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!isSuperAdmin(me)) return { success: false, message: "Not allowed." };

  if (!Number.isInteger(departmentId) || departmentId <= 0 || typeof isActive !== "boolean") {
    return { success: false, message: "Invalid request." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_department_active", {
    p_department_id: departmentId,
    p_is_active: isActive,
  });

  if (error) {
    console.error("[set_department_active] rpc failed:", error);
    return { success: false, message: rpcMessage(error, "Something went wrong. Please try again.") };
  }

  invalidateDepartmentOptions();

  // the RPC also (de)activated the department's account(s): mirror that in Auth, after the response
  runAfterResponse(async () => {
    const admin = await createAdminClient();
    const { data: accounts, error: accountsError } = await admin
      .from("users")
      .select("id, is_active")
      .eq("department_id", departmentId)
      .eq("role_id", STAFF_ROLE_ID.department);

    if (accountsError) {
      console.error("[setDepartmentActive] account lookup failed:", accountsError);
      return;
    }
    await Promise.all((accounts ?? []).map((a) => syncAuthBan(a.id, a.is_active)));
  }, "setDepartmentActive ban sync");

  // revalidatePath("/superadmin", "layout");
  return { success: true, message: isActive ? "Department reactivated." : "Department deactivated." };
}

/* ---------------- rename ---------------- */

export async function renameAccount(
  userId: string,
  firstName: string,
  lastName: string
): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!isSuperAdmin(me)) return { success: false, message: "Not allowed." };

  const first = firstName?.trim() ?? "";
  const last = lastName?.trim() ?? "";

  if (!UUID_RE.test(userId)) return { success: false, message: "Invalid request." };
  if (!first || !last) return { success: false, message: "First name and last name are required." };
  if (first.length > MAX_PERSON_NAME || last.length > MAX_PERSON_NAME) {
    return { success: false, message: "Name is too long." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("rename_account", {
    p_user_id: userId,
    p_first_name: first,
    p_last_name: last,
  });

  if (error) {
    console.error("[rename_account] rpc failed:", error);
    return { success: false, message: rpcMessage(error, "Something went wrong. Please try again.") };
  }

  // revalidatePath("/superadmin", "layout");
  return { success: true, message: "Account renamed." };
}

export async function renameDepartment(
  departmentId: number,
  name: string
): Promise<ActionState> {
  const me = await getCurrentUser();
  if (!isSuperAdmin(me)) return { success: false, message: "Not allowed." };

  const trimmed = name?.trim() ?? "";

  if (!Number.isInteger(departmentId) || departmentId <= 0) {
    return { success: false, message: "Invalid request." };
  }
  if (!trimmed) return { success: false, message: "Department name is required." };
  if (trimmed.length > MAX_DEPARTMENT_NAME) {
    return { success: false, message: "Department name is too long." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("rename_department", {
    p_department_id: departmentId,
    p_name: trimmed,
  });

  if (error) {
    console.error("[rename_department] rpc failed:", error);
    return { success: false, message: rpcMessage(error, "Something went wrong. Please try again.") };
  }

  invalidateDepartmentOptions();

  // revalidatePath("/superadmin", "layout");
  return { success: true, message: "Department renamed." };
}

/* ---------------- available department ---------------- */

export async function getAvailableDepartments(): Promise<
  { success: true; departments: { id: number; name: string }[] } | { success: false; message: string }
> {
  const me = await getCurrentUser();
  if (!isSuperAdmin(me)) return { success: false, message: "Not allowed." };

  const admin = await createAdminClient();
  const [depts, staff] = await Promise.all([
    admin.from("departments").select("id, name").eq("is_active", true).order("name"),
    admin.from("users").select("department_id").eq("role_id", STAFF_ROLE_ID.department).eq("is_active", true),
  ]);
  if (depts.error || staff.error) {
    console.error("[getAvailableDepartments] failed:", depts.error ?? staff.error);
    return { success: false, message: "Couldn't load departments." };
  }

  // one active account per department: only list departments without one
  const taken = new Set((staff.data ?? []).map((u) => u.department_id));
  return { success: true, departments: (depts.data ?? []).filter((d) => !taken.has(d.id)) };
}


/* ---------------- add department ---------------- */

export async function addDepartment(
  name: string,
  acronym?: string
): Promise<ActionResult<{ department_id: number }>> {
  const me = await getCurrentUser();
  if (!isSuperAdmin(me)) return { success: false, message: "Not allowed." };

  const trimmedName = name?.trim() ?? "";
  const trimmedAcronym = acronym?.trim() || null;

  if (!trimmedName) return { success: false, message: "Department name is required." };
  if (trimmedName.length > MAX_DEPARTMENT_NAME) {
    return { success: false, message: "Department name is too long." };
  }
  if (trimmedAcronym && trimmedAcronym.length > MAX_ACRONYM) {
    return { success: false, message: "Acronym is too long." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("add_department", {
    p_name: trimmedName,
    p_acronym: trimmedAcronym,
  });

  if (error) {
    console.error("[add_department] rpc failed:", error);
    return { success: false, message: rpcMessage(error, "Couldn't add the department. Please try again.") };
  }

  invalidateDepartmentOptions();

  // revalidatePath("/superadmin", "layout");
  return { success: true, message: "Department added.", department_id: Number(data) };
}