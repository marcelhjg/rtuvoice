import type { EvidenceFile } from "@/lib/types";

/** Short file kind shown on the chip ("JPG", "PDF"…), from the MIME type, else the file extension. */
export function evidenceKind(f: EvidenceFile): string {
  const byType: Record<string, string> = {
    "image/jpeg": "JPG",
    "image/png": "PNG",
    "application/pdf": "PDF",
    "audio/mpeg": "MP3",
    "audio/mp3": "MP3",
    "audio/wav": "WAV",
    "audio/x-wav": "WAV",
    "audio/wave": "WAV",
    "video/mp4": "MP4",
  };
  const ext = f.name.includes(".") ? f.name.split(".").pop()!.toUpperCase() : "";
  return byType[f.type] ?? (ext || "File");
}

/**
 * The name shown for a file. Staff (admin, department) see "Evidence 1", "Evidence 2"… because a
 * student's own file name can identify them ("juan_cruz_receipt.pdf"). The student sees their own name.
 */
export function evidenceDisplayName(f: EvidenceFile, index: number, forStaff: boolean): string {
  return forStaff ? `Evidence ${index + 1}` : f.name;
}

/** Name the browser saves a download under. Staff get a neutral name built from the Tracking ID. */
export function evidenceDownloadName(f: EvidenceFile, index: number, trackingId: string, forStaff: boolean): string {
  if (!forStaff) return f.name;
  return `${trackingId}-evidence-${index + 1}.${evidenceKind(f).toLowerCase()}`;
}

export type EvidenceLinkRequest = {
  trackingId: string;
  file: EvidenceFile;
  /** "open" shows the file in a new tab; "download" saves it under downloadName. */
  mode: "open" | "download";
  downloadName: string;
};

/**
 * BACKEND HOOK: returns a short-lived link to one evidence file, or null if it can't be served.
 *
 * SIMULATED: this demo never keeps file contents (only name, size and type), so files have no
 * `path` and this always returns null. The details view checks `path` first and explains instead.
 *
 * Backend (Supabase Storage, private bucket "evidence"): replace the body with
 *   const { data, error } = await supabase.storage
 *     .from("evidence")
 *     .createSignedUrl(request.file.path!, 60, request.mode === "download" ? { download: request.downloadName } : undefined);
 *   return error ? null : data.signedUrl;
 * Storage RLS decides who may sign the link (see README › Evidence files), not this function.
 */
export async function getEvidenceUrl(request: EvidenceLinkRequest): Promise<string | null> {
  // SIMULATED: nothing is stored, so there is nothing to sign. `request` is what the backend needs.
  return null;
}
