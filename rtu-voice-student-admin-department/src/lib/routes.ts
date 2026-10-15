import type { Role } from "./types";

/** Where each role lands after login (unified login: the account's role decides the portal). */
export function homeFor(role: Role): string {
  // The superadmin uses the same console as the admin, with extra pages.
  return role === "admin" || role === "superadmin" ? "/admin" : role === "department" ? "/department" : "/dashboard";
}
