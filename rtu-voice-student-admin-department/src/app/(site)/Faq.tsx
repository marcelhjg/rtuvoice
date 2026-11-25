"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/Icon";
import styles from "./landing.module.css";

/*
 * facts question and answer.
 */
const ITEMS = [
  {
    q: "Is it anonymous?",
    a: "No. Complaints are pseudonymous, not anonymous: each is linked to your account, and administrators can use that link to follow up. Department staff do not receive your name, email, or account link, but details in your complaint or files may identify you.",
  },
  {
    q: "Who sees my concern?",
    a: "Administrators review your original title, description, and files, and assign the concern to a department. The assigned department can see those complaint details and files, but not your account link, name, or email. If you opt in to sharing, other logged-in students see an AI-written title and summary, category, status, and date—not your name, original text, or priority.",
  },
  {
    q: "What concerns are not handled here?",
    a: "Harassment, bullying, discrimination, and illegal activity are not handled here. Report them in person to Campus Security, the Guidance Office, or HR.",
  },
  {
    q: "What does the AI process?",
    a: "When an administrator assigns a complaint, an AI service reads its original title and description to return a priority visible to administrators and department staff. Administrators cannot change the priority. For complaints you choose to share, AI also writes a title and summary intended to remove personal details; it is not guaranteed to remove every identifying detail. The app uses OpenRouter when configured and may send the text directly to Groq as a fallback. See the Privacy Notice for provider data-handling details.",
  },
  {
    q: "How do I track it?",
    a: "After you submit, you get a tracking ID (for example STU-A3F1B). Enter it on the Status Tracker page to see the progress timeline and any update from the department. Your History page lists your complaints while they remain linked to your account. See the Privacy Notice for how long records are kept.",
  },
  {
    q: "Do I need an RTU email?",
    a: "Yes. Only official @rtu.edu.ph accounts can register. You verify your email with a one-time code before the account is created.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(null);
  const baseId = useId();

  return (
    <div className={styles.faqList}>
      {ITEMS.map((item, i) => {
        const isOpen = open === i;
        const panelId = `${baseId}-panel-${i}`;
        const btnId = `${baseId}-btn-${i}`;
        return (
          <div key={item.q} className={`${styles.faqItem} ${isOpen ? styles.faqOpen : ""}`}>
            <h3 className={styles.faqHeading}>
              <button
                id={btnId}
                type="button"
                className={styles.faqButton}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                <span>{item.q}</span>
                <Icon name={isOpen ? "x" : "plus"} size={isOpen ? 16 : 20} strokeWidth={2} className={styles.faqIcon} />
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={btnId} hidden={!isOpen} className={styles.faqPanel}>
              {item.a}
            </div>
          </div>
        );
      })}
    </div>
  );
}
