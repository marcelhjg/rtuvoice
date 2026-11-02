import { Icon, type IconName } from "@/components/Icon";
import { CATEGORIES } from "@/lib/types";
import { EVIDENCE_ACCEPT_EXTENSIONS, MAX_TOTAL_BYTES } from "@/features/student/studentTypes";
import styles from "./how-to-submit.module.css";

const EVIDENCE_EXTENSIONS_LABEL = EVIDENCE_ACCEPT_EXTENSIONS.split(",")
  .map((extension) => extension.replace(".", "").toUpperCase())
  .join(", ");
const EVIDENCE_SIZE_MB = MAX_TOTAL_BYTES / (1024 * 1024);

const STEPS: { icon: IconName; title: string; description: string; hint: string }[] = [
  {
    icon: "user",
    title: "Log in with your RTU email.",
    description: "Register once with your RTU email, then log in. Your account keeps your concerns in one place.",
    hint: "No account yet? Tap Register",
  },
  {
    icon: "grid",
    title: "Pick a category.",
    description: "Choose the one that fits best, like Academic, Facilities, or Student Life. Not sure? Pick Others.",
    hint: `${CATEGORIES.length} categories`,
  },
  {
    icon: "file-text",
    title: "Describe your concern.",
    description: "Write a clear title, then explain what happened, where, and when.",
    hint: "Skip names and contact details",
  },
  {
    icon: "upload",
    title: "Attach evidence.",
    description: "Add photos, documents, audio, or video that support your concern.",
    hint: `${EVIDENCE_EXTENSIONS_LABEL} · up to ${EVIDENCE_SIZE_MB} MB`,
  },
  {
    icon: "check",
    title: "Submit and save your tracking ID.",
    description: "You get a tracking ID right away. Use it anytime to follow your concern's status.",
    hint: "Copy it before you leave",
  },
];

const SAMPLE_CATEGORIES = [
  ...CATEGORIES.slice(0, 5),
  CATEGORIES[CATEGORIES.length - 1],
];

export const EVIDENCE_GUIDANCE = `${EVIDENCE_EXTENSIONS_LABEL}, up to ${EVIDENCE_SIZE_MB} MB per submission.`;

export function SampleSubmitForm() {
  return (
    <div className={styles.sampleWrap}>
      <p className={styles.srOnly}>Example of the submit form.</p>
      <div className={styles.sample} aria-hidden="true">
        <div className={styles.sampleHeader}>
          <strong>Report a concern</strong>
          <span className={styles.sampleShield}>
            <Icon name="shield-check" size={15} />
            Your identity stays shielded
          </span>
        </div>
        <div className={styles.sampleBody}>
          <div className={styles.sampleField}>
            <span className={styles.sampleLabel}>Category</span>
            <div className={styles.categoryChips}>
              {SAMPLE_CATEGORIES.map((category) => (
                <span
                  key={category}
                  className={`${styles.categoryChip} ${category === CATEGORIES[1] ? styles.categoryChipSelected : ""}`}
                >
                  {category}
                </span>
              ))}
            </div>
            <span className={styles.stepBadge}>2</span>
          </div>

          <div className={styles.sampleField}>
            <span className={styles.sampleLabel}>Title <span>*</span></span>
            <div className={styles.sampleInput}>e.g. &quot;Leaking roof in Room 305&quot;</div>
            <span className={styles.stepBadge}>3</span>
          </div>

          <div className={styles.sampleField}>
            <span className={styles.sampleLabel}>Details <span>*</span></span>
            <div className={`${styles.sampleInput} ${styles.sampleTextarea}`}>
              Describe what happened, where, and when. Please don&apos;t include names or contact details.
            </div>
          </div>

          <div className={styles.sampleField}>
            <span className={styles.sampleLabel}>Evidence <span className={styles.optional}>(optional)</span></span>
            <div className={styles.sampleDrop}>
              <Icon name="upload" size={21} />
              <span><strong>Click to upload</strong> or drag files here</span>
              <small>{EVIDENCE_GUIDANCE}</small>
              <span className={styles.fileChip}>
                <Icon name="file-text" size={15} />
                fan-photo.jpg · 1.2 MB
              </span>
            </div>
            <span className={styles.stepBadge}>4</span>
          </div>

          <div className={styles.sampleActions}>
            <div className={styles.sampleButton}>Submit concern</div>
            <span className={styles.stepBadge}>5</span>
          </div>
        </div>

        <div className={styles.sampleToast}>
          <span className={styles.toastCheck}><Icon name="check" size={16} strokeWidth={2.5} /></span>
          <span>Concern submitted. Your tracking ID<strong>STU-9PZ2A</strong></span>
        </div>
      </div>
    </div>
  );
}

export function HowToSubmitSection() {
  return (
    <section id="how-to-submit" className={styles.section} aria-labelledby="how-to-submit-heading">
      <header className={styles.heading}>
        <p className={styles.eyebrow}>HOW TO SUBMIT</p>
        <h2 id="how-to-submit-heading">Submit a concern in five steps.</h2>
        <p>Here is exactly what to expect, from logging in to getting your tracking ID.</p>
      </header>

      <div className={styles.content}>
        <ol className={styles.stepList}>
          {STEPS.map((step, index) => (
            <li className={styles.step} key={step.title}>
              <span className={styles.stepIcon} aria-hidden="true">
                <Icon name={step.icon} size={21} strokeWidth={1.8} />
              </span>
              <div className={styles.stepContent}>
                <span className={styles.stepLabel}>STEP {index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <span className={styles.hint}>{step.hint}</span>
              </div>
            </li>
          ))}
        </ol>
        <SampleSubmitForm />
      </div>

      <div className={`alert alert-warning ${styles.tip}`} role="note">
        <Icon name="alert-triangle" size={20} aria-hidden="true" />
        <p>
          <strong>Tip:</strong> avoid names, contact details, and identifying photos or recordings. Clear details and evidence help your concern get reviewed faster.
        </p>
      </div>
    </section>
  );
}
