import { vi } from "vitest";
// vitest.setup.ts: add near the top
process.env.RESEND_API_KEY ??= "re_test_dummy";
// vitest.setup.ts (near the top, before the vi.mock calls)
process.env.RESEND_API_KEY ??= "re_test_dummy";
process.env.MAIL_FROM ??= "RTU Voice <test@example.com>";
process.env.NEXT_PUBLIC_SUPABASE_URL ??= "re_test_dummy";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??= "re_test_dummy";
process.env.SUPABASE_ANON_KEY ??= "re_test_dummy";
process.env.SUPABASE_SECRET_KEY ??= "re_test_dummy";
process.env.NEXT_PUBLIC_SITE_URL ??= "re_test_dummy"
// "server-only" throws outside Next's server build.
vi.mock("server-only", () => ({}));

// getCurrentUser uses React's cache(); make it a pass-through in tests.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: <T extends (...args: never[]) => unknown>(fn: T) => fn };
});