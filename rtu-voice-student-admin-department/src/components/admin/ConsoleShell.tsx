"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { logoutUser } from "@/actions/authActions"; // same file the student shell imports from
import { Icon, type IconName } from "../Icon";
import { Logo } from "../Logo";
import { LogoutDialog } from "../portal/LogoutDialog";
import { PortalHeader, type PortalUser } from "../portal/PortalHeader";
import styles from "./AdminShell.module.css";

export interface ConsoleNavItem {
  href: string;
  label: string;
  icon: IconName;
}

export interface ConsoleShellProps {
  user: PortalUser;
  nav: ConsoleNavItem[];
  /** Home route (logo link). */
  homeHref: string;
  profileHref: string;
  /** Header label, e.g. "Central Admin Console" or "Department Portal". */
  consoleLabel: string;
  /** Optional second header line, e.g. the department name. */
  consoleSub?: string;
  menuLabel: string;
  children: ReactNode;
}

/** Shared layout for the Central Admin Console and the Department Portal. */
export function ConsoleShell({ user, nav, homeHref, profileHref, consoleLabel, consoleSub, menuLabel, children }: ConsoleShellProps) {
  const pathname = usePathname();

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, startLogout] = useTransition();
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Close menus on navigation.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Sidebar: Escape closes it, body does not scroll behind it.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  // The server action signs out and redirects to /login, so nothing needs to happen after it.
  const doLogout = () => {
    if (loggingOut) return;
    setConfirmLogout(false);
    startLogout(async () => {
      await logoutUser();
    });
  };

  return (
    <>
      <PortalHeader
        user={user}
        homeHref={homeHref}
        profileHref={profileHref}
        menuLabel={menuLabel}
        sidebarId="console-sidebar"
        onOpenMenu={() => setMenuOpen(true)}
        menuOpen={menuOpen}
        menuButtonRef={menuButtonRef}
        onRequestLogout={() => setConfirmLogout(true)}
        consoleLabel={consoleLabel}
        consoleSub={consoleSub}
      />

      <div className={`${styles.overlay} ${menuOpen ? styles.overlayOpen : ""}`} onClick={() => setMenuOpen(false)} aria-hidden="true" />
      <aside id="console-sidebar" className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`} aria-label={menuLabel} aria-hidden={!menuOpen} inert={!menuOpen}>
        <div className={styles.sidebarHead}>
          <Logo href={homeHref} badge />
        </div>
        <nav className={styles.nav}>
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`${styles.navItem} ${active ? styles.navActive : ""}`} aria-current={active ? "page" : undefined}>
                <Icon name={item.icon} size={22} strokeWidth={1.6} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className={styles.sidebarFoot}>
          <button
            type="button"
            className={styles.logoutLink}
            onClick={() => {
              setMenuOpen(false);
              setConfirmLogout(true);
            }}
          >
            <Icon name="log-out" size={22} strokeWidth={1.6} /> Logout
          </button>
        </div>
      </aside>

      <main id="main" className="portal-bg">
        {children}
      </main>

      <LogoutDialog open={confirmLogout} onClose={() => setConfirmLogout(false)} onConfirm={doLogout} />
    </>
  );
}