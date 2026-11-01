"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import styles from "./PublicHeader.module.css";

/** Header for pages a visitor sees before logging in. The highlighted button follows the Figma screens. */
export function PublicHeader() {
  const pathname = usePathname();
  const loginActive = pathname === "/login" || pathname.startsWith("/forgot-password");
  const loginPage = pathname === "/login";

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Logo href="/" compact />
        <nav className={styles.nav} aria-label="Account">
          <Link
            href={loginPage ? "/register" : "/login"}
            className={styles.mobileAction}
            aria-current={loginPage ? undefined : pathname === "/login" ? "page" : undefined}
          >
            {loginPage ? "Register" : "Login"}
          </Link>
          <div className={styles.desktopActions}>
            <Link href="/login" className={loginActive ? styles.pill : styles.plain} aria-current={pathname === "/login" ? "page" : undefined}>
              Login
            </Link>
            <Link href="/register" className={loginActive ? styles.plain : styles.pill} aria-current={pathname === "/register" ? "page" : undefined}>
              Register
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
