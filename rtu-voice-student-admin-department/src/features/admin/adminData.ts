// src/features/admin/adminData.ts  (server only)
import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DepartmentOption } from "@/features/admin/adminUi";

// Departments for dropdowns (assign target + filters).
//
// This list is tiny and rarely changes, so it is cached for a minute per server instance
// (and de-duplicated within one request). Superadmin actions that change departments call
// invalidateDepartmentOptions(), which clears the cache of the instance that handled the
// action; other instances catch up when the TTL runs out.
//
// It reads with the service-role client, so it does not need an RLS policy and its result is the
// same for every caller. Only call it from code that has already checked the role.
const TTL_MS = 60_000;

let cached: { value: DepartmentOption[]; expiresAt: number } | null = null;
let inflight: Promise<DepartmentOption[]> | null = null;
let version = 0; // bumped on invalidate, so a fetch that started before it can't re-fill the cache with old data

export function invalidateDepartmentOptions() {
  version++;
  cached = null;
}

async function load(): Promise<DepartmentOption[]> {
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  inflight ??= (async () => {
    const startedAt = version;
    try {
      const admin = await createAdminClient();
      const { data, error } = await admin.from("departments").select("id, name, is_active").order("name");
      if (error) {
        console.error("[getDepartmentOptions] failed:", error);
        return []; // not cached, so the next call retries
      }
      const value = (data ?? []) as DepartmentOption[];
      if (startedAt === version) cached = { value, expiresAt: Date.now() + TTL_MS };
      return value;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export const getDepartmentOptions = cache(load);