import Link from "next/link";
import { Icon, type IconName } from "@/components/Icon";
import { StatusBadge } from "@/components/StatusBadge";
import { LANDING_PREVIEW } from "@/lib/demo-data";
import type { PublicConcern } from "@/lib/types";
import { Faq } from "./Faq";
import styles from "./landing.module.css";

const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "file-text", title: "SUBMIT", text: "Log in with your RTU email, pick a category, describe your concern and get a tracking ID." },
  { icon: "clipboard-check", title: "REVIEW", text: "Administrators check your submissions and assign the right department." },
  { icon: "wrench", title: "ACT", text: "The department works on it and updates its status." },
  { icon: "search", title: "TRACK", text: "Follow the status anytime and view public dashboard." },
];

const RAISE: { label: string; icon: IconName; accent: "yellow" | "navy" }[] = [
  { label: "ACADEMIC", icon: "notebook", accent: "yellow" },
  { label: "FACILITIES & INFRASTRUCTURE", icon: "building", accent: "navy" },
  { label: "ADMINISTRATIVE", icon: "users-cog", accent: "yellow" },
  { label: "STUDENT LIFE", icon: "user", accent: "navy" },
  { label: "OTHER", icon: "more", accent: "yellow" },
];

const AUDIENCES = [
  { title: "Other students and the public", text: "Never see who you are. The dashboard shows only a depersonalized summary." },
  { title: "The department", text: "Sees your concern and evidence, not your name." },
  { title: "Administrators", text: "Keep an internal link between your account and your concern, so they can follow up, investigate abuse, and respond to serious cases." },
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
            RTU Voice is a student concern and feedback system for RTU Pasig Campus. Raise a concern, track its progress, and see how the university responds, with your identity shielded from staff and the public.
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
        <p className={styles.raiseNote}>Add evidence as JPG/PNG, PDF, MP3/WAV, or MP4, up to 5 MB per submission.</p>
      </section>

      {/* Privacy */}
      <section className={styles.privacy} aria-labelledby="privacy-title">
        <div className={styles.privacyInner}>
          <div className={styles.privacyCopy}>
            <p className={styles.privacyEyebrow}>YOUR PRIVACY</p>
            <h2 id="privacy-title" className={styles.privacyTitle}>
              Identity-shielded by default, not untraceable.
            </h2>
            <p className={styles.privacyText}>We&apos;re clear about who can see what, so you can decide what to share.</p>
            <hr className={styles.privacyRule} />
            <p className={styles.privacyText}>Tip: avoid names, contact details, and identifying photos or recordings.</p>
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
              Browse short, depersonalized summaries of concerns shared by other students, with their current status. Log in
              to view. Your own concern appears here only if you choose to share it when you submit.
            </p>
            <p className={styles.resolvedNote}>Concern text is processed by an AI service to write these summaries.</p>
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

      <div className={styles.notice} role="note">
        <Icon name="alert-triangle" size={16} />
        <span>Please provide clear details and supporting evidence so your concern can be reviewed properly.</span>
      </div>

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
