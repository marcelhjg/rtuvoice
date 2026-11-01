import Image from "next/image";
import Link from "next/link";
import styles from "./Logo.module.css";

interface LogoProps {
  href?: string;
  /** "light" = on white header, "dark" = on navy sidebar, "footer" = wordmark only on navy footer */
  variant?: "light" | "dark" | "footer";
  /** Show the circular white badge behind the mark (sidebar). */
  badge?: boolean;
  /** Smaller mark and wordmark, for the header before login. */
  compact?: boolean;
}

export function Logo({ href = "/", variant = "light", badge = false, compact = false }: LogoProps) {
  const content = (
    <>
      {variant !== "footer" && (
        <span className={badge ? styles.badge : styles.markWrap}>
          <Image src="/images/rtu-voice-logo.png" alt="" width={200} height={179} className={styles.mark} priority />
        </span>
      )}
      <span className={styles.text}>
        <span className={styles.wordmark}>
          <span className={styles.rtu}>RTU</span> <span className={styles.voice}>Voice</span>
        </span>
        <span className={styles.campus} aria-hidden={variant === "footer" ? undefined : true}>
          {variant === "footer" ? (
            <>
              RIZAL TECHNOLOGICAL UNIVERSITY -
              <br />
              PASIG CAMPUS
              <br />
              INSTITUTE OF COMPUTER STUDIES
            </>
          ) : (
            <>
              {/* Title case in the markup; desktop shows it in capitals via CSS. */}
              <span className={styles.campusLine}>Rizal Technological University –</span>{" "}
              <span className={styles.campusLine}>Pasig Campus</span>
            </>
          )}
        </span>
      </span>
    </>
  );

  return (
    <Link href={href} className={`${styles.logo} ${styles[variant]} ${compact ? styles.compact : ""}`}>
      {content}
    </Link>
  );
}
