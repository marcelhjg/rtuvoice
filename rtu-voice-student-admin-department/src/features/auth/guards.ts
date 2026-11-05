import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "student" | "admin" | "department" | "superAdmin";

// matches your roles table: 1 = student, 2 = admin, 3 = department
export const ROLE_BY_ID: Record<number, Role> = {
    1: "student",
    2: "admin",
    3: "department",
    4: "superAdmin"
};

// where each role lands after login
export const ROLE_HOME: Record<Role, string> = {
    student: "/dashboard",
    admin: "/admin/",
    department: "/department/",
    superAdmin: "/superAdmin/"
};

export type CurrentUser = {
    id: string;
    email: string | undefined;
    role: Role;
    departmentId: number | null; // only meaningful for the department role
    firstName: string | null;
    lastName: string | null;
};

// Logged-in user + role, or null. cache() means it runs once per request,
// so calling it in a layout AND a page doesn't hit the database twice.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
    const supabase = await createClient();

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    // normal client (not admin), so RLS applies: users need a policy to read their own row
    const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role_id, department_id, first_name, last_name, is_active")
    .eq("id", user.id)
    .maybeSingle();

    if (profileError || !profile || !profile.is_active) return null;

    const role = ROLE_BY_ID[profile.role_id];
    if (!role) return null;

    return {
        id: user.id,
        email: user.email,
        role,
        departmentId: profile.department_id ?? null,
        firstName: profile.first_name ?? null,
        lastName: profile.last_name ?? null,
    };
});

// Use at the top of every protected layout AND page:
//   const me = await requireRole("admin");
export async function requireRole(...allowed: Role[]): Promise<CurrentUser> {
    const current = await getCurrentUser();

    if (!current) redirect("/login");
    if (!allowed.includes(current.role)) redirect(ROLE_HOME[current.role]);

    return current;
}

// Use on /login and /register so signed-in users go to their own portal
export async function redirectIfAuthenticated() {
    const current = await getCurrentUser();
    if (current) redirect(ROLE_HOME[current.role]);
}

// For server actions that return { success, message } instead of redirecting:
//   const me = await getCurrentUser();
//   if (!me || me.role !== "admin") return { success: false, message: "Not allowed." };

export function destinationFor(role: keyof typeof ROLE_HOME, next: string | null): string {
  const home = ROLE_HOME[role];
  // Internal paths only. The backslash check matters because browsers read "/\evil.com" as "//evil.com".
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return home;

  const belongsTo = (prefix: string) => next === prefix || next.startsWith(`${prefix}/`);
  const target = belongsTo("/admin") ? "admin" : belongsTo("/superadmin") ? "superadmin" : belongsTo("/department") ? "department" : "student";
  return target === role ? next : home;
}