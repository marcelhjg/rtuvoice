import { createClient } from "@supabase/supabase-js";

const { NEXT_PUBLIC_SUPABASE_URL: URL, SUPABASE_ANON_KEY: ANON, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: SERVICE } = process.env;
const PASSWORD = "Rtuvoice123";
const USERS = {
  student:    "t.student@rtu.edu.ph",
  admin:      "t.admin@rtu.edu.ph",
  department: "t.depta@rtu.edu.ph",
  superadmin: "t.super@rtu.edu.ph",
};

const svc = createClient(URL, SERVICE);
const { data: list } = await svc.auth.admin.listUsers({ perPage: 1000 });
for (const email of Object.values(USERS)) {
  const f = list.users.find((x) => x.email === email);
  if (!f) throw new Error(`Missing ${email}`);
  await svc.auth.admin.updateUserById(f.id, { password: PASSWORD });
}

async function clientFor(role) {
  const c = createClient(URL, ANON, { auth: { persistSession: false } });
  if (role !== "anon") {
    const { error } = await c.auth.signInWithPassword({ email: USERS[role], password: PASSWORD });
    if (error) throw error;
  }
  return c;
}

const Z = "00000000-0000-0000-0000-000000000000";
const ALL = ["student", "admin", "department", "superadmin"];
const MATRIX = [
  ["submit_complaint", { p_title: "t", p_description: "d", p_category_id: 1 }, ["student"]],
  ["get_my_complaints", {}, ALL],
  ["assign_complaint", { p_complaint_id: Z, p_department_id: 1 }, ["admin"]],
  ["reject_complaint", { p_complaint_id: Z, p_reason: "r" }, ["admin"]],
  ["get_pending_validation_queue", {}, ["admin"]],
  ["get_master_tracking_queue", {}, ["admin"]],
  ["get_complaints_admin", {}, ["admin"]],
  ["get_complaint_details_admin", { p_tracking_id: "X" }, ["admin"]],
  ["get_admin_dashboard_stats", {}, ["admin"]],
  ["update_complaint_status", { p_complaint_id: Z, p_new_status: "in_progress" }, ["department"]],
  ["add_complaint_update", { p_complaint_id: Z, p_message: "m" }, ["department"]],
  ["return_complaint", { p_complaint_id: Z, p_reason: "r" }, ["department"]],
  ["get_complaints_department", {}, ["department"]],
  ["get_complaint_details_department", { p_tracking_id: "X" }, ["department"]],
  ["get_needs_attention_department", {}, ["department"]],
  ["get_department_dashboard_stats", {}, ["department"]],
  ["get_complaint_updates", { p_complaint_id: Z }, ["admin", "department"]],
  ["get_complaint_counts", {}, ["admin", "department"]],
  ["get_public_complaints", {}, ALL],
  ["get_recent_resolved_public", {}, ALL],
  ["get_staff_accounts", {}, ["superadmin"]],
  ["get_department_accounts", {}, ["superadmin"]],
  ["get_admin_accounts", {}, ["superadmin"]],
  ["get_activity_log", {}, ["superadmin"]],
  ["set_account_active", { p_user_id: Z, p_is_active: true }, ["superadmin"]],
  ["set_department_active", { p_department_id: 1, p_is_active: true }, ["superadmin"]],
  ["rename_account", { p_user_id: Z, p_first_name: "a", p_last_name: "b" }, ["superadmin"]],
  ["rename_department", { p_department_id: 1, p_name: "x" }, ["superadmin"]],
];

let failures = 0;
for (const role of ["anon", ...Object.keys(USERS)]) {
  const c = await clientFor(role);
  for (const [fn, args, allowed] of MATRIX) {
    const { error } = await c.rpc(fn, args);
    // anon is blocked by REVOKE (42501 or "permission denied"), wrong roles by the function (42501)
    const denied = error?.code === "42501";
    if (allowed.includes(role) === denied) {
      failures++;
      console.log(`FAIL ${role.padEnd(10)} ${fn}: got ${error?.code ?? "ok"} ${error?.message ?? ""}`);
    }
  }
}
console.log(failures ? `${failures} failure(s)` : "All permission checks passed");

const s = await clientFor("student");
const me = list.users.find((x) => x.email === USERS.student).id;

console.log("escalate role:", (await s.from("users").update({ role_id: 4 }).eq("id", me)).error?.message ?? "no error (check the row!)");
console.log("deactivate self:", (await s.from("users").update({ is_active: false }).eq("id", me)).error?.message ?? "no error (check the row!)");
console.log("complaints read:", (await s.from("complaints").select("id")).data?.length);
console.log("activity log read:", (await s.from("complaint_activity_log").select("id")).data?.length);
console.log("force-resolve:", (await s.from("complaints").update({ status_id: 4 }).eq("tracking_id", "ZZ-P1")).error?.message ?? "no error (check the row!)");

const anon = await clientFor("anon");
console.log("anon users read:", (await anon.from("users").select("*")).data?.length);

const { data: row } = await svc.from("users").select("role_id,is_active").eq("id", me).single();
console.log("student row after attacks:", row); // must still be role_id 1, is_active true
