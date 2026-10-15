"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import styles from "./Modal.module.css";

const modalStack: symbol[] = [];

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** "center" = student pop-ups; "left" = admin pop-ups (title left, close button). */
  align?: "center" | "left";
  /** Extra element beside the title (e.g. a status pill). */
  titleAside?: ReactNode;
  /** Round icon shown above a centered title (admin logout). */
  icon?: ReactNode;
  /** Show a close button in the top-right corner for centered dialogs. */
  showClose?: boolean;
  /** Hide the built-in close button when a dialog has an explicit back action. */
  hideClose?: boolean;
  size?: "sm" | "md" | "lg" | "square";
  /** Short interactions stay centered; long content may use a mobile bottom sheet. */
  variant?: "dialog" | "sheet";
  /** Use the mobile content layout instead of the compact confirmation layout. */
  mobileContent?: boolean;
}

/** Accessible dialog: focus moves in, Escape and backdrop close, focus returns afterwards. */
export function Modal({ open, onClose, title, subtitle, children, footer, align = "center", titleAside, icon, showClose = false, hideClose = false, size = "md", variant = "dialog", mobileContent = false }: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  const modalToken = useRef(Symbol("modal"));
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const token = modalToken.current;
    modalStack.push(token);
    lastFocus.current = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusables = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? [],
      ).filter((el) => !el.hasAttribute("disabled"));
    // Prefer the first form field; otherwise the dialog itself (so a close button isn't pre-focused).
    const firstField = dialog?.querySelector<HTMLElement>("input, select, textarea");
    (firstField ?? dialog)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (modalStack[modalStack.length - 1] !== token) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeRef.current();
      }
      if (e.key === "Tab") {
        const items = focusables();
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      const stackIndex = modalStack.lastIndexOf(token);
      if (stackIndex !== -1) modalStack.splice(stackIndex, 1);
      document.body.style.overflow = prevOverflow;
      lastFocus.current?.focus?.();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`${styles.backdrop} ${variant === "sheet" ? styles.sheetBackdrop : ""}`}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        className={`${styles.dialog} ${variant === "sheet" ? styles.sheetDialog : styles.dialogVariant} ${align === "left" ? styles.left : ""} ${styles[size]} ${size !== "lg" && align === "center" && !mobileContent ? styles.smallDialog : ""} ${mobileContent ? styles.contentDialog : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        {!hideClose && (showClose || size !== "lg") && align !== "left" ? (
          <button type="button" className={`${styles.close} ${styles.dialogClose} ${showClose ? "" : styles.mobileClose}`} aria-label="Close" onClick={onClose}>
            <Icon name="x" size={20} strokeWidth={2.2} />
          </button>
        ) : null}
        {icon ? <span className={styles.icon}>{icon}</span> : null}
        <div className={styles.head}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          {titleAside}
          {align === "left" ? (
            <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
              <Icon name="x" size={20} strokeWidth={2.2} />
            </button>
          ) : null}
        </div>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        {children ? <div className={styles.body}>{children}</div> : null}
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
