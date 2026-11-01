import type { Status } from "./types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Parse as a calendar date in Philippine time so output does not shift with the viewer's time zone. */
function parts(iso: string) {
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00+08:00` : iso);
  // Shift to UTC+8 then read UTC fields.
  const ph = new Date(d.getTime() + 8 * 60 * 60 * 1000);
  return {
    y: ph.getUTCFullYear(),
    m: ph.getUTCMonth(),
    d: ph.getUTCDate(),
    h: ph.getUTCHours(),
    min: ph.getUTCMinutes(),
  };
}

/** "Mar 12" */
export function formatShortDate(iso: string): string {
  const p = parts(iso);
  return `${MONTHS[p.m]} ${String(p.d).padStart(2, "0")}`;
}

/** "Mar 12" without zero padding, as used in list meta lines */
export function formatMonthDay(iso: string): string {
  const p = parts(iso);
  return `${MONTHS[p.m]} ${p.d}`;
}

/** "Mar 12, 2026" */
export function formatLongDate(iso: string): string {
  const p = parts(iso);
  return `${MONTHS[p.m]} ${p.d}, ${p.y}`;
}

/** "Mar 12, 2026" with zero padded day, used on public cards */
export function formatCardDate(iso: string): string {
  const p = parts(iso);
  return `${MONTHS[p.m]} ${String(p.d).padStart(2, "0")}, ${p.y}`;
}

/** "9:14 AM" */
export function formatTime(iso: string): string {
  const p = parts(iso);
  const h12 = p.h % 12 === 0 ? 12 : p.h % 12;
  return `${h12}:${String(p.min).padStart(2, "0")} ${p.h < 12 ? "AM" : "PM"}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function statusBadgeClass(status: Status): string {
  switch (status) {
    case "Pending":
      return "badge badge-pending";
    case "Assigned":
      return "badge badge-assigned";
    case "In Progress":
      return "badge badge-progress";
    case "Resolved":
      return "badge badge-resolved";
    case "Rejected":
      return "badge badge-rejected";
  }
}
