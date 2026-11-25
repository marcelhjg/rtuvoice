import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "student" | "admin" | "department" | "superadmin";

// matches your roles table: 1 = student, 2 = admin, 3 = department, 4 = superadmin
export const ROLE_BY_ID: Record<number, Role> = {
    1: "student",
    2: "admin",
    3: "department",
    4: "superadmin"
};

// where each role lands after login
export const ROLE_HOME: Record<Role, string> = {
    student: "/dashboard",
    admin: "/admin/",
    department: "/department/",
    superadmin: "/superadmin/"
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
//
// Cost: getClaims() verifies the JWT locally when the project uses asymmetric signing keys
// (no network call; with a shared-secret project it falls back to asking Auth, same as getUser()).
// The profile query still runs on every request on purpose, so role changes and deactivation
// (is_active) take effect immediately instead of waiting for the token to expire.
//
// Needs a supabase-js version that has auth.getClaims(). If yours doesn't, use the old lines:
//   const { data: { user }, error } = await supabase.auth.getUser();
//   if (error || !user) return null;   // ...and use user.id / user.email below
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
    const supabase = await createClient();

    const { data: claimsData, error } = await supabase.auth.getClaims();
    const claims = claimsData?.claims;
    if (error || !claims?.sub) return null;

    const userId = claims.sub;

    // normal client (not admin), so RLS applies: users need a policy to read their own row
    const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("role_id, department_id, first_name, last_name, is_active")
        .eq("id", userId)
        .maybeSingle();

    if (profileError || !profile || !profile.is_active) return null;

    const role = ROLE_BY_ID[profile.role_id];
    if (!role) return null;

    return {
        id: userId,
        email: typeof claims.email === "string" ? claims.email : undefined,
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

export function destinationFor(role: Role, next: string | null): string {
  const home = ROLE_HOME[role];
  // internal paths only; reject //, backslashes and control characters (tab/newline are stripped by browsers)
  if (!next || !next.startsWith("/") || next.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(next)) return home;

  const path = next.split(/[?#]/)[0].toLowerCase();
  const belongsTo = (prefix: string) => path === prefix || path.startsWith(`${prefix}/`);
  const target: Role = belongsTo("/admin") ? "admin"
    : belongsTo("/superadmin") ? "superadmin"
    : belongsTo("/department") ? "department"
    : "student";
  return target === role ? next : home;
}