import { SLA, type Complaint } from "./types";

const DAY = 24 * 60 * 60 * 1000;

export type SlaTone = "neutral" | "danger" | "success";

export interface SlaInfo {
  acknowledgeBy?: Date;
  resolveBy?: Date;
  overdueDays: number; // > 0 when the resolve-within window has been exceeded
  label: string;
  tone: SlaTone;
}

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

/**
 * SLA rules from the roadmap: the clock starts at assignment; a complaint flips to
 * overdue (counted in days) once the resolve-within window is exceeded.
 */
export function slaInfo(c: Complaint, now = Date.now()): SlaInfo {
  if (!c.assignedAt || !c.priority) {
    return { overdueDays: 0, label: c.status === "Rejected" ? "—" : "Starts when assigned", tone: "neutral" };
  }
  const start = new Date(c.assignedAt).getTime();
  const rule = SLA[c.priority];
  const acknowledgeBy = new Date(start + rule.acknowledge * DAY);
  const resolveBy = new Date(start + rule.resolve * DAY);

  if (c.status === "Resolved" && c.resolvedAt) {
    const late = Math.ceil((new Date(c.resolvedAt).getTime() - resolveBy.getTime()) / DAY);
    return late > 0
      ? { acknowledgeBy, resolveBy, overdueDays: 0, label: `Resolved ${plural(late, "day")} late`, tone: "danger" }
      : { acknowledgeBy, resolveBy, overdueDays: 0, label: "Resolved on time", tone: "success" };
  }

  if (now > resolveBy.getTime()) {
    const days = Math.max(1, Math.floor((now - resolveBy.getTime()) / DAY));
    return { acknowledgeBy, resolveBy, overdueDays: days, label: `Overdue by ${plural(days, "day")}`, tone: "danger" };
  }
  if (c.status === "Assigned" && now <= acknowledgeBy.getTime()) {
    const days = Math.max(1, Math.ceil((acknowledgeBy.getTime() - now) / DAY));
    return { acknowledgeBy, resolveBy, overdueDays: 0, label: `Acknowledge in ${plural(days, "day")}`, tone: "neutral" };
  }
  const days = Math.max(1, Math.ceil((resolveBy.getTime() - now) / DAY));
  return { acknowledgeBy, resolveBy, overdueDays: 0, label: `Resolve in ${plural(days, "day")}`, tone: "neutral" };
}

export interface AttentionInfo {
  reason: "overdue" | "unacknowledged";
  /** Days past the deadline that was missed (0 while still inside the acknowledge window). */
  days: number;
  label: string;
  /** Sort key: smaller = more urgent. Overdue complaints come first, most overdue at the top. */
  rank: number;
}

/**
 * Department "Needs Attention" rule (roadmap Sprint 5 + SRS §3): a complaint needs attention when it is
 * overdue (resolve-within window exceeded) or still unacknowledged (status Assigned, not yet In Progress).
 * Returns null for everything else.
 */
export function attentionInfo(c: Complaint, now = Date.now()): AttentionInfo | null {
  if (!c.assignedAt || !c.priority || c.status === "Resolved" || c.status === "Rejected" || c.status === "Pending") return null;
  const sla = slaInfo(c, now);
  if (sla.overdueDays > 0) return { reason: "overdue", days: sla.overdueDays, label: sla.label, rank: -sla.overdueDays };
  if (c.status === "Assigned" && sla.acknowledgeBy) {
    const diff = now - sla.acknowledgeBy.getTime();
    if (diff > 0) {
      const days = Math.max(1, Math.floor(diff / DAY));
      return { reason: "unacknowledged", days, label: `Acknowledgement late by ${plural(days, "day")}`, rank: 1000 - days };
    }
    const left = Math.max(1, Math.ceil(-diff / DAY));
    return { reason: "unacknowledged", days: 0, label: `Acknowledge in ${plural(left, "day")}`, rank: 2000 + left };
  }
  return null;
}

/** Whole days between two ISO dates (used for "Resolved in N days"). */
export function daysBetween(fromIso: string, toIso: string): number {
  return Math.max(1, Math.round((new Date(toIso).getTime() - new Date(fromIso).getTime()) / DAY));
}

/**
 * SIMULATED AI priority. The real system sends the complaint to an AI model when an
 * admin assigns a department; this demo uses a keyword rule so results are repeatable.
 */
export function simulatePriority(c: Pick<Complaint, "title" | "description">): "High" | "Medium" | "Low" {
  const text = `${c.title} ${c.description}`.toLowerCase();
  if (/(unsafe|wiring|fire|injur|leak|flood|no (running )?water|lock|electric|danger|broken glass)/.test(text)) return "High";
  if (/(delay|late|schedule|grade|record|document|enrol|balance|missing|requirement)/.test(text)) return "Medium";
  return "Low";
}
