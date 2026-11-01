"use client";

import { Icon } from "../Icon";
import { Modal } from "../Modal";
import styles from "./PortalShell.module.css";

export function LogoutDialog({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="square"
      showClose
      icon={<Icon name="log-out" size={28} strokeWidth={1.8} />}
      title="Logout?"
      subtitle="You will need to log in again to submit or track a concern."
      footer={
        <div className={styles.logoutButtons}>
          <button type="button" className={`btn btn-soft ${styles.modalBtn}`} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={`btn btn-primary ${styles.modalBtn}`} onClick={onConfirm}>
            Logout
          </button>
        </div>
      }
    />
  );
}
