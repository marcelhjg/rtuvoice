import { createClient } from "@supabase/supabase-js";
import { randomInt } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

// Service role: bypasses RLS. Only ever used here, on your own machine.
const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const ROLE = { admin: 2, department: 3, superadmin: 4 };

// Edit this list. A department account needs the id of an existing departments row.
const ACCOUNTS = [
  { email: "admin@rtu.edu.ph", firstName: "Juan", lastName: "Dela Cruz", role: "admin" },
  { email: "sfau@rtu.edu.ph", firstName: "Maria", lastName: "Santos", role: "department", departmentId: 1 },
  { email: "superadmin@rtu.edu.ph", firstName: "Pedro", lastName: "Reyes", role: "superadmin" },
];

// 14 characters with an uppercase letter, a lowercase letter and a digit (matches the password policy).
// function randomPassword() {
//   const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
//   const lower = "abcdefghijkmnpqrstuvwxyz";
//   const digits = "23456789";
//   const all = upper + lower + digits;
//   const pick = (s) => s[randomInt(s.length)];
//   const chars = [pick(upper), pick(lower), pick(digits)];
//   while (chars.length < 14) chars.push(pick(all));
//   for (let i = chars.length - 1; i > 0; i--) {
//     const j = randomInt(i + 1);
//     [chars[i], chars[j]] = [chars[j], chars[i]];
//   }
//   return chars.join("");
// }

for (const a of ACCOUNTS) {
  const email = a.email.trim().toLowerCase();

  if (!ROLE[a.role]) {
    console.error(`${email}: unknown role "${a.role}"`);
    continue;
  }
  if (a.role === "department" && !a.departmentId) {
    console.error(`${email}: department accounts need a departmentId`);
    continue;
  }

  const password = "Rtuvoice123";

  // 1) the login. The names go in user_metadata so the handle_new_user trigger can use them.
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: a.firstName, last_name: a.lastName },
  });
  if (error) {
    console.error(`${email}: could not create the login -> ${error.message}`);
    continue;
  }

  // 2) the role. Upsert, so it works whether or not the trigger already made the row.
  const { error: profileError } = await admin.from("users").upsert(
    {
      id: data.user.id,
      first_name: a.firstName,
      last_name: a.lastName,
      rtu_email: email,
      role_id: ROLE[a.role],
      department_id: a.role === "department" ? a.departmentId : null,
      is_active: true,
    },
    { onConflict: "id" }
  );
  if (profileError) {
    console.error(`${email}: login created, but setting the role failed -> ${profileError.message}`);
    continue;
  }

  console.log(`${email} (${a.role}) created. Temporary password: ${password}`);
}