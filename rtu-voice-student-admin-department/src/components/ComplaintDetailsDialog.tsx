"use client";

import { useState } from "react";
import { ComplaintStatusDetails } from "@/components/ComplaintStatusDetails";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { formatMonthDay, formatTime } from "@/lib/format";
import type { Complaint } from "@/lib/types";
import trackStyles from "@/app/(portal)/track/track.module.css";

export function ComplaintDetailsDialog({
  complaint,
  onClose,
}: {
  complaint: Complaint;
  onClose: () => void;
}) {
  const [showUpdates, setShowUpdates] = useState(false);
  const close = () => {
    setShowUpdates(false);
    onClose();
  };

  return (
    <>
      <Modal open={!showUpdates} onClose={close} align="left" size="lg" variant="sheet" title="Complaint details">
        <ComplaintStatusDetails complaint={complaint} onViewUpdate={() => setShowUpdates(true)} compact />
      </Modal>
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
        {complaint.updates.length ? (
          <div className={trackStyles.updateList}>
            {[...complaint.updates].reverse().map((update, index) => (
              <article className={trackStyles.updateEntry} key={`${update.at}-${index}`}>
                <p className={trackStyles.updateMeta}>
                  {update.department} · {formatMonthDay(update.at)}, {formatTime(update.at)}
                </p>
                <div className={trackStyles.updateMsg}>{update.message}</div>
              </article>
            ))}
          </div>
        ) : (
          <p className={trackStyles.updateNote}>No update from the department yet.</p>
        )}
        <div className={trackStyles.updateNote}>
          <Icon name="info" size={20} />
          This message is visible only to you and the administrators. It is never shown on the public dashboard.
        </div>
      </Modal>
    </>
  );
}
