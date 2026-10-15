"use client";

/**
 * SIMULATED BACKEND — DEMO ONLY.
 *
 * This provider stands in for the Supabase/RPC layer described in the SRS. State lives
 * in the browser's localStorage so both portals can be tested end to end, and the student
 * and admin portals share the same complaint list (an admin assigning a complaint shows
 * up on the student's Status Tracker).
 *
 * No request leaves the browser: there is no real authentication, no email/OTP delivery,
 * no file upload, no AI call and no complaint processing.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEMO_OTP, DEMO_STUDENT, DEPARTMENT_ACCOUNTS, buildAdminAccounts, buildSeed, firstSentence } from "./demo-data";
import { simulatePriority } from "./sla";
import type { Account, ActivityEntry, AdminAccount, Category, Complaint, Department, DepartmentStatus, EvidenceFile, Priority, PublicConcern } from "./types";
import { nextDepartmentStatus } from "./types";
import { generateTrackingId, normalizeTrackingId } from "./validation";

const STORAGE_KEY = "rtu-voice-demo-v2";

interface PersistedState {
  session: Account | null;
  student: Account; // the registered demo student
  admins: AdminAccount[];
  complaints: Complaint[];
  activity: ActivityEntry[];
  pendingSignup: Account | null;
  resetEmail: string | null;
  resetVerified: boolean;
}

export interface NewComplaintInput {
  title: string;
  category: Category;
  description: string;
  files: EvidenceFile[];
  optOutOfPublic: boolean;
}

interface DemoStore extends PersistedState {
  ready: boolean;
  /** Complaints submitted by the signed-in student. */
  myComplaints: Complaint[];
  /** Released, depersonalized entries for the Public Dashboard. */
  publicConcerns: PublicConcern[];
  login(email: string): Account;
  logout(): void;
  isAdminEmail(email: string): boolean;
  startSignup(account: Omit<Account, "role">): void;
  verifyCode(code: string): boolean;
  completeSignup(): Account | null;
  startReset(email: string): void;
  markResetVerified(): void;
  finishReset(): void;
  updateProfile(firstName: string, lastName: string): void;
  submitComplaint(input: NewComplaintInput): Complaint;
  findMyComplaint(trackingId: string): Complaint | undefined;
  findComplaint(trackingId: string): Complaint | undefined;
  // Admin actions
  assignComplaint(trackingId: string, department: Department): Priority;
  rejectComplaint(trackingId: string, reason: string): void;
  reassignComplaint(trackingId: string, department: Department, reason: string): boolean;
  // Department-head actions (only for complaints assigned to the signed-in department)
  /** Complaints assigned to the signed-in department (approved ones only; empty for other roles). */
  departmentComplaints: Complaint[];
  updateDepartmentStatus(trackingId: string, status: DepartmentStatus): boolean;
  addDepartmentUpdate(trackingId: string, message: string): boolean;
  resetDemo(): void;
}

const Ctx = createContext<DemoStore | null>(null);

function fresh(): PersistedState {
  const now = Date.now();
  const { complaints, activity } = buildSeed(now);
  return {
    session: null,
    student: DEMO_STUDENT,
    admins: buildAdminAccounts(now),
    complaints,
    activity,
    pendingSignup: null,
    resetEmail: null,
    resetVerified: false,
  };
}

function load(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (Array.isArray(parsed.complaints) && Array.isArray(parsed.activity)) return { ...fresh(), ...parsed };
    }
  } catch {
    /* fall through to a fresh seed */
  }
  return fresh();
}

const EMPTY: PersistedState = {
  session: null,
  student: DEMO_STUDENT,
  admins: [],
  complaints: [],
  activity: [],
  pendingSignup: null,
  resetEmail: null,
  resetVerified: false,
};

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(EMPTY);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage unavailable (private mode): state still works for this tab */
    }
  }, [state, ready]);

  const adminByEmail = useCallback(
    (email: string) => state.admins.find((a) => a.email.toLowerCase() === email.trim().toLowerCase()),
    [state.admins],
  );

  const login = useCallback(
    (email: string) => {
      const normalized = email.trim().toLowerCase();
      const admin = adminByEmail(normalized);
      const head = DEPARTMENT_ACCOUNTS.find((d) => d.email === normalized);
      let account: Account;
      if (head) {
        account = { firstName: head.firstName, lastName: head.lastName, email: head.email, role: "department", department: head.department };
      } else if (admin) {
        account = { firstName: admin.firstName, lastName: admin.lastName, email: admin.email, role: "admin" };
      } else if (normalized === state.student.email.toLowerCase()) {
        account = state.student;
      } else {
        // Simulated: any other valid RTU email signs in as a student with a name derived from the address.
        const local = normalized.split("@")[0].split(/[._-]/);
        account = { firstName: capitalize(local[0] || "Student"), lastName: capitalize(local[1] || ""), email: normalized, role: "student" };
      }
      setState((s) => ({
        ...s,
        session: account,
        student: account.role === "student" ? account : s.student,
        admins: admin
          ? s.admins.map((a) => (a.email === admin.email ? { ...a, lastActiveAt: new Date().toISOString() } : a))
          : s.admins,
      }));
      return account;
    },
    [adminByEmail, state.student],
  );

  const logout = useCallback(() => setState((s) => ({ ...s, session: null })), []);
  // Staff emails (admin or department head) cannot be used to register a student account.
  const isAdminEmail = useCallback(
    (email: string) => !!adminByEmail(email) || DEPARTMENT_ACCOUNTS.some((d) => d.email === email.trim().toLowerCase()),
    [adminByEmail],
  );

  const startSignup = useCallback((account: Omit<Account, "role">) => {
    setState((s) => ({ ...s, pendingSignup: { ...account, email: account.email.trim().toLowerCase(), role: "student" } }));
  }, []);

  const verifyCode = useCallback((code: string) => code === DEMO_OTP, []);

  const completeSignup = useCallback(() => {
    const created = state.pendingSignup;
    if (!created) return null;
    setState((s) => ({ ...s, student: created, session: created, pendingSignup: null }));
    return created;
  }, [state.pendingSignup]);

  const startReset = useCallback((email: string) => {
    setState((s) => ({ ...s, resetEmail: email.trim().toLowerCase(), resetVerified: false }));
  }, []);
  const markResetVerified = useCallback(() => setState((s) => ({ ...s, resetVerified: true })), []);
  const finishReset = useCallback(() => setState((s) => ({ ...s, resetEmail: null, resetVerified: false })), []);

  const updateProfile = useCallback((firstName: string, lastName: string) => {
    setState((s) => {
      if (!s.session) return s;
      const session = { ...s.session, firstName: firstName.trim(), lastName: lastName.trim() };
      return {
        ...s,
        session,
        student: session.role === "student" ? session : s.student,
        admins: s.admins.map((a) => (a.email === session.email ? { ...a, firstName: session.firstName, lastName: session.lastName } : a)),
      };
    });
  }, []);

  const submitComplaint = useCallback(
    (input: NewComplaintInput) => {
      const now = new Date().toISOString();
      const trackingId = generateTrackingId(new Set(state.complaints.map((c) => c.trackingId)));
      const complaint: Complaint = {
        trackingId,
        title: input.title.trim(),
        category: input.category,
        description: input.description.trim(),
        submittedAt: now,
        status: "Pending",
        mine: true,
        optOutOfPublic: input.optOutOfPublic,
        files: input.files,
        timeline: [{ status: "Pending", label: "Submitted", at: now }],
        updates: [],
      };
      setState((s) => ({ ...s, complaints: [complaint, ...s.complaints] }));
      return complaint;
    },
    [state.complaints],
  );

  const findComplaint = useCallback(
    (trackingId: string) => {
      const id = normalizeTrackingId(trackingId);
      return state.complaints.find((c) => c.trackingId === id);
    },
    [state.complaints],
  );
  const findMyComplaint = useCallback(
    (trackingId: string) => {
      const c = findComplaint(trackingId);
      return c?.mine ? c : undefined;
    },
    [findComplaint],
  );

  const actorName = state.session ? `${state.session.firstName} ${state.session.lastName}`.trim() : "Admin";

  const patch = (
    trackingId: string,
    fn: (c: Complaint) => Complaint,
    entry: Omit<ActivityEntry, "id" | "at" | "actor" | "actorRole">,
    by: { actor: string; actorRole: ActivityEntry["actorRole"] } = { actor: actorName, actorRole: "Admin" },
  ) => {
    const at = new Date().toISOString();
    setState((s) => ({
      ...s,
      complaints: s.complaints.map((c) => (c.trackingId === trackingId ? fn(c) : c)),
      activity: [{ ...entry, id: `act-${Date.now()}`, at, actor: by.actor, actorRole: by.actorRole }, ...s.activity],
    }));
    return at;
  };

  const assignComplaint = useCallback(
    (trackingId: string, department: Department) => {
      const target = state.complaints.find((c) => c.trackingId === trackingId);
      // SIMULATED AI step: priority + depersonalized public title/summary.
      const priority = target ? simulatePriority(target) : "Low";
      const at = new Date().toISOString();
      patch(
        trackingId,
        (c) => ({
          ...c,
          status: "Assigned",
          department,
          priority,
          assignedAt: at,
          aiTitle: c.optOutOfPublic ? undefined : c.title,
          aiSummary: c.optOutOfPublic ? undefined : firstSentence(c.description),
          timeline: [...c.timeline, { status: "Assigned", label: `Approved and assigned to ${department}`, at }],
        }),
        { action: "Assigned", trackingId, department, detail: `AI priority: ${priority} (simulated)` },
      );
      return priority;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.complaints, actorName],
  );

  const rejectComplaint = useCallback(
    (trackingId: string, reason: string) => {
      const at = new Date().toISOString();
      patch(
        trackingId,
        (c) => ({
          ...c,
          status: "Rejected",
          rejectedAt: at,
          rejectionReason: reason.trim(),
          timeline: [...c.timeline, { status: "Rejected", label: "Rejected by an administrator", at }],
        }),
        { action: "Rejected", trackingId, detail: reason.trim() },
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [actorName],
  );

  const reassignComplaint = useCallback(
    (trackingId: string, department: Department, reason: string) => {
      const target = state.complaints.find((c) => c.trackingId === trackingId);
      if (!target || target.status !== "Assigned" || target.updates.length > 0) return false;
      const from = target.department;
      const at = new Date().toISOString();
      // The new department starts fresh: status returns to Assigned and the SLA clock restarts.
      patch(
        trackingId,
        (c) => ({
          ...c,
          status: "Assigned",
          department,
          assignedAt: at,
          acknowledgedAt: undefined,
          timeline: [...c.timeline, { status: "Assigned", label: `Reassigned to ${department}`, at }],
        }),
        { action: "Reassigned", trackingId, department, detail: `From ${from ?? "—"}. ${reason.trim()}` },
      );
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.complaints, actorName],
  );

  // ---- Department head actions -------------------------------------------------------------
  // SIMULATED row-level security: a department can only touch complaints assigned to its own office,
  // and can never reject, reassign or set "Assigned". The real system enforces this in the database.
  const sessionDept = state.session?.role === "department" ? state.session.department : undefined;

  const departmentComplaints = useMemo(
    () =>
      sessionDept
        ? state.complaints.filter((c) => c.department === sessionDept && (c.status === "Assigned" || c.status === "In Progress" || c.status === "Resolved"))
        : [],
    [state.complaints, sessionDept],
  );

  const updateDepartmentStatus = useCallback(
    (trackingId: string, status: DepartmentStatus) => {
      const target = departmentComplaints.find((c) => c.trackingId === trackingId);
      // Only the next step is allowed: Assigned → In Progress → Resolved (no skipping, no going back).
      if (!sessionDept || !target || nextDepartmentStatus(target.status) !== status) return false;
      const from = target.status;
      const at = new Date().toISOString();
      patch(
        trackingId,
        (c) => {
          if (status === "In Progress") {
            return {
              ...c,
              status,
              acknowledgedAt: c.acknowledgedAt ?? at,
              timeline: c.timeline.some((t) => t.status === "In Progress") ? c.timeline : [...c.timeline, { status: "In Progress", label: "In Progress", at }],
            };
          }
          // Resolved: only reachable from In Progress, so the work-started step is already on the timeline.
          return {
            ...c,
            status,
            acknowledgedAt: c.acknowledgedAt ?? at,
            resolvedAt: at,
            timeline: [...c.timeline, { status: "Resolved" as const, label: "Resolved", at }],
          };
        },
        { action: "Status changed", trackingId, department: sessionDept, detail: `${from} → ${status}` },
        { actor: sessionDept, actorRole: "Department" },
      );
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [departmentComplaints, sessionDept],
  );

  const addDepartmentUpdate = useCallback(
    (trackingId: string, message: string) => {
      const target = departmentComplaints.find((c) => c.trackingId === trackingId);
      const text = message.trim();
      if (!sessionDept || !target || target.status === "Resolved" || !text) return false;
      const at = new Date().toISOString();
      patch(
        trackingId,
        (c) => ({ ...c, updates: [...c.updates, { department: sessionDept, at, message: text }] }),
        { action: "Update posted", trackingId, department: sessionDept, detail: text },
        { actor: sessionDept, actorRole: "Department" },
      );
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [departmentComplaints, sessionDept],
  );

  const resetDemo = useCallback(() => setState(fresh()), []);

  const myComplaints = useMemo(() => state.complaints.filter((c) => c.mine), [state.complaints]);
  const publicConcerns = useMemo<PublicConcern[]>(
    () =>
      state.complaints
        .filter((c) => !c.optOutOfPublic && c.aiTitle && (c.status === "Assigned" || c.status === "In Progress" || c.status === "Resolved"))
        .map((c) => ({
          id: c.trackingId,
          title: c.aiTitle!,
          summary: c.aiSummary ?? "",
          category: c.category,
          status: c.status as PublicConcern["status"],
          date: c.submittedAt,
        }))
        .sort((a, b) => b.date.localeCompare(a.date)),
    [state.complaints],
  );

  const value = useMemo<DemoStore>(
    () => ({
      ...state,
      ready,
      myComplaints,
      publicConcerns,
      login,
      logout,
      isAdminEmail,
      startSignup,
      verifyCode,
      completeSignup,
      startReset,
      markResetVerified,
      finishReset,
      updateProfile,
      submitComplaint,
      findMyComplaint,
      findComplaint,
      assignComplaint,
      rejectComplaint,
      reassignComplaint,
      departmentComplaints,
      updateDepartmentStatus,
      addDepartmentUpdate,
      resetDemo,
    }),
    [state, ready, myComplaints, publicConcerns, login, logout, isAdminEmail, startSignup, verifyCode, completeSignup, startReset, markResetVerified, finishReset, updateProfile, submitComplaint, findMyComplaint, findComplaint, assignComplaint, rejectComplaint, reassignComplaint, departmentComplaints, updateDepartmentStatus, addDepartmentUpdate, resetDemo],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemoStore(): DemoStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDemoStore must be used inside <DemoStoreProvider>");
  return ctx;
}

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
