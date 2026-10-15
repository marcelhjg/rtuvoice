import type { Role } from "./types";

/** Where each role lands after login (unified login: the account's role decides the portal). */
export function homeFor(role: Role): string {
  return role === "admin" ? "/admin" : role === "department" ? "/department" : "/dashboard";
}
