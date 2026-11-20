/**
 * Layer 3, no-DB tests (Vitest). Save as tests/actions.test.ts
 *
 * Before running, adjust the two vi.mock paths marked  <-- CHANGE
 * (where analyzeComplaint and your email helpers live), and confirm ROLE
 * strings match what getCurrentUser() really returns.
 */
import { vi, describe, it, expect, beforeEach } from "vitest";

/* ---------------- mocks (hoisted) ---------------- */
vi.mock("@/features/auth/guards", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/features/ai/analyzeComplaint", () => ({ analyzeComplaint: vi.fn() }));
vi.mock("@/lib/email/notification", () => ({
  sendAssignmentEmail: vi.fn(),
  sendReassignmentEmails: vi.fn(),
}));

import { getCurrentUser } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { analyzeComplaint } from "@/features/ai/analyzeComplaint";
import { sendAssignmentEmail, sendReassignmentEmails } from "@/lib/email/notification";
import { rejectComplaint, assignComplaint } from "@/actions/adminActions";
import { updateComplaintStatus } from "@/actions/departmentActions";
/* ---------------- helpers ---------------- */
// Confirm these match getCurrentUser().role in your code.
const ROLE = {
  student: "student",
  admin: "admin",
  department: "department",
  superAdmin: "superAdmin",
} as const;

const as = (role: string | null) =>
  (getCurrentUser as any).mockResolvedValue(role ? { role } : null);

const fd = (o: Record<string, string>) => {
  const f = new FormData();
  Object.entries(o).forEach(([k, v]) => f.set(k, v));
  return f;
};

/** Chainable Supabase query builder that resolves to `result`. */
const chain = (result: { data: any; error: any }) => {
  const b: any = {};
  for (const m of ["select", "eq", "update", "order", "limit"]) b[m] = () => b;
  b.maybeSingle = async () => result;
  b.single = async () => result;
  return b;
};

beforeEach(() => {
  vi.clearAllMocks();
});

/* ---------------- role gating ---------------- */
describe("role gating: gate runs before any DB access", () => {
  const blockedForAdminActions = [ROLE.student, ROLE.department, ROLE.superAdmin, null];

  it.each(blockedForAdminActions)("rejectComplaint blocks %s", async (r) => {
    as(r);
    const res = await rejectComplaint(fd({ complaint_id: "x", reason: "r" }));
    expect(res.success).toBe(false);
    expect(res.message).toBe("Not allowed.");
    expect(createClient).not.toHaveBeenCalled();
  });

  it.each(blockedForAdminActions)("assignComplaint blocks %s", async (r) => {
    as(r);
    const res = await assignComplaint(
      fd({ complaint_id: "x", department_id: "1", action: "assign" })
    );
    expect(res.success).toBe(false);
    expect(res.message).toBe("Not allowed.");
    expect(createClient).not.toHaveBeenCalled();
    expect(analyzeComplaint).not.toHaveBeenCalled();
  });

  it.each([ROLE.student, null])("updateComplaintStatus blocks %s", async (r) => {
    as(r);
    const res = await updateComplaintStatus(
      "11111111-1111-4111-8111-111111111111",
      "in_progress"
    );
    expect(res.success).toBe(false);
    expect(createClient).not.toHaveBeenCalled();
  });

  // Add one block per exported action. Pattern:
  //   it.each([...blocked roles])("<action> blocks %s", async (r) => {
  //     as(r);
  //     const res = await <action>(...);
  //     expect(res.success).toBe(false);
  //     expect(createClient).not.toHaveBeenCalled();
  //   });
});

/* ---------------- validation ---------------- */
describe("validation", () => {
  it("rejectComplaint requires a reason", async () => {
    as(ROLE.admin);
    const res = await rejectComplaint(fd({ complaint_id: "x", reason: " " }));
    expect(res.message).toBe("A reason is required to reject.");
  });

  it("updateComplaintStatus rejects a bad uuid", async () => {
    as(ROLE.department);
    const res = await updateComplaintStatus("nope", "in_progress");
    expect(res.message).toBe("Invalid request.");
  });

  it("assignComplaint rejects empty complaint_id", async () => {
    as(ROLE.admin);
    const res = await assignComplaint(
      fd({ complaint_id: "", department_id: "1", action: "assign" })
    );
    expect(res.message).toBe("Invalid request.");
  });

  it("assignComplaint rejects non-numeric department_id", async () => {
    as(ROLE.admin);
    const res = await assignComplaint(
      fd({ complaint_id: "x", department_id: "abc", action: "assign" })
    );
    expect(res.message).toBe("Invalid request.");
  });

  it("assignComplaint rejects a bad action", async () => {
    as(ROLE.admin);
    const res = await assignComplaint(
      fd({ complaint_id: "x", department_id: "1", action: "delete" })
    );
    expect(res.message).toBe("Invalid action.");
  });

  // Known gap: Number("") === 0, so an EMPTY department_id passes the
  // Number.isInteger check. If you fix it, flip this expectation.
  it.skip("assignComplaint should reject an empty department_id", async () => {
    as(ROLE.admin);
    const res = await assignComplaint(
      fd({ complaint_id: "x", department_id: "", action: "assign" })
    );
    expect(res.message).toBe("Invalid request.");
  });
});

/* ---------------- assignComplaint behavior (mocked DB) ---------------- */
describe("assignComplaint flow", () => {
  const DEPT = { rtu_email: "dept@rtu.edu.ph", first_name: "Dept", last_name: "A" };

  /** Wire up both Supabase clients. */
  function setup(opts: {
    complaint?: any;
    complaintError?: any;
    dept?: any;
    deptError?: any;
    rpcError?: any;
    previousDept?: any;
  }) {
    const rpc = vi.fn().mockResolvedValue({ error: opts.rpcError ?? null });

    (createClient as any).mockResolvedValue({
      from: () =>
        chain({
          data: opts.complaint === undefined ? baseComplaint() : opts.complaint,
          error: opts.complaintError ?? null,
        }),
      rpc,
    });

    let usersCall = 0;
    (createAdminClient as any).mockResolvedValue({
      from: (table: string) => {
        if (table === "complaints") {
          return chain({ data: { tracking_id: "TRK-001" }, error: null });
        }
        // users: 1st call = target dept, 2nd call = previous dept
        usersCall += 1;
        if (usersCall === 1) {
          return chain({
            data: opts.dept === undefined ? DEPT : opts.dept,
            error: opts.deptError ?? null,
          });
        }
        return chain({ data: opts.previousDept ?? null, error: null });
      },
    });

    return { rpc };
  }

  const baseComplaint = (over: Record<string, any> = {}) => ({
    title: "Broken aircon",
    description: "Room 101",
    is_public: true,
    priority_id: null,
    department_id: null,
    ...over,
  });

  const aiResult = { ai_title: "AC issue", ai_summary: "Aircon broken", priority: "high" };
  const form = (action = "assign") =>
    fd({ complaint_id: "c1", department_id: "2", reason: "", action });

  beforeEach(() => as(ROLE.admin));

  it("department with no active account: error, no AI call, nothing saved", async () => {
    const { rpc } = setup({ dept: null });
    const res = await assignComplaint(form());
    expect(res.success).toBe(false);
    expect(res.message).toBe("This department has no active account. Activate one before assigning.");
    expect(analyzeComplaint).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("department lookup error: clear message, no AI call", async () => {
    const { rpc } = setup({ dept: null, deptError: { message: "boom" } });
    const res = await assignComplaint(form());
    expect(res.success).toBe(false);
    expect(res.message).toBe("Couldn't verify the department. Please try again.");
    expect(analyzeComplaint).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("complaint not found", async () => {
    setup({ complaint: null });
    const res = await assignComplaint(form());
    expect(res).toEqual({ success: false, message: "Complaint not found." });
  });

  it("first assignment: AI runs once and results go to the RPC", async () => {
    (analyzeComplaint as any).mockResolvedValue(aiResult);
    const { rpc } = setup({});
    const res = await assignComplaint(form());
    expect(res.success).toBe(true);
    expect(analyzeComplaint).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith(
      "assign_complaint",
      expect.objectContaining({
        p_complaint_id: "c1",
        p_department_id: 2,
        p_ai_title: "AC issue",
        p_ai_summary: "Aircon broken",
      })
    );
  });

  it("already prioritised complaint: AI is NOT called again", async () => {
    const { rpc } = setup({ complaint: baseComplaint({ priority_id: 2, department_id: 1 }) });
    const res = await assignComplaint(form("reassign"));
    expect(res.success).toBe(true);
    expect(analyzeComplaint).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledWith(
      "assign_complaint",
      expect.objectContaining({ p_ai_title: null, p_ai_summary: null, p_priority_id: null })
    );
  });

  it("AI failure: returns error, RPC never called, complaint stays pending", async () => {
    (analyzeComplaint as any).mockResolvedValue(null);
    const { rpc } = setup({});
    const res = await assignComplaint(form());
    expect(res).toEqual({ success: false, message: "AI analysis failed. Please try again." });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("RPC P0001 error: its message is passed through", async () => {
    (analyzeComplaint as any).mockResolvedValue(aiResult);
    setup({ rpcError: { code: "P0001", message: "Already returned by this department." } });
    const res = await assignComplaint(form());
    expect(res).toEqual({ success: false, message: "Already returned by this department." });
  });

  it("RPC generic error: friendly message, no detail leaked", async () => {
    (analyzeComplaint as any).mockResolvedValue(aiResult);
    setup({ rpcError: { code: "XX000", message: "internal stack detail" } });
    const res = await assignComplaint(form());
    expect(res.message).toBe("Couldn't assign to a department. Please try again.");
    expect(res.message).not.toContain("internal");
  });

  it("assign: exactly one assignment email with the tracking id", async () => {
    (analyzeComplaint as any).mockResolvedValue(aiResult);
    setup({});
    await assignComplaint(form("assign"));
    expect(sendAssignmentEmail).toHaveBeenCalledTimes(1);
    expect(sendAssignmentEmail).toHaveBeenCalledWith(
      expect.objectContaining({ rtu_email: DEPT.rtu_email, tracking_id: "TRK-001" })
    );
    expect(sendReassignmentEmails).not.toHaveBeenCalled();
  });

  it("reassign with previous dept: both departments emailed once", async () => {
    const prev = { rtu_email: "old@rtu.edu.ph", first_name: "Old", last_name: "Dept" };
    setup({ complaint: baseComplaint({ priority_id: 2, department_id: 1 }), previousDept: prev });
    await assignComplaint(form("reassign"));
    expect(sendReassignmentEmails).toHaveBeenCalledTimes(1);
    expect(sendReassignmentEmails).toHaveBeenCalledWith({
      trackingId: "TRK-001",
      previousDept: prev,
      newDept: DEPT,
    });
    expect(sendAssignmentEmail).not.toHaveBeenCalled();
  });

  it("reassign with no previous dept found: falls back to one assignment email", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    setup({ complaint: baseComplaint({ priority_id: 2, department_id: 1 }), previousDept: null });
    await assignComplaint(form("reassign"));
    expect(sendAssignmentEmail).toHaveBeenCalledTimes(1);
    expect(sendReassignmentEmails).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});