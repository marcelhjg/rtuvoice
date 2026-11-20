"use client";
import { useState } from "react";
import { validateAndloginUser } from "@/actions/authActions";
import { assignComplaint, rejectComplaint } from "@/actions/adminActions";
import { updateComplaintStatus, addComplaintUpdate, returnComplaint } from "@/actions/departmentActions";
import { submitComplaint } from "@/actions/studentActions";

const toFd = (o: Record<string, string>) => {
  const f = new FormData();
  Object.entries(o).forEach(([k, v]) => f.set(k, String(v)));
  return f;
};

const ACTIONS: Record<string, (a: any) => Promise<any>> = {
  login: (a) => validateAndloginUser(toFd(a)),
  assign: (a) => assignComplaint(toFd(a)),
  reject: (a) => rejectComplaint(toFd(a)),
  submit: (a) => submitComplaint(toFd(a)),
  status: (a) => updateComplaintStatus(a.id, a.status),
  to_in_progress: (a) => updateComplaintStatus(a.id, "in_progress"),
  to_resolved: (a) => updateComplaintStatus(a.id, "resolved"),
  update: (a) => addComplaintUpdate(a.id, a.message),
  return: (a) => returnComplaint(a.id, a.reason),
};

// Use COMPLAINT ids (not user ids):
//   select id, tracking_id, status_id, department_id from complaints order by created_at desc limit 10;
const EXAMPLES: Record<string, string> = {
  login: '{"email":"t.admin@rtu.edu.ph","password":"Rtuvoice123"}',
  assign: '{"complaint_id":"12e2975f-a563-4cca-b304-64e21a63ba98","department_id":"1","action":"assign","reason":""}',
  reject: '{"complaint_id":"eda85faa-4220-47a9-bf35-4a9bee5351f9","reason":"Duplicate report"}',
  submit: '{"title":"Broken aircon in Room 101","description":"The aircon in Room 101 has not worked for a week.","categories":"1","privacy_setting":"public"}',
  status: '{"id":"12e2975f-a563-4cca-b304-64e21a63ba98","status":"in_progress"}',
  to_in_progress: '{"id":"12e2975f-a563-4cca-b304-64e21a63ba98"}',
  to_resolved: '{"id":"12e2975f-a563-4cca-b304-64e21a63ba98"}',
  update: '{"id":"12e2975f-a563-4cca-b304-64e21a63ba98","message":"We are checking this."}',
  return: '{"id":"12e2975f-a563-4cca-b304-64e21a63ba98","reason":"Not our department"}',
};

export default function Harness() {
  const [name, setName] = useState("login");
  const [args, setArgs] = useState(EXAMPLES.login);
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);

  if (process.env.NODE_ENV === "production") return null;

  const run = async () => {
    setBusy(true);
    try {
      const res = await ACTIONS[name](JSON.parse(args));
      setOut(JSON.stringify(res, null, 2));
    } catch (e: any) {
      setOut("HARNESS ERROR: " + (e?.message ?? String(e)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <select
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setArgs(EXAMPLES[e.target.value] ?? "{}");
          setOut("");
        }}
      >
        {Object.keys(ACTIONS).map((k) => <option key={k}>{k}</option>)}
      </select>
      <textarea
        style={{ width: "100%", height: 140, fontFamily: "monospace" }}
        value={args}
        onChange={(e) => setArgs(e.target.value)}
      />
      <button onClick={run} disabled={busy}>{busy ? "Running..." : "Run"}</button>
      <pre>{out}</pre>
    </div>
  );
}