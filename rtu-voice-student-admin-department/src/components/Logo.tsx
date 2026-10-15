import Image from "next/image";
import Link from "next/link";
import styles from "./Logo.module.css";

interface LogoProps {
  href?: string;
  /** "light" = on white header, "dark" = on navy sidebar, "footer" = wordmark only on navy footer */
  variant?: "light" | "dark" | "footer";
  /** Show the circular white badge behind the mark (sidebar). */
  badge?: boolean;
}

export function Logo({ href = "/", variant = "light", badge = false }: LogoProps) {
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
        <span className={styles.campus}>
          {variant === "footer" ? (
            <>
              RIZAL TECHNOLOGICAL UNIVERSITY -
              <br />
              PASIG CAMPUS
              <br />
              INSTITUTE OF COMPUTER STUDIES
            </>
          ) : (
            "RIZAL TECHNOLOGICAL UNIVERSITY - PASIG CAMPUS"
          )}
        </span>
      </span>
    </>
  );

  return (
    <Link href={href} className={`${styles.logo} ${styles[variant]}`} aria-label="RTU Voice home">
      {content}
    </Link>
  );
}
