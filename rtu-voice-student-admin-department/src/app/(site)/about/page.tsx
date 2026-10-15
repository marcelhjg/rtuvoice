import type { Metadata } from "next";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { Icon, type IconName } from "@/components/Icon";
import { legalStyles } from "@/components/legal/Legal";
import styles from "./about.module.css";

export const metadata: Metadata = { title: "About" };

const STATS = [
  { n: "5", label: "categories" },
  { n: "4", label: "simple steps" },
  { n: "1", label: "tracking ID per concern" },
];

const PILLARS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "eye-off",
    title: "Identity-shielded",
    text: "Other students, the public, and the department never see your name. Authorized administrators keep an internal link for follow-up.",
  },
  { icon: "search", title: "Trackable", text: "Every concern gets a tracking ID and email updates." },
  {
    icon: "globe",
    title: "Transparent",
    text: "A public dashboard shows what is being resolved across campus, for logged-in students.",
  },
];

const TEAM = [
  { initial: "B", name: "Bustenera, Crisartuz Lujille", role: "Senior Developer" },
  { initial: "S", name: "Suarez, Juliana Kim", role: "Junior Developer" },
  { initial: "D", name: "Dela Cruz, John Albert", role: "UI / UX Designer" },
];

const STACK = ["Next.js", "Supabase", "OpenRouter AI", "Resend", "Vercel"];

export default function AboutPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <BackButton />
          <p className={styles.eyebrow}>ABOUT</p>
          <h1 className={styles.title}>
            Every concern counts.
            <br />
            Every voice is heard.
          </h1>
          <p className={styles.lead}>
            RTU Voice is a student concern and feedback system for Rizal Technological University - Pasig Campus, built by
            students, for students.
          </p>
          <ul className={styles.chips}>
            <li className={styles.chip}>
              <Icon name="building" size={15} strokeWidth={2} /> RTU - Pasig Campus
            </li>
            <li className={styles.chip}>
              <Icon name="graduation-cap" size={15} strokeWidth={2} /> Institute of Computer Studies
            </li>
          </ul>
        </div>
      </section>

      <section className={styles.why} aria-labelledby="why-title">
        <div className={styles.whyInner}>
          <div className={styles.whyTop}>
            <div>
              <h2 id="why-title" className={styles.whyTitle}>
                Why we built it
              </h2>
              <p className={`${styles.whyText} ${legalStyles.legalText}`}>
                Students often raise problems on public freedom walls, where concerns get buried, no office is accountable and
                there is no way to see progress. RTU Voice gives every student an official, trackable way to raise a concern
                with the right office.
              </p>
              <p className={`${styles.whyText} ${legalStyles.legalText}`}>
                You submit once, an administrator routes it, the department posts updates, and you follow it with your tracking
                ID, all while your identity stays shielded.
              </p>
            </div>
            <ul className={styles.stats}>
              {STATS.map((s) => (
                <li key={s.label} className={styles.stat}>
                  <span className={styles.statNum}>{s.n}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                </li>
              ))}
            </ul>
          </div>
          <ul className={styles.pillars}>
            {PILLARS.map((p) => (
              <li key={p.title} className={styles.pillar}>
                <span className={styles.pillarIcon}>
                  <Icon name={p.icon} size={22} strokeWidth={1.6} />
                </span>
                <span className={styles.pillarTitle}>{p.title}</span>
                <span className={styles.pillarText}>{p.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.team} aria-labelledby="team-title">
        <h2 id="team-title" className={styles.teamTitle}>
          Who&apos;s behind RTU Voice
        </h2>
        <p className={styles.teamLead}>
          RTU Voice is the capstone project of Group 4Voices, BSIT students of the Institute of Computer Studies, Rizal
          Technological University-Pasig Campus.
        </p>
        <ul className={styles.members}>
          {TEAM.map((m) => (
            <li key={m.name} className={styles.member}>
              <span className={styles.memberAvatar} aria-hidden="true">
                {m.initial}
              </span>
              <span className={styles.memberName}>{m.name}</span>
              <span className={styles.memberRole}>{m.role}</span>
            </li>
          ))}
        </ul>
        <div className={styles.adviser}>
          <span className={styles.adviserAvatar} aria-hidden="true">
            P
          </span>
          <span>
            <span className={styles.adviserLabel}>SUBJECT ADVISER</span>
            <span className={styles.adviserName}>Prof. Ronel D. Paglomutan, MEng-CpE</span>
          </span>
        </div>
      </section>

      <section className={styles.projectWrap} aria-labelledby="project-title">
        <div className={styles.project}>
          <p id="project-title" className={styles.projectLabel}>
            PROJECT TITLE
          </p>
          <p className={styles.projectName}>
            RTU VOICE: An AI-Assisted Student Concern and Feedback Management System for Rizal Technological University—Pasig
            Campus using NLP
          </p>
          <ul className={styles.stack}>
            {STACK.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.contact} aria-labelledby="contact-title">
        <h2 id="contact-title" className={styles.contactTitle}>
          Have a concern or feedback about RTU Voice?
        </h2>
        <p className={styles.contactText}>
          Reach the team at <a href="mailto:RTUVoice@gmail.com">RTUVoice@gmail.com</a>
        </p>
        <Link href="/report" className={styles.contactBtn}>
          Report a concern
        </Link>
      </section>
    </>
  );
}
