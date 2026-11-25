import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/guards", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { getStudentAccounts } from "@/actions/superAdminActions";
import { getCurrentUser } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getStudentAccounts", () => {
  it("only lets the superadmin query student accounts", async () => {
    (getCurrentUser as any).mockResolvedValue({ role: "admin" });

    const result = await getStudentAccounts();

    expect(result).toEqual({ success: false, message: "Not allowed." });
    expect(createClient).not.toHaveBeenCalled();
  });

  it("forwards search, status and page to the student accounts RPC", async () => {
    (getCurrentUser as any).mockResolvedValue({ role: "superadmin" });
    const rpc = vi.fn().mockResolvedValue({
      data: {
        total: 1,
        overall_total: 24,
        rows: [
          {
            id: "student-id",
            first_name: "Sam",
            last_name: "Student",
            email: "sam@rtu.edu.ph",
            is_active: false,
            created_at: "2026-01-01T00:00:00.000Z",
            open_complaints: 2,
          },
        ],
      },
      error: null,
    });
    (createClient as any).mockResolvedValue({ rpc });

    const result = await getStudentAccounts({
      search: 'Sam, "Student"',
      isActive: false,
      page: 2,
    });

    expect(rpc).toHaveBeenCalledWith("get_student_accounts", {
      p_search: 'Sam, "Student"',
      p_is_active: false,
      p_limit: 8,
      p_offset: 8,
    });
    expect(result).toEqual({
      success: true,
      rows: [
        {
          id: "student-id",
          first_name: "Sam",
          last_name: "Student",
          email: "sam@rtu.edu.ph",
          is_active: false,
          created_at: "2026-01-01T00:00:00.000Z",
          open_complaints: 2,
        },
      ],
      total: 1,
      overallTotal: 24,
      page: 2,
      totalPages: 1,
    });
  });
});
