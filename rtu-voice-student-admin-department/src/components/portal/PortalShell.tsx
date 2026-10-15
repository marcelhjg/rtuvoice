"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useDemoStore } from "@/lib/demo-store";
import { homeFor } from "@/lib/routes";
import { Icon, type IconName } from "../Icon";
import { Logo } from "../Logo";
import { LogoutDialog } from "./LogoutDialog";
import { PortalHeader } from "./PortalHeader";
import { useToast } from "../Toast";
import styles from "./PortalShell.module.css";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/report", label: "Submit Complaint", icon: "file-text" },
  { href: "/track", label: "Track Status", icon: "search" },
  { href: "/public-dashboard", label: "Public Dashboard", icon: "globe" },
  { href: "/history", label: "History", icon: "clock" },
];

/** Layout for every logged-in student page: header, side menu, profile menu, logout dialog, auth guard. */
export function PortalShell({ children }: { children: ReactNode }) {
  const { ready, session, logout } = useDemoStore();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const loggingOut = useRef(false);

  // Simulated auth guard: the real system protects these routes server-side.
  useEffect(() => {
    if (ready && !session && !loggingOut.current) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (ready && session && session.role !== "student") {
      router.replace(homeFor(session.role));
    }
  }, [ready, session, router, pathname]);

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

  const doLogout = useCallback(() => {
    loggingOut.current = true;
    setConfirmLogout(false);
    logout();
    toast("You have been logged out.", "success");
    router.replace("/login");
  }, [logout, router, toast]);

  if (!ready || !session || session.role !== "student") {
    return (
      <div className={styles.loading} aria-busy="true">
        <span className="spinner" /> Loading…
      </div>
    );
  }

  return (
    <>
      <PortalHeader
        homeHref="/dashboard"
        profileHref="/profile"
        menuLabel="Open menu"
        sidebarId="portal-sidebar"
        onOpenMenu={() => setMenuOpen(true)}
        menuOpen={menuOpen}
        menuButtonRef={menuButtonRef}
        onRequestLogout={() => setConfirmLogout(true)}
      />

      {/* Side menu */}
      <div className={`${styles.overlay} ${menuOpen ? styles.overlayOpen : ""}`} onClick={() => setMenuOpen(false)} aria-hidden="true" />
      <aside id="portal-sidebar" className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`} aria-label="Main menu" aria-hidden={!menuOpen} inert={!menuOpen}>
        <div className={styles.sidebarHead}>
          <Logo href="/dashboard" variant="dark" badge />
        </div>
        <nav className={styles.nav}>
          {NAV.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
            return (
              <Link key={item.href} href={item.href} className={`${styles.navItem} ${active ? styles.navActive : ""}`} aria-current={active ? "page" : undefined}>
                <Icon name={item.icon} size={24} strokeWidth={1.6} />
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
            <Icon name="log-out" size={24} strokeWidth={1.6} /> Logout
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
