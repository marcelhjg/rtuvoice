/**
 * Step 3.2 (login), mock-based. Save as tests/auth.login.test.ts
 * Adjust: the import path of validateAndloginUser, and the "next" field name
 * if your action reads the redirect target from somewhere else.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { signInWithPassword: mocks.signIn, signOut: mocks.signOut },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }) }),
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { validateAndloginUser } from "@/actions/authActions";

const form = (fields: Record<string, string>) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return fd;
};

const GOOD = { email: "a@rtu.edu.ph", password: "Passw0rd" };
const signedIn = () =>
  mocks.signIn.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
const profile = (data: any) => mocks.maybeSingle.mockResolvedValue({ data });

beforeEach(() => vi.clearAllMocks());

describe("empty fields", () => {
  it("missing email", async () => {
    const res: any = await validateAndloginUser(form({ password: GOOD.password }));
    expect(res.success).toBe(false);
    expect(mocks.signIn).not.toHaveBeenCalled();
  });

  it("missing password", async () => {
    const res: any = await validateAndloginUser(form({ email: GOOD.email }));
    expect(res.success).toBe(false);
    expect(mocks.signIn).not.toHaveBeenCalled();
  });

  it("both empty gives a different message than one missing (specific messages)", async () => {
    const a: any = await validateAndloginUser(form({}));
    const b: any = await validateAndloginUser(form({ password: GOOD.password }));
    expect(a.success).toBe(false);
    expect(a.message ?? a.errors).toBeDefined();
    expect(b.message ?? b.errors).toBeDefined();
  });
});

describe("failed sign in", () => {
  it("wrong password: friendly failure, raw Supabase text not leaked", async () => {
    mocks.signIn.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials", status: 400 },
    });
    const res: any = await validateAndloginUser(form(GOOD));
    expect(res.success).toBe(false);
    expect(JSON.stringify(res)).not.toContain("Invalid login credentials");
  });

  it("auth-banned user: returns a failure instead of throwing", async () => {
    mocks.signIn.mockResolvedValue({
      data: { user: null },
      error: { message: "User is banned", status: 400, code: "user_banned" },
    });
    const res: any = await validateAndloginUser(form(GOOD));
    expect(res.success).toBe(false);
    expect(JSON.stringify(res)).not.toContain("User is banned");
  });
});

describe("profile checks after sign in", () => {
  it("is_active = false: fails and signs out (no session left)", async () => {
    signedIn();
    profile({ role_id: 1, is_active: false });
    const res: any = await validateAndloginUser(form(GOOD));
    expect(res.success).toBe(false);
    expect(mocks.signOut).toHaveBeenCalled();
  });

  it("no users row: fails and signs out", async () => {
    signedIn();
    profile(null);
    const res: any = await validateAndloginUser(form(GOOD));
    expect(res.success).toBe(false);
    expect(mocks.signOut).toHaveBeenCalled();
  });
});

describe("redirect per role", () => {
  it("each of the 4 roles gets its own home", async () => {
    const homes: string[] = [];
    for (const role_id of [1, 2, 3, 4]) {
      signedIn();
      profile({ role_id, is_active: true });
      const res: any = await validateAndloginUser(form(GOOD));
      expect(res.success).toBe(true);
      expect(res.redirectTo.startsWith("/")).toBe(true);
      homes.push(res.redirectTo);
    }
    expect(new Set(homes).size).toBe(4); // four different homes
  });
});

describe("open redirect protection (?next=)", () => {
  it.each(["https://evil.com", "//evil.com", "/\\evil.com"])(
    "ignores next=%s",
    async (next) => {
      signedIn();
      profile({ role_id: 1, is_active: true });
      const res: any = await validateAndloginUser(form({ ...GOOD, next }));
      expect(res.success).toBe(true);
      expect(res.redirectTo).not.toContain("evil");
    }
  );

  it("student with next=/admin still lands on the student home", async () => {
    signedIn();
    profile({ role_id: 1, is_active: true });
    const plain: any = await validateAndloginUser(form(GOOD));
    signedIn();
    profile({ role_id: 1, is_active: true });
    const withNext: any = await validateAndloginUser(form({ ...GOOD, next: "/admin" }));
    expect(withNext.redirectTo).toBe(plain.redirectTo);
  });
});

// Rate limiting happens in Supabase, so test it manually (6+ wrong passwords).
it.todo("6+ wrong passwords shows the rate-limit message (manual)");