import type { ReactNode } from "react";
import { Icon, type IconName } from "../Icon";
import { BackButton } from "../BackButton";
import styles from "./Legal.module.css";

interface LegalHeroProps {
  eyebrow: string;
  title: string;
  lead: string;
  chips?: { icon: IconName; label: string }[];
}

export function LegalHero({ eyebrow, title, lead, chips }: LegalHeroProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroInner}>
        <BackButton />
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.lead}>{lead}</p>
        {chips?.length ? (
          <ul className={styles.chips}>
            {chips.map((c) => (
              <li key={c.label} className={styles.chip}>
                <Icon name={c.icon} size={15} strokeWidth={2} />
                {c.label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

export function LegalBody({ children, footnote }: { children: ReactNode; footnote?: string }) {
  return (
    <div className={styles.body}>
      <div className={styles.bodyInner}>
        {children}
        {footnote ? <p className={styles.footnote}>{footnote}</p> : null}
      </div>
    </div>
  );
}

export function LegalSection({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className={styles.section} aria-labelledby={`sec-${n}`}>
      <h2 id={`sec-${n}`} className={styles.sectionHead}>
        <span className={styles.num} aria-hidden="true">
          {n}
        </span>
        {title}
      </h2>
      <div className={`${styles.sectionBody} ${styles.legalText}`}>{children}</div>
    </section>
  );
}

export function Callout({ tone, children }: { tone: "info" | "warning"; children: ReactNode }) {
  return (
    <div className={tone === "warning" ? styles.warn : styles.info}>
      <Icon name={tone === "warning" ? "alert-triangle" : "info"} size={18} />
      <div>{children}</div>
    </div>
  );
}

export { styles as legalStyles };
