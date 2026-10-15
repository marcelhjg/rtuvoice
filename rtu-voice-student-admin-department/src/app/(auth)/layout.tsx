import type { ReactNode } from "react";
import { PublicHeader } from "@/components/PublicHeader";
import styles from "./auth.module.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.authPage}>
      <PublicHeader />
      <main id="main" className={styles.stage}>
        <div className={styles.inner}>
          <section className={styles.hero} aria-labelledby="auth-hero-title">
            <p className={`${styles.tagline} ${styles.eyebrow}`}>SAFE &nbsp;·&nbsp; CONFIDENTIAL &nbsp;·&nbsp; TRACKED</p>
            <h1 id="auth-hero-title" className={styles.heroTitle}>
              <span className={styles.heroBlue}>Your Voice</span>
              <span className={styles.heroYellow}>Matters</span>
            </h1>
            <p className={`${styles.heroText} ${styles.caption}`}>
              A safe and confidential platform for raising campus concerns.
            </p>
          </section>
          <div className={styles.cardCol}>{children}</div>
        </div>
      </main>
    </div>
  );
}
