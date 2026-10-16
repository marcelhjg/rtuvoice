/**
 * DEMONSTRATION DATA ONLY.
 *
 * Nothing here comes from a server. The seed is generated in the browser on first load,
 * with dates relative to "now", so SLA timers (acknowledge / resolve / overdue) behave
 * realistically whenever the demo is opened. Titles and tracking IDs follow the sample
 * content shown in the Figma design.
 */
import {
  DEPARTMENTS,
  SLA,
  type ActivityEntry,
  type AdminAccount,
  type Account,
  type Category,
  type Complaint,
  type Department,
  type DepartmentAccount,
  type DepartmentRecord,
  type EvidenceFile,
  type Priority,
  type PublicConcern,
  type Status,
  type TimelineEvent,
} from "./types";

export const DEMO_STUDENT: Account = {
  firstName: "Juan",
  lastName: "Dela Cruz",
  email: "juan.cruz@rtu.edu.ph",
  role: "student",
};

/** The fixed password accepted by the simulated login in this demo build. */
export const DEMO_PASSWORD = "rtuvoice123";

/** The fixed one-time code accepted by every OTP screen in this demo build. */
export const DEMO_OTP = "123456";

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

/** Static sample shown on the public landing page (rendered before anyone logs in). */
export const LANDING_PREVIEW: PublicConcern[] = [
  { id: "l1", title: "Leaking ceiling in a Main Building classroom", summary: "", category: "Facilities & Infrastructure", status: "In Progress", date: "2026-03-12" },
  { id: "l2", title: "Delay in releasing requested documents", summary: "", category: "Administrative", status: "Assigned", date: "2026-03-11" },
  { id: "l3", title: "Broken ceiling fan in a Computer Lab", summary: "", category: "Facilities & Infrastructure", status: "Resolved", date: "2026-03-09" },
];

export function buildAdminAccounts(now: number): AdminAccount[] {
  const iso = (daysAgo: number) => new Date(now - daysAgo * DAY).toISOString();
  return [
    { firstName: "Central", lastName: "Admin", email: "admin@rtu.edu.ph", title: "Administrator", addedAt: iso(240), lastActiveAt: iso(0) },
    { firstName: "ICS", lastName: "Admin", email: "ics.admin@rtu.edu.ph", title: "Administrator", addedAt: iso(180), lastActiveAt: iso(1) },
    { firstName: "OSA", lastName: "Admin", email: "osa.admin@rtu.edu.ph", title: "Administrator", addedAt: iso(120), lastActiveAt: iso(6) },
  ];
}

/** SRS §3: a single superadmin account. It isn't listed with the admins and can't be deactivated. */
export const SUPERADMIN_ACCOUNT: Account = {
  firstName: "System",
  lastName: "Super Admin",
  email: "superadmin@rtu.edu.ph",
  role: "superadmin",
};

/** The departments the demo starts with, all active. */
export function buildDepartments(now: number): DepartmentRecord[] {
  const added = new Date(now - 240 * DAY).toISOString();
  return DEPARTMENTS.map((name) => ({ name, active: true, addedAt: added }));
}

/** Department-head logins for the demo: one per office (SRS: created by the superadmin, restricted to their own department). */
export const DEPARTMENT_ACCOUNTS: DepartmentAccount[] = [
  { firstName: "Facilities", lastName: "Head", email: "facilities@rtu.edu.ph", title: "Head of Facilities", department: "Facilities Office" },
  { firstName: "Registrar", lastName: "Head", email: "registrar@rtu.edu.ph", title: "Registrar", department: "Registrar's Office" },
  { firstName: "Academic", lastName: "Head", email: "academic@rtu.edu.ph", title: "Head of Academic Affairs", department: "Academic Affairs" },
  { firstName: "Student", lastName: "Affairs", email: "osa@rtu.edu.ph", title: "Head of Student Affairs", department: "Student Affairs" },
  { firstName: "Cashier", lastName: "Head", email: "cashier@rtu.edu.ph", title: "Head Cashier", department: "Cashier's Office" },
  { firstName: "ICT", lastName: "Head", email: "ict@rtu.edu.ph", title: "Head of ICT", department: "ICT Office" },
];

interface Seed {
  id: string;
  t: string; // title
  c: Category;
  s: Status;
  desc: string;
  d: number; // days ago submitted
  dept?: Department;
  p?: Priority;
  a?: number; // hours after submission that it was assigned (default 4)
  k?: number; // days after assignment that work started (In Progress / Resolved)
  r?: number; // days after assignment that it was resolved
  mine?: boolean;
  opt?: boolean; // opted out of the public dashboard
  files?: EvidenceFile[];
  upd?: { after: number; msg: string }[]; // department update messages, days after assignment
  rej?: string; // rejection reason
  re?: { from: Department; after: number; reason: string }; // reassignment, hours after first assignment
  by?: string; // admin who acted (default Central Admin)
}

const SEEDS: Seed[] = [
  // ---- Pending validation queue (Figma: admin dashboard) ----
  { id: "STU-C81QF", t: "Leaking ceiling near Room 305", c: "Facilities & Infrastructure", s: "Pending", d: 0.6, desc: "Water drips from the ceiling near Room 305 whenever it rains. The floor gets slippery and the seats near the window are always wet.", files: [{ name: "leak-photo.jpg", size: 1_887_437, type: "image/jpeg" }] },
  { id: "STU-9PZ2A", t: "Delay in releasing a requested school document", c: "Administrative", s: "Pending", d: 0.9, desc: "A certificate of enrollment requested two weeks ago has not been released and the window could not give a release date." },
  { id: "STU-T3D0K", t: "Unclear schedule changes for a major subject", c: "Academic", s: "Pending", d: 1.4, desc: "Class schedule changes for a major subject were announced only in a group chat the night before, and several students missed the class." },
  { id: "STU-H66LM", t: "Concern about an organization event process", c: "Student Life", s: "Pending", d: 1.8, desc: "The approval steps for organization events changed this semester but no updated guide was posted, so event requests are being returned." },
  { id: "STU-Q20WE", t: "Free ads posted on the campus page", c: "Other", s: "Pending", d: 2.6, desc: "Someone keeps posting advertisements for an online store in the comments of the campus page." },

  // ---- Assigned ----
  { id: "STU-4KD7P", t: "Broken ceiling fan in a Computer Lab", c: "Facilities & Infrastructure", s: "Assigned", dept: "Facilities Office", p: "High", d: 0.5, a: 3, desc: "A ceiling fan in a computer lab stopped working, making the room very hot during afternoon classes." },
  { id: "STU-77MZP", t: "Request for extra sections of a major subject", c: "Academic", s: "Assigned", dept: "Academic Affairs", p: "Medium", d: 19, a: 20, mine: true, opt: true, desc: "Many students in our year level could not enlist in a required major subject because all sections were full." },
  { id: "STU-K4M7R", t: "Broken air conditioning in the library", c: "Facilities & Infrastructure", s: "Assigned", dept: "Facilities Office", p: "High", d: 2.2, desc: "Two air-conditioning units in the library reading area have not worked for a week.", re: { from: "ICT Office", after: 2, reason: "Mistaken assignment: air-conditioning units are maintained by the Facilities Office." } },
  { id: "STU-L08VT", t: "Water shortage in the second floor restroom", c: "Facilities & Infrastructure", s: "Assigned", dept: "Facilities Office", p: "High", d: 3.1, desc: "The second-floor restroom has had no running water since Monday." },
  { id: "STU-R6E2H", t: "Request for updated enrollment schedule", c: "Administrative", s: "Assigned", dept: "Registrar's Office", p: "Medium", d: 3.4, desc: "The posted enrollment schedule still shows last semester's dates." },
  { id: "STU-W5J3C", t: "Unfair scheduling of organization booth", c: "Student Life", s: "Assigned", dept: "Student Affairs", p: "Low", d: 4.2, desc: "Booth slots for the organization fair were given out before all organizations were informed." },
  { id: "STU-N3P8Z", t: "Missing records in the student portal", c: "Administrative", s: "Assigned", dept: "Registrar's Office", p: "Medium", d: 4.6, desc: "Grades from a completed subject do not appear in the student portal." },
  { id: "STU-D91YB", t: "Slow response to scholarship inquiry", c: "Academic", s: "Assigned", dept: "Academic Affairs", p: "Low", d: 5.3, desc: "Questions sent about scholarship requirements have not been answered for over a week." },
  { id: "STU-G47QS", t: "Noise from construction during class hours", c: "Facilities & Infrastructure", s: "Assigned", dept: "Facilities Office", p: "Medium", d: 5.8, desc: "Drilling from the construction site next to the annex makes lectures hard to hear." },
  { id: "STU-M20KU", t: "Incorrect tuition balance shown", c: "Administrative", s: "Assigned", dept: "Cashier's Office", p: "High", d: 9.2, desc: "The assessment shows a remaining balance even though full payment was made at the cashier." },

  // ---- In Progress ----
  { id: "STU-A3F1B", t: "Leaking ceiling in a Main Building classroom", c: "Facilities & Infrastructure", s: "In Progress", dept: "Facilities Office", p: "High", d: 3, a: 5, k: 0.85, mine: true, desc: "The ceiling of Room 305 in the Main Building leaks whenever it rains. Water drips onto the seats near the windows and the floor gets slippery.", files: [{ name: "leak-photo.jpg", size: 1_887_437, type: "image/jpeg" }], upd: [{ after: 0.85, msg: "Our maintenance team inspected the area and found the cause of the leak. Repair is scheduled for this week. We will post another update once it is done." }] },
  { id: "STU-B72XD", t: "Late grade posting for midterm exams", c: "Academic", s: "In Progress", dept: "Academic Affairs", p: "Medium", d: 7, k: 1, desc: "Midterm grades for some sections were posted later than the announced date.", upd: [{ after: 1.2, msg: "We have reminded the concerned faculty and will post the remaining grades this week." }] },
  { id: "STU-V15ZT", t: "Damaged chairs in Room 210", c: "Facilities & Infrastructure", s: "In Progress", dept: "Facilities Office", p: "Low", d: 8, k: 3, desc: "Several armchairs in Room 210 have broken backrests." },
  { id: "STU-J63RA", t: "Delay in processing of ID replacement", c: "Administrative", s: "In Progress", dept: "Registrar's Office", p: "Medium", d: 8.5, k: 1, desc: "Replacement school IDs are taking longer than students were told.", re: { from: "Student Affairs", after: 3, reason: "ID replacement is processed by the Registrar's Office." } },
  { id: "STU-Y28CE", t: "Unsafe wiring near the engineering lab", c: "Facilities & Infrastructure", s: "In Progress", dept: "Facilities Office", p: "High", d: 9.5, k: 1, desc: "Exposed electrical wires hang from the ceiling outside the engineering lab." },
  { id: "STU-P84LF", t: "Unclear requirements for thesis defense", c: "Academic", s: "In Progress", dept: "Academic Affairs", p: "Medium", d: 10, k: 2, desc: "Students received different lists of thesis defense requirements from different offices." },
  { id: "STU-S09HW", t: "Rude response at the registrar window", c: "Administrative", s: "In Progress", dept: "Registrar's Office", p: "Low", d: 10.5, k: 4, opt: true, desc: "A student was spoken to rudely while asking about a document request." },
  { id: "STU-E37MO", t: "Broken water fountain at the quadrangle", c: "Facilities & Infrastructure", s: "In Progress", dept: "Facilities Office", p: "Low", d: 11, k: 3, desc: "The drinking fountain at the quadrangle has not worked for two weeks." },
  { id: "STU-A52DK", t: "Concern about organization fund liquidation", c: "Student Life", s: "In Progress", dept: "Student Affairs", p: "Medium", d: 12, k: 2, opt: true, desc: "Organizations are unsure how to liquidate funds from last semester's activities." },
  { id: "STU-Q31LN", t: "Long cafeteria queues at lunch", c: "Student Life", s: "In Progress", dept: "Student Affairs", p: "Low", d: 13, k: 4, desc: "Queues at the cafeteria during the lunch break are long enough to cut into class time." },

  // ---- Resolved ----
  { id: "STU-F19NA", t: "Long queue at the cashier window", c: "Administrative", s: "Resolved", dept: "Cashier's Office", p: "Low", d: 22, k: 2, r: 6, desc: "Only one cashier window is open during payment week, causing very long queues." },
  { id: "STU-U40XB", t: "Lost and found items not returned", c: "Student Life", s: "Resolved", dept: "Student Affairs", p: "Low", d: 27, k: 3, r: 9, desc: "Students are not sure where found items are kept or how to claim them." },
  { id: "STU-C76GN", t: "Incorrect subject listed in the schedule", c: "Academic", s: "Resolved", dept: "Registrar's Office", p: "Medium", d: 31, k: 1, r: 5, desc: "A subject in the official class schedule has the wrong course code." },
  { id: "STU-H12TQ", t: "Flickering lights in the gymnasium", c: "Facilities & Infrastructure", s: "Resolved", dept: "Facilities Office", p: "Medium", d: 36, k: 2, r: 8, desc: "Several lights in the gymnasium flicker throughout PE classes." },
  { id: "STU-X58WP", t: "Broken door lock in the computer lab", c: "Facilities & Infrastructure", s: "Resolved", dept: "Facilities Office", p: "High", d: 38, k: 0.5, r: 4, desc: "The computer lab door cannot be locked, so equipment is left unsecured." },
  { id: "STU-K92QD", t: "Delay in releasing a requested school document", c: "Administrative", s: "Resolved", dept: "Registrar's Office", p: "Medium", d: 41, a: 5, k: 1, r: 5, mine: true, desc: "I requested a copy of my certificate of grades three weeks ago and it has not been released yet. The window staff could not give a date.", upd: [{ after: 5, msg: "Your document is ready for pick-up at the Registrar's window. Please bring your school ID. We have also added a processing-time notice at the window." }] },
  { id: "STU-Z31JE", t: "Delayed release of clearance form", c: "Administrative", s: "Resolved", dept: "Registrar's Office", p: "Medium", d: 48, k: 2, r: 7, desc: "End-of-term clearance forms were released late, delaying enrollment." },
  { id: "STU-T90AL", t: "Overcrowded enrollment area", c: "Administrative", s: "Resolved", dept: "Registrar's Office", p: "Low", d: 55, k: 4, r: 24, desc: "The enrollment area is too small for the number of students on peak days." },
  { id: "STU-M5T8C", t: "Unclear process for organization accreditation", c: "Student Life", s: "Resolved", dept: "Student Affairs", p: "Low", d: 62, a: 5, k: 2, r: 8, mine: true, desc: "Our student organization could not find the current accreditation steps and deadlines anywhere online or on the bulletin boards.", upd: [{ after: 8, msg: "The accreditation guide and this semester's deadlines are now posted on the OSA bulletin board and the official RTU-Pasig page." }] },
  { id: "STU-O24RC", t: "Unclear grading policy in a subject", c: "Academic", s: "Resolved", dept: "Academic Affairs", p: "Medium", d: 70, k: 2, r: 10, desc: "The grading breakdown for a subject was not shared at the start of the term." },
  { id: "STU-W27FA", t: "Unreliable Wi-Fi in the library reading area", c: "Facilities & Infrastructure", s: "Resolved", dept: "ICT Office", p: "Medium", d: 78, k: 1, r: 6, desc: "The Wi-Fi connection in the library reading area drops frequently during peak hours." },
  { id: "STU-D33WR", t: "Faulty water dispenser on 3rd floor", c: "Facilities & Infrastructure", s: "Resolved", dept: "Facilities Office", p: "Low", d: 86, k: 2, r: 5, desc: "The water dispenser on the 3rd floor is not dispensing cold water." },
  { id: "STU-L46GM", t: "Late release of midterm grades", c: "Academic", s: "Resolved", dept: "Academic Affairs", p: "Medium", d: 95, k: 1, r: 9, desc: "Midterm grades for a block section were posted two weeks after the deadline." },
  { id: "STU-R58CP", t: "Broken comfort room door lock", c: "Facilities & Infrastructure", s: "Resolved", dept: "Facilities Office", p: "High", d: 104, k: 0.5, r: 3, desc: "A comfort room door on the 2nd floor cannot be locked from the inside." },
  { id: "STU-G62HS", t: "Outdated software in a computer laboratory", c: "Academic", s: "Resolved", dept: "ICT Office", p: "Medium", d: 118, k: 2, r: 12, desc: "Lab computers do not have the software version required by a course." },
  { id: "STU-P75TV", t: "No shaded waiting area near the gate", c: "Student Life", s: "Resolved", dept: "Facilities Office", p: "Low", d: 131, k: 4, r: 18, desc: "Students waiting for rides near the gate have no shade during the afternoon." },
  { id: "STU-B83KY", t: "Long processing time for ID replacement", c: "Administrative", s: "Resolved", dept: "Registrar's Office", p: "Medium", d: 146, k: 2, r: 11, desc: "Replacement school IDs took more than a month to release." },
  { id: "STU-N91QE", t: "Announcements spread across too many pages", c: "Other", s: "Resolved", dept: "Student Affairs", p: "Low", d: 162, k: 3, r: 14, desc: "Official announcements are posted on several pages, making them easy to miss." },

  // ---- Rejected ----
  { id: "STU-B04XR", t: "Unrelated advertisement posted on the system", c: "Other", s: "Rejected", d: 6, mine: true, rej: "Not a campus concern. Advertisements and spam are not accepted.", desc: "Sample rejected submission used to demonstrate the Rejected state." },
  { id: "STU-V22TK", t: "Selling tickets for a private concert", c: "Other", s: "Rejected", d: 9, rej: "Promotions for private events are not accepted.", desc: "Tickets for a private concert are available, message me for details." },
  { id: "STU-H08PD", t: "Leaking ceiling in Room 305 again", c: "Facilities & Infrastructure", s: "Rejected", d: 2.4, rej: "Duplicate of an existing report that is already being handled by the Facilities Office.", desc: "The ceiling in Room 305 is leaking again during the rain.", by: "ICS Admin" },
];

/** Build complaints + activity log with timestamps relative to `now`. */
export function buildSeed(now: number): { complaints: Complaint[]; activity: ActivityEntry[] } {
  const activity: ActivityEntry[] = [];
  const clamp = (t: number) => Math.min(t, now - 5 * 60 * 1000);
  const iso = (t: number) => new Date(clamp(t)).toISOString();
  let n = 0;
  const log = (e: Omit<ActivityEntry, "id">) => activity.push({ ...e, id: `act-${++n}` });

  const complaints = SEEDS.map((s, i): Complaint => {
    // Stagger submissions across office hours so rows don't share identical times.
    const submitted = now - s.d * DAY - ((i * 53) % 300) * 60 * 1000;
    const timeline: TimelineEvent[] = [{ status: "Pending", label: "Submitted", at: iso(submitted) }];
    const actor = s.by ?? "Central Admin";
    const c: Complaint = {
      trackingId: s.id,
      title: s.t,
      category: s.c,
      description: s.desc,
      submittedAt: iso(submitted),
      status: s.s,
      mine: !!s.mine,
      optOutOfPublic: !!s.opt,
      files: s.files ?? [],
      timeline,
      updates: [],
    };

    if (s.s === "Rejected") {
      const at = iso(submitted + 20 * HOUR);
      c.rejectedAt = at;
      c.rejectionReason = s.rej;
      timeline.push({ status: "Rejected", label: "Rejected by an administrator", at });
      log({ at, actor, actorRole: "Admin", action: "Rejected", trackingId: s.id, detail: s.rej });
      return c;
    }
    if (s.s === "Pending" || !s.dept || !s.p) return c;

    // Assigned (assigning = approval; triggers the AI priority + public summary)
    let assigned = submitted + (s.a ?? 4) * HOUR;
    if (s.re) {
      const first = iso(assigned);
      timeline.push({ status: "Assigned", label: `Approved and assigned to ${s.re.from}`, at: first });
      log({ at: first, actor, actorRole: "Admin", action: "Assigned", trackingId: s.id, department: s.re.from, detail: `AI priority: ${s.p}` });
      assigned = assigned + s.re.after * HOUR;
      const at = iso(assigned);
      timeline.push({ status: "Assigned", label: `Reassigned to ${s.dept}`, at });
      log({ at, actor, actorRole: "Admin", action: "Reassigned", trackingId: s.id, department: s.dept, detail: `From ${s.re.from}. ${s.re.reason}` });
    } else {
      const at = iso(assigned);
      timeline.push({ status: "Assigned", label: `Approved and assigned to ${s.dept}`, at });
      log({ at, actor, actorRole: "Admin", action: "Assigned", trackingId: s.id, department: s.dept, detail: `AI priority: ${s.p}` });
    }
    c.department = s.dept;
    c.priority = s.p;
    c.assignedAt = iso(assigned);
    if (!s.opt) {
      c.aiTitle = s.t;
      c.aiSummary = firstSentence(s.desc);
    }

    if (s.s === "In Progress" || s.s === "Resolved") {
      const at = iso(assigned + (s.k ?? 1) * DAY);
      c.acknowledgedAt = at;
      timeline.push({ status: "In Progress", label: "In Progress", at });
      log({ at, actor: s.dept, actorRole: "Department", action: "Status changed", trackingId: s.id, department: s.dept, detail: "Assigned → In Progress" });
    }
    for (const u of s.upd ?? []) {
      const at = iso(assigned + u.after * DAY + 10 * 60 * 1000);
      c.updates.push({ department: s.dept, at, message: u.msg });
    }
    if (s.s === "Resolved") {
      const at = iso(assigned + (s.r ?? 5) * DAY);
      c.resolvedAt = at;
      timeline.push({ status: "Resolved", label: "Resolved", at });
      log({ at, actor: s.dept, actorRole: "Department", action: "Status changed", trackingId: s.id, department: s.dept, detail: "In Progress → Resolved" });
    }
    return c;
  });

  activity.sort((a, b) => b.at.localeCompare(a.at));
  return { complaints, activity };
}

export function firstSentence(text: string, max = 150): string {
  const s = text.trim().split(/(?<=[.!?])\s/)[0] ?? text;
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

/** Days to acknowledge / resolve for a priority (re-exported for convenience). */
export { SLA };
