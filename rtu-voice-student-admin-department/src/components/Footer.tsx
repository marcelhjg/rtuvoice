import Link from "next/link";
import { Logo } from "./Logo";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Logo variant="footer" href="/" />
        </div>
        <nav className={styles.links} aria-label="Footer">
          <span className={styles.heading}>Links</span>
          <Link href="/about">About</Link>
          <Link href="/privacy">Privacy Notice</Link>
          <Link href="/terms">Terms of Use</Link>
        </nav>
        <div className={styles.contact}>
          <span className={styles.heading}>Contact</span>
          <a href="mailto:RTUVoice@gmail.com">RTUVoice@gmail.com</a>
          <span className={styles.built}>Built by Group 4Voices, BSIT</span>
        </div>
      </div>
      <div className={styles.bottom}>
        <span>© 2026 RTU Voice Group 4Voices, BSIT • Institute of Computer Studies</span>
      </div>
    </footer>
  );
}
