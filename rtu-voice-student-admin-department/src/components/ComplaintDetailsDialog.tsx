"use client";

import { useState } from "react";
import { ComplaintStatusDetails } from "@/components/ComplaintStatusDetails";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { formatMonthDay, formatTime } from "@/lib/format";
import type { TrackedComplaint } from "@/features/student/studentTypes";
import trackStyles from "@/app/(portal)/track/track.module.css";

/** Department update messages, newest first. */
export function UpdateMessages({ complaint, forStaff = false }: { complaint: TrackedComplaint; forStaff?: boolean }) {
  const updates = [...complaint.updates].sort((a, b) => new Date(b.entry_at).getTime() - new Date(a.entry_at).getTime());

  return updates.length ? (
    <div className={trackStyles.updateList}>
      {updates.map((update, index) => (
        <article className={trackStyles.updateEntry} key={`${update.entry_at}-${index}`}>
          <p className={trackStyles.updateMeta}>
            {complaint.department_name ?? "Department"} · {formatMonthDay(update.entry_at)}, {formatTime(update.entry_at)}
          </p>
          <div className={trackStyles.updateMsg}>{update.entry_message}</div>
        </article>
      ))}
    </div>
  ) : (
    // Empty state: what to expect next (the student is emailed when the department posts an update).
    <div className={trackStyles.updateEmpty} role="status">
      <Icon name="mail" size={26} strokeWidth={1.6} />
      <p className={trackStyles.updateEmptyTitle}>No update from the department yet.</p>
      <p className={trackStyles.updateEmptyText}>
        {forStaff
          ? "Messages appear here as soon as the department posts one."
          : "You'll get an email when the department posts one. You can also check back here anytime."}
      </p>
    </div>
  );
}

/**
 * Complaint details. Students open the updates from inside it ("View updates"); staff open
 * the updates straight from the table row instead, so they pass showUpdatesButton={false}.
 */
export function ComplaintDetailsDialog({
  complaint,
  onClose,
  showUpdatesButton = true,
  forStaff = false,
}: {
  complaint: TrackedComplaint;
  onClose: () => void;
  showUpdatesButton?: boolean;
  forStaff?: boolean;
}) {
  const [showUpdates, setShowUpdates] = useState(false);
  const close = () => {
    setShowUpdates(false);
    onClose();
  };

  return (
    <>
      <Modal open={!showUpdates} onClose={close} align="left" size="lg" variant="sheet" title="Complaint details">
        <ComplaintStatusDetails
          complaint={complaint}
          onViewUpdate={showUpdatesButton ? () => setShowUpdates(true) : undefined}
          compact
          forStaff={forStaff}
        />
      </Modal>
      {showUpdatesButton ? (
        <Modal
          open={showUpdates}
          onClose={() => setShowUpdates(false)}
          title="Update from the department"
          hideClose
          mobileContent
          footer={
            <button type="button" className={`btn btn-primary ${trackStyles.closeBtn}`} onClick={() => setShowUpdates(false)}>
              Back to details
            </button>
          }
        >
          <UpdateMessages complaint={complaint} forStaff={forStaff} />
          {complaint.updates.length ? (
            <div className={trackStyles.updateNote}>
              <Icon name="info" size={20} />
              This message is visible only to you and the administrators. It is never shown on the public dashboard.
            </div>
          ) : null}
        </Modal>
      ) : null}
    </>
  );
}

/**
 * Staff "View updates" (admin and department rows): opens straight to the department's
 * update messages, in the same pop-up students see, without opening the details first.
 */
export function ComplaintUpdatesDialog({ complaint, onClose }: { complaint: TrackedComplaint; onClose: () => void }) {
  return (
    <Modal
      open
      onClose={onClose}
      title="Update from the department"
      hideClose
      mobileContent
      footer={
        <button type="button" className={`btn btn-primary ${trackStyles.closeBtn}`} onClick={onClose}>
          Close
        </button>
      }
    >
      <UpdateMessages complaint={complaint} forStaff />
      {complaint.updates.length ? (
        <div className={trackStyles.updateNote}>
          <Icon name="info" size={20} />
          Update messages are visible to the student and administrators. They are never shown on the public dashboard.
        </div>
      ) : null}
    </Modal>
  );
}