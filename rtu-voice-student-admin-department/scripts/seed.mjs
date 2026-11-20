import { createClient } from "@supabase/supabase-js";

const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
const PASSWORD = process.env.TEST_PASSWORD;

// pick two DIFFERENT existing department ids (select id, name from departments;)
const DEPT_A = 3, DEPT_B = 2;

const SEED = [
  { email: "t.student@rtu.edu.ph",  first: "Stu",   last: "One",   role_id: 1 },
  { email: "t.student2@rtu.edu.ph", first: "Stu",   last: "Two",   role_id: 1 },
  { email: "t.admin@rtu.edu.ph",    first: "Ad",    last: "Min",   role_id: 2 },
  { email: "t.deptA@rtu.edu.ph",    first: "Dept",  last: "A",     role_id: 3, department_id: DEPT_A },
  { email: "t.deptB@rtu.edu.ph",    first: "Dept",  last: "B",     role_id: 3, department_id: DEPT_B },
  { email: "t.super@rtu.edu.ph",    first: "Super", last: "Admin", role_id: 4 },
];

for (const u of SEED) {
  const { data, error } = await svc.auth.admin.createUser({
    email: u.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { first_name: u.first, last_name: u.last },
  });
  if (error) { console.log("SKIP/FAIL", u.email, error.message); continue; }

  // the trigger made a role 1 row; promote it
  const { error: e2 } = await svc.from("users")
    .update({ role_id: u.role_id, department_id: u.department_id ?? null, is_active: true })
    .eq("id", data.user.id);
  console.log(e2 ? `FAIL profile ${u.email}: ${e2.message}` : `OK ${u.email}  ${data.user.id}`);
}