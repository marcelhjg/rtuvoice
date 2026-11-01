import { statusBadgeClass } from "@/lib/format";
import type { Status } from "@/lib/types";

export function StatusBadge({ status, className = "" }: { status: Status; className?: string }) {
  return <span className={`${statusBadgeClass(status)} ${className}`}>{status}</span>;
}
