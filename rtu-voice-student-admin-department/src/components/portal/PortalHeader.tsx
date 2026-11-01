"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type RefObject } from "react";
import { useDemoStore } from "@/lib/demo-store";
import { Icon } from "../Icon";
import { Logo } from "../Logo";
import styles from "./PortalHeader.module.css";

interface PortalHeaderProps {
  homeHref: string;
  profileHref: string;
  menuLabel: string;
  onOpenMenu: () => void;
  menuOpen: boolean;
  menuButtonRef?: RefObject<HTMLButtonElement | null>;
  sidebarId: string;
  onRequestLogout: () => void;
  consoleLabel?: string;
  consoleSub?: string;
}

/** The single header used by student, admin, and department portals. */
export function PortalHeader({
  homeHref,
  profileHref,
  menuLabel,
  onOpenMenu,
  menuOpen,
  menuButtonRef,
  sidebarId,
  onRequestLogout,
  consoleLabel,
  consoleSub,
}: PortalHeaderProps) {
  const { session } = useDemoStore();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!profileOpen) return;
    const onDown = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setProfileOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [profileOpen]);

  if (!session) return null;
  const fullName = `${session.firstName} ${session.lastName}`.trim();
  const initial = (session.lastName || session.firstName || "S").charAt(0).toUpperCase();

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <button ref={menuButtonRef} type="button" className={styles.menuButton} aria-label={menuLabel} aria-expanded={menuOpen} aria-controls={sidebarId} onClick={onOpenMenu}>
          <Icon name="menu" size={22} strokeWidth={2} />
        </button>
        <Logo href={homeHref} />
      </div>
      {consoleLabel ? (
        <div className={styles.headerRight}>
          {consoleSub ? (
            <span className={styles.consoleBlock}>
              <span className={styles.console}>{consoleLabel}</span>
              <span className={styles.consoleSub}>{consoleSub}</span>
            </span>
          ) : (
            <span className={styles.console}>{consoleLabel}</span>
          )}
          <ProfileMenu
            refElement={profileRef}
            open={profileOpen}
            onToggle={() => setProfileOpen((value) => !value)}
            fullName={fullName}
            email={session.email}
            initial={initial}
            profileHref={profileHref}
            consoleSub={consoleSub}
            onRequestLogout={() => {
              setProfileOpen(false);
              onRequestLogout();
            }}
          />
        </div>
      ) : (
        <ProfileMenu
          refElement={profileRef}
          open={profileOpen}
          onToggle={() => setProfileOpen((value) => !value)}
          fullName={fullName}
          email={session.email}
          initial={initial}
          profileHref={profileHref}
          onRequestLogout={() => {
            setProfileOpen(false);
            onRequestLogout();
          }}
        />
      )}
    </header>
  );
}

function ProfileMenu({
  refElement,
  open,
  onToggle,
  fullName,
  email,
  initial,
  profileHref,
  onRequestLogout,
  consoleSub,
}: {
  refElement: RefObject<HTMLDivElement | null>;
  open: boolean;
  onToggle: () => void;
  fullName: string;
  email: string;
  initial: string;
  profileHref: string;
  onRequestLogout: () => void;
  consoleSub?: string;
}) {
  return (
    <div className={styles.profile} ref={refElement}>
      <button
        type="button"
        className={styles.avatarButton}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={onToggle}
      >
        <span className={styles.avatar}>
          <Icon name="user-round" size={20} strokeWidth={1.7} />
        </span>
        <Icon name="chevron-down" size={16} strokeWidth={2} className={styles.caret} />
      </button>
      {open ? (
        <div className={styles.dropdown} role="menu">
          <div className={styles.dropdownHead}>
            <span className={styles.initial} aria-hidden="true">
              {initial}
            </span>
            <span className={styles.who}>
              <span className={styles.name}>{fullName}</span>
              <span className={styles.email}>{email}</span>
              {consoleSub ? <span className={styles.email}>{consoleSub}</span> : null}
            </span>
          </div>
          <Link href={profileHref} role="menuitem" className={styles.dropItem}>
            <Icon name="user" size={18} /> Manage Profile
          </Link>
          <button
            type="button"
            role="menuitem"
            className={`${styles.dropItem} ${styles.logoutItem}`}
            onClick={onRequestLogout}
          >
            <Icon name="log-out" size={18} /> Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
