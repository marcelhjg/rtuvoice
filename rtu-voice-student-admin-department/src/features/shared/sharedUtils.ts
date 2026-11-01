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