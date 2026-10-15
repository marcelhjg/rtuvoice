"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/Icon";
import styles from "./landing.module.css";

/*
 * Only the first answer is written in the Figma file; the other four are collapsed there.
 * Their answers below are drafted from the RTU Voice SRS v3 / roadmap so the accordion
 * works. The project team should review the wording.
 */
const ITEMS = [
  {
    q: "Is it anonymous?",
    a: "Not fully. Your identity is not shown to other students, on the public dashboard, or to the department handling your concern. However, RTU Voice keeps an internal link between your account and your concern so authorized administrators can follow up, investigate abuse, and respond to serious cases.",
  },
  {
    q: "Who sees my concern?",
    a: "Administrators review it and assign it to the right department. The department sees your concern and evidence, not your name. If you choose to share it, other logged-in students see only an AI-written, depersonalized title and summary with its status.",
  },
  {
    q: "What if my concern is personal or urgent?",
    a: "RTU Voice is not an emergency service. If someone is in danger, contact campus security or local emergency services right away. Personal matters such as harassment, bullying, and discrimination are best brought to the Guidance Office or OSA.",
  },
  {
    q: "How do I track it?",
    a: "After you submit, you get a tracking ID (for example STU-A3F1B). Enter it on the Status Tracker page to see the progress timeline and any update from the department. Your History page lists every concern you have submitted.",
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
