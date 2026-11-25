"use client";

import { setAccountActive } from "@/actions/superAdminActions";
import { ConfirmDialog } from "@/components/admin/superadmin";
import { useToast } from "@/components/Toast";
import type { StudentAccountRow } from "@/features/superAdmin/superAdminTypes";

const fullName = (student: StudentAccountRow) => `${student.first_name} ${student.last_name}`.trim();

export function StudentActiveDialog({
  student,
  action,
  onClose,
  onDone,
}: {
  student: StudentAccountRow;
  action: "deactivate" | "reactivate";
  onClose: () => void;
  onDone: () => void;
}) {
  const toast = useToast();
  const deactivating = action === "deactivate";
  const open = student.open_complaints;

  const confirm = async (): Promise<string | null> => {
    try {
      const result = await setAccountActive(student.id, !deactivating);
      if (!result.success) return result.message;
      toast(`${fullName(student)} ${deactivating ? "deactivated" : "reactivated"}.`, "success");
      onDone();
      return null;
    } catch (err) {
      console.error(err);
      return "Something went wrong. Please try again.";
    }
  };

  return (
    <ConfirmDialog
      title={deactivating ? "Deactivate this student?" : "Reactivate this student?"}
      subtitle={`${fullName(student)} · ${student.email}`}
      body={
        deactivating ? (
          <>
            {open > 0 ? (
              <p>
                This student has {open} open complaint{open === 1 ? "" : "s"}. Departments will keep working on {open === 1 ? "it" : "them"}, but
                the student won&apos;t be able to log in to see updates.
              </p>
            ) : (
              <p>The student won&apos;t be able to log in. They have no open complaints.</p>
            )}
            <p>Their past complaints stay in the system. You can reactivate the account later from this page.</p>
          </>
        ) : (
          <p>The student will be able to log in again and see their complaints and updates.</p>
        )
      }
      confirmLabel={deactivating ? "Deactivate" : "Reactivate"}
      danger={deactivating}
      onCancel={onClose}
      onConfirm={confirm}
    />
  );
}
