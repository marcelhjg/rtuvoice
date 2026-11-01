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
    student: "/student/",
    admin: "/admin/",
    department: "/department/",
    superAdmin: "/superAdmin/"
};

export type CurrentUser = {
    id: string;
    email: string | undefined;
    role: Role;
    departmentId: number | null; // only meaningful for the department role
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
        .select("role_id, department_id")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError || !profile) return null;

    const role = ROLE_BY_ID[profile.role_id];
    if (!role) return null;

    return {
        id: user.id,
        email: user.email,
        role,
        departmentId: profile.department_id ?? null,
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