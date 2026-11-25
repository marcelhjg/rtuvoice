import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { StatusBadge } from "@/components/StatusBadge";
import type { PublicConcern } from "@/lib/types";
import { Faq } from "./Faq";
import { HowToSubmitSection } from "./HowToSubmitSection";
import styles from "./landing.module.css";

const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "file-text", title: "SUBMIT", text: "Log in with your RTU email, pick a category, describe your concern and get a tracking ID." },
  { icon: "clipboard-check", title: "REVIEW", text: "Administrators check your submissions and assign the right department." },
  { icon: "wrench", title: "ACT", text: "The department works on it and updates its status." },
  { icon: "search", title: "TRACK", text: "Follow the status anytime and view public dashboard." },
];

/** The nine complaint categories, in the same order as CATEGORIES (src/lib/types.ts). Accents alternate. */
const RAISE: { label: string; icon: IconName; accent: "yellow" | "navy" }[] = [
  { label: "ACADEMIC", icon: "notebook", accent: "yellow" },
  { label: "FACILITIES & INFRASTRUCTURE", icon: "building", accent: "navy" },
  { label: "ADMINISTRATIVE", icon: "users-cog", accent: "yellow" },
  { label: "STUDENT LIFE", icon: "user", accent: "navy" },
  { label: "SAFETY AND SECURITY", icon: "shield-lock", accent: "yellow" },
  { label: "TECHNOLOGY & ONLINE SYSTEMS", icon: "laptop", accent: "navy" },
  { label: "FOOD, HEALTH & SANITATION", icon: "apple", accent: "yellow" },
  { label: "LIBRARY & LEARNING RESOURCES", icon: "book-open", accent: "navy" },
  { label: "OTHERS", icon: "more", accent: "yellow" },
];

const AUDIENCES = [
  { title: "Other logged-in students", text: "See only the AI-written title and summary, category, status, and date of a complaint you choose to share. These are written to remove personal details, but are not guaranteed to remove every identifying detail." },
  { title: "The assigned department", text: "Sees the original concern and evidence, but not your account link, name, or RTU email. Details you include or show in files may identify you." },
  { title: "Administrators", text: "Can link your complaint to your account to follow up. Complaints are pseudonymous, not anonymous." },
];

const LANDING_PREVIEW: PublicConcern[] = [
  { id: "l1", title: "Leaking ceiling in a Main Building classroom", summary: "", category: "Facilities & Infrastructure", status: "In Progress", date: "2026-03-12" },
  { id: "l2", title: "Delay in releasing requested documents", summary: "", category: "Administrative", status: "Assigned", date: "2026-03-11" },
  { id: "l3", title: "Broken ceiling fan in a Computer Lab", summary: "", category: "Facilities & Infrastructure", status: "Resolved", date: "2026-03-09" },
];

/** One sample per public status, taken from the demo public dashboard data. */
function previewConcerns(): PublicConcern[] {
  const pick = (s: PublicConcern["status"]) => LANDING_PREVIEW.find((c) => c.status === s)!;
  return [pick("In Progress"), pick("Assigned"), pick("Resolved")];
}

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroInner}>
          <h1 id="hero-title" className={styles.heroTitle}>
            Every concern <span className={styles.blue}>COUNTS.</span>
            <br />
            Every voice is <span className={styles.yellow}>HEARD.</span>
          </h1>
          <p className={styles.heroText}>
            RTU Voice is a student concern and feedback system for RTU Pasig Campus. Raise a concern, track its progress, and see how the university responds. Your complaint is linked to your account for administrator follow-up, but department staff do not receive that account link.
          </p>
          <div className={styles.heroActions}>
            <Link href="/report" className={`${styles.heroBtn} ${styles.heroBtnYellow}`}>
              Report a concern
            </Link>
            <Link href="/register" className={`${styles.heroBtn} ${styles.heroBtnGhost}`}>
              Register
            </Link>
          </div>
        </div>
        <a href="#how-it-works" className={styles.scrollCue} aria-label="Scroll to How it works">
          <span>How it works</span>
          <Icon name="chevron-down" size={16} aria-hidden="true" />
        </a>
      </section>

      {/* How it works */}
      <section id="how-it-works" className={styles.how} aria-labelledby="how-title">
        <p className={styles.eyebrow}>HOW IT WORKS</p>
        <h2 id="how-title" className={styles.sectionTitle}>
          From concern to resolution.
        </h2>
        <p className={styles.sectionLead}>Four simple steps. You can see where your concern is at every one of them.</p>
        <ol className={styles.steps}>
          {STEPS.map((s, i) => (
            <li key={s.title} className={styles.step}>
              <span className={styles.stepIcon}>
                <Icon name={s.icon} size={26} strokeWidth={1.6} />
              </span>
              <span className={styles.stepNo}>STEP {i + 1}</span>
              <span className={styles.stepTitle}>{s.title}</span>
              <span className={styles.stepText}>{s.text}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* What can you raise */}
      <section className={styles.raise} aria-labelledby="raise-title">
        <h2 id="raise-title" className={`${styles.sectionTitle} ${styles.navyTitle}`}>
          What can you raise?
        </h2>
        <ul className={styles.raiseGrid}>
          {RAISE.map((r) => (
            <li key={r.label} className={`${styles.raiseCard} ${r.accent === "navy" ? styles.accentNavy : styles.accentYellow}`}>
              <span className={styles.raiseLabel}>{r.label}</span>
              <span className={styles.raiseIcon}>
                <Icon name={r.icon} size={26} strokeWidth={1.6} />
              </span>
            </li>
          ))}
        </ul>
      </section>

      <HowToSubmitSection />

      {/* Privacy */}
      <section className={styles.privacy} aria-labelledby="privacy-title">
        <div className={styles.privacyInner}>
          <div className={styles.privacyCopy}>
            <p className={styles.privacyEyebrow}>YOUR PRIVACY</p>
            <h2 id="privacy-title" className={styles.privacyTitle}>
              Identity-shielded by default, not untraceable.
            </h2>
            <p className={styles.privacyText}>We&apos;re clear about who can see what, so you can decide what to share.</p>
            <Link href="/privacy" className={styles.privacyLink}>
              Read the Privacy Notice →
            </Link>
          </div>
          <ul className={styles.audiences}>
            {AUDIENCES.map((a) => (
              <li key={a.title} className={styles.audience}>
                <span className={styles.audienceTitle}>{a.title}</span>
                <span className={styles.audienceText}>{a.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* See what's being resolved */}
      <section className={styles.resolved} aria-labelledby="resolved-title">
        <div className={styles.resolvedInner}>
          <div>
            <h2 id="resolved-title" className={`${styles.sectionTitleLeft} ${styles.navyTitle}`}>
              See what&apos;s being resolved
            </h2>
            <p className={styles.resolvedText}>
              Logged-in students can browse shared concerns. If you opt in, your complaint appears with an AI-written title
              and summary, category, status, and date—not your name, original text, or priority. The title and summary are
              written to remove personal details, but may not remove every identifying detail.
            </p>
            <p className={styles.resolvedNote}>
              When an administrator assigns a complaint, AI reads its original title and description to return a priority.
              For complaints shared on the dashboard, AI also writes the title and summary. The app uses OpenRouter when
              configured and may send the text directly to Groq as a fallback. See the Privacy Notice for provider
              data-handling details.
            </p>
          </div>
          <ul className={styles.previewPanel} aria-label="Sample public dashboard entries">
            {previewConcerns().map((c) => (
              <li key={c.id} className={styles.previewRow}>
                <span>{c.title}</span>
                <StatusBadge status={c.status} className={styles.smallBadge} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className={styles.faq} aria-labelledby="faq-title">
        <h2 id="faq-title" className={`${styles.sectionTitle} ${styles.navyTitle}`}>
          Questions, answered
        </h2>
        <Faq />
      </section>

      {/* CTA */}
      <section className={styles.cta} aria-labelledby="cta-title">
        <h2 id="cta-title" className={`${styles.sectionTitle} ${styles.navyTitle}`}>
          Ready to be heard?
        </h2>
        <p className={styles.ctaText}>Raise it in a few minutes and follow it until it&apos;s resolved.</p>
        <div className={styles.ctaActions}>
          <Link href="/report" className={`${styles.ctaBtn} ${styles.ctaPrimary}`}>
            Report a concern
          </Link>
          <Link href="/login" className={`${styles.ctaBtn} ${styles.ctaGhost}`}>
            Already have an account
          </Link>
        </div>
      </section>
    </>
  );
}
