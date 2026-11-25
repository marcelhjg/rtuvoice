"use client";

import { useState, type ReactNode } from "react";
import { getComplaintDetailsDepartment } from "@/actions/departmentActions";
import { ComplaintDetailsDialog, ComplaintUpdatesDialog } from "@/components/ComplaintDetailsDialog";
import type { DepartmentComplaintDetails } from "@/features/department/departmentTypes";
import type { TrackedComplaint } from "@/features/student/studentTypes";
import { useToast } from "../Toast";

type Open = { kind: "details" | "updates"; details: DepartmentComplaintDetails } | null;

/** Department pop-ups: complaint details and the updates this department wrote. */
export function useDepartmentModals() {
  const toast = useToast();
  const [open, setOpen] = useState<Open>(null);
  const [loading, setLoading] = useState(false);
  const close = () => setOpen(null);

  const load = async (trackingId: string, kind: "details" | "updates") => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await getComplaintDetailsDepartment(trackingId);
      if (res.success && "trackResult" in res && res.trackResult) setOpen({ kind, details: res.trackResult });
      else toast(res.message || "Couldn't open that complaint.", "error");
    } catch (err) {
      console.error(err);
      toast("Couldn't open that complaint.", "error");
    } finally {
      setLoading(false);
    }
  };

  let node: ReactNode = null;
  if (open?.kind === "details") {
    node = (
      <ComplaintDetailsDialog
        key={`details-${open.details.tracking_id}`}
        complaint={open.details as unknown as TrackedComplaint}
        onClose={close}
        showUpdatesButton={false}
        showAiDetails={false}
        allowEvidenceActions   // getEvidenceUrl allows department; remove this prop if the dialog shouldn't offer file buttons
        forStaff
      />
    );
  }
  if (open?.kind === "updates") {
    node = <ComplaintUpdatesDialog key={`updates-${open.details.tracking_id}`} complaint={open.details as unknown as TrackedComplaint} onClose={close} />;
  }

  return {
    openDetails: (trackingId: string) => load(trackingId, "details"),
    openUpdates: (trackingId: string) => load(trackingId, "updates"),
    modals: node,
  };
}