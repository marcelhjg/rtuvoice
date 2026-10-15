"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useDemoStore } from "@/lib/demo-store";
import { homeFor } from "@/lib/routes";
import type { Role } from "@/lib/types";
import { Icon, type IconName } from "../Icon";
import { Logo } from "../Logo";
import { LogoutDialog } from "../portal/LogoutDialog";
import { PortalHeader } from "../portal/PortalHeader";
import { useToast } from "../Toast";
import styles from "./AdminShell.module.css";

export interface ConsoleNavItem {
  href: string;
  label: string;
  icon: IconName;
}

export interface ConsoleShellProps {
  /** Roles allowed on these pages (the console is shared by admin and superadmin); everyone else is sent to their own portal. */
  roles: Role[];
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
export function ConsoleShell({ roles, nav, homeHref, profileHref, consoleLabel, consoleSub, menuLabel, children }: ConsoleShellProps) {
  const { ready, session, logout } = useDemoStore();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const loggingOut = useRef(false);

  // Simulated role guard: the real system enforces this server-side (row-level security).
  useEffect(() => {
    if (!ready || loggingOut.current) return;
    if (!session) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (!roles.includes(session.role)) router.replace(homeFor(session.role));
  }, [ready, session, router, pathname, roles]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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

  const doLogout = useCallback(() => {
    loggingOut.current = true;
    setConfirmLogout(false);
    logout();
    toast("You have been logged out.", "success");
    router.replace("/login");
  }, [logout, router, toast]);

  if (!ready || !session || !roles.includes(session.role)) {
    return (
      <div className={styles.loading} aria-busy="true">
        <span className="spinner" /> Loading…
      </div>
    );
  }

  return (
    <>
      <PortalHeader
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
