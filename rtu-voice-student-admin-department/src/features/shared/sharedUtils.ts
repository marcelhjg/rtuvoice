export const str = (v: FormDataEntryValue | null) => (v ?? "").toString();

// A fixed time zone keeps the server render and the browser render identical,
// otherwise React can complain about a hydration mismatch.
export function formatShortDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "Asia/Manila",
    });
}

// Constants and helpers shared by the action files.
// No "use server" here: a "use server" file may only export async functions,
// so every exported constant/helper has to live in a normal module like this one.

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const PAGE_SIZE = 8;

export const EVIDENCE_BUCKET = "complaint-evidence"; // your PRIVATE bucket
export const URL_LIFETIME_SECONDS = 60;

export const roundTo = (n: number, digits = 0) => {
  const f = 10 ** digits;
  return Math.round((n + Number.EPSILON) * f) / f;
};

// trim, cap length, and turn "" into null
export const cleanSearch = (s?: string) => {
  const v = s?.trim().slice(0, 50);
  return v ? v : null;
};