import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { LegalBody, LegalHero, LegalSection, legalStyles as s } from "@/components/legal/Legal";

export const metadata: Metadata = { title: "Privacy Notice" };

type Cell = "yes" | "no" | { text: string };
const AUDIENCES = ["You", "Other logged-in students", "Department staff", "Administrators"] as const;
const ROWS: { info: string; cells: [Cell, Cell, Cell, Cell] }[] = [
  { info: "Your name, RTU email, and account link", cells: ["yes", "no", "no", "yes"] },
  { info: "Original title, description, and evidence", cells: ["yes", "no", "yes", "yes"] },
  { info: "AI-written title and summary", cells: ["yes", { text: "Only if you share" }, "no", "yes"] },
  { info: "Category, status, and date", cells: ["yes", { text: "Only if you share" }, "yes", "yes"] },
  { info: "AI priority", cells: ["no", "no", "yes", "yes"] },
  { info: "Department update messages", cells: ["yes", "no", "yes", "yes"] },
];

function CellView({ cell }: { cell: Cell }) {
  const label = cell === "yes" ? "Yes" : cell === "no" ? "No" : cell.text;
  if (cell === "yes")
    return (
      <span className={`${s.cellResult} ${s.yes}`} aria-label={label}>
        <Icon name="check" size={20} strokeWidth={2} title="Can see" />
        <span className={s.cellText}>{label}</span>
      </span>
    );
  if (cell === "no")
    return (
      <span className={`${s.cellResult} ${s.no}`} aria-label={label}>
        <Icon name="x" size={20} strokeWidth={2} title="Cannot see" />
        <span className={s.cellText}>{label}</span>
      </span>
    );
  return (
    <span className={`${s.cellResult} ${s.cond}`}>
      <span className={s.cellText}>{label}</span>
    </span>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <LegalHero
        eyebrow="LEGAL"
        title="Privacy Notice"
        lead="Plain language on what we collect, who can see it, and how long we keep it."
        chips={[
          { icon: "clock", label: "Last Updated: November 25, 2026" },
          { icon: "clock", label: "Effective: November 26, 2026" },
          { icon: "shield", label: "Data Privacy Act of 2012" },
        ]}
      />
      <LegalBody>
        <LegalSection n={1} title="Who we are">
          <p>
            RTU Voice is a student concern and feedback system and a capstone project of Group 4Voices, BSIT, for Rizal
            Technological University-Pasig Campus.
          </p>
        </LegalSection>

        <LegalSection n={2} title="What we collect">
          <ul>
            <li>
              <span className={s.k}>Account information:</span> your first and last name, @rtu.edu.ph email, password
              authentication managed by Supabase Auth, and one-time-code (OTP) records.
            </li>
            <li>
              <span className={s.k}>Complaint information:</span> title, category, description, evidence files, tracking ID,
              status and dates, department updates, and activity-log reasons.
            </li>
            <li>
              <span className={s.k}>Account link and choices:</span> the link between your account and each complaint, and
              whether you opt in to sharing a complaint on the dashboard.
            </li>
            <li>
              <span className={s.k}>AI results:</span> priority, and, for shared complaints, an AI-written title and summary.
            </li>
          </ul>
          <p>
            Evidence may be JPG, PNG, WebP, MP3, M4A, WAV, PDF, or MP4, up to 5 MB total per complaint. Students see their
            own file names; staff see neutral labels such as “Evidence 1.”
          </p>
        </LegalSection>

        <LegalSection n={3} title="Why we use your information">
          <ul>
            <li>To create and secure your account, verify your RTU email, and let you view your complaint history.</li>
            <li>To review, assign, handle, and follow up on complaints, including sending status and department-update emails.</li>
            <li>When an administrator assigns a complaint, to send its original title and description to an AI service for a priority result.</li>
            <li>
              For complaints you choose to share, to create an AI-written title and summary for the logged-in student dashboard.
            </li>
            <li>To notify administrators when a department returns a complaint.</li>
          </ul>
        </LegalSection>

        <LegalSection n={4} title="Who can see what">
          <p>
            Complaints are pseudonymous, not anonymous: each complaint is linked to the student’s account. Administrators
            can use that link to follow up. Department staff do not receive the account link or the student’s name, email, or
            account details. However, information you choose to include in a complaint or file may identify you to staff.
          </p>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">Information</th>
                  {AUDIENCES.map((audience) => (
                    <th scope="col" key={audience}>{audience}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.info}>
                    <th scope="row" className={s.rowHead}>{row.info}</th>
                    {row.cells.map((cell, index) => (
                      <td key={index}><CellView cell={cell} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={s.tableCards} role="list" aria-label="Who can see what">
            {ROWS.map((row) => (
              <article key={row.info} className={s.tableCard} role="listitem">
                <h3 className={s.tableCardTitle}>{row.info}</h3>
                <dl className={s.tableCardGrid}>
                  {AUDIENCES.map((audience, index) => (
                    <div key={audience} className={s.tableCardCell}>
                      <dt>{audience}</dt>
                      <dd><CellView cell={row.cells[index]} /></dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
          <p className={s.tableNote}>
            Only logged-in students can view the dashboard. For a complaint shared by its student, it shows the AI-written
            title and summary, category, status, and date—not the student’s name, original text, or priority. The general
            public cannot view the dashboard. Staff assigned to a shared complaint can also see its AI-written title and
            summary.
          </p>
        </LegalSection>

        <LegalSection n={5} title="How complaint identity works">
          <p>
            Your account and complaint are linked internally so administrators can follow up. That account link is not
            provided to department staff or other students. Staff can see the original title, description, and attached
            files for complaints assigned to their department. Adding your name, contact details, or other identifying
            information is your choice; those details, and details visible in a photo, document, or voice recording, can
            identify you to staff.
          </p>
        </LegalSection>

        <LegalSection n={6} title="How long we keep information">
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">How long</th>
                  <th scope="col">What happens after</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row" className={s.rowHead}>Rejected or spam complaints</th>
                  <td>Permanently deleted after 30 days.</td>
                  <td>Permanently deleted.</td>
                </tr>
                <tr>
                  <th scope="row" className={s.rowHead}>Resolved complaints</th>
                  <td>1 year after resolution.</td>
                  <td>
                    Anonymized into <code>complaints_archive</code>. The title, description, evidence, tracking ID, and
                    student link are deleted. Category, department, priority, dates, SLA results, and number of returns
                    are kept in the archive.
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={s.rowHead}>Archived complaints</th>
                  <td>5 years.</td>
                  <td>Permanently deleted.</td>
                </tr>
                <tr>
                  <th scope="row" className={s.rowHead}>Deactivated student accounts</th>
                  <td>
                    The 30-day grace period starts when the account is deactivated. The account remains inactive while
                    complaints remain.
                  </td>
                  <td>
                    The nightly job deletes the profile, login, and OTP records once the grace period has passed and no
                    complaints remain after resolution and anonymization.
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={s.rowHead}><code>users_archive</code> records</th>
                  <td>5 years.</td>
                  <td>
                    Deleted. The archive keeps role, department, join date, deactivation date, archive date, and purge
                    date, without name, email, or a linking ID.
                  </td>
                </tr>
                <tr>
                  <th scope="row" className={s.rowHead}>OTP records</th>
                  <td>The code expires after 10 minutes; its database record may remain after it is no longer usable.</td>
                  <td>
                    Expired records are deleted by a separate scheduled cleanup, apart from account removal. The exact
                    cleanup timing has not been specified.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Department update messages and activity-log reasons are deleted when a complaint is anonymized. The 1-year
            period starts after resolution; a complaint that is still being handled cannot be erased on request.
          </p>
        </LegalSection>

        <LegalSection n={7} title="Security basics">
          <p>
            Supabase Auth manages sign-in. Protected pages and actions check the account’s active status and role on the
            server, and regular database access uses Supabase row-level security. OTP codes are stored as keyed hashes,
            expire after 10 minutes, can be used once, and are limited to three verification attempts. Evidence is stored
            in a private bucket and accessed through short-lived links.
          </p>
        </LegalSection>

        <LegalSection n={8} title="How AI is used">
          <p>
            AI runs when an administrator assigns a complaint. It reads the original title and description and returns a
            priority that administrators and department staff can see. Administrators cannot change that priority.
          </p>
          <p>
            If you opt in to dashboard sharing, the AI also writes a title and summary intended to remove personal details.
            This is not a guarantee that every identifying detail will be removed. The dashboard does not show the original
            title or description, the student’s name, or priority.
          </p>
        </LegalSection>

        <LegalSection n={9} title="Service providers">
          <ul>
            <li>Supabase: database, authentication, and storage.</li>
            <li>Vercel: hosting.</li>
            <li>
              OpenRouter: used when configured; if both services are configured, it is attempted before Groq. OpenRouter
              says it does not use inputs or outputs to train its own models, but the model providers it routes to have
              their own data practices, which can vary by provider.
              See its{" "}
              <a href="https://openrouter.ai/privacy">privacy policy</a> and{" "}
              <a href="https://openrouter.ai/docs/guides/privacy/provider-logging">provider logging information</a>.
            </li>
            <li>
              Groq: if OpenRouter attempts fail and a Groq key is configured, the application sends the complaint text
              directly to Groq as a fallback; Groq is not routed through OpenRouter. Groq says inference data is not
              retained by default, but it may temporarily retain inputs and outputs for up to 30 days for reliability or
              abuse monitoring. Groq offers Zero Data Retention; whether that setting is enabled for RTU Voice has not
              been verified. See{" "}
              <a href="https://console.groq.com/docs/your-data">Groq’s data handling information</a>.
            </li>
            <li>Resend: student status and department-update emails, and administrator notifications when a department returns a complaint.</li>
          </ul>
          <p>
            When AI processing runs, the original title and description are sent to the provider being attempted. Model
            providers used through OpenRouter may have separate retention and training practices.
          </p>
        </LegalSection>

        <LegalSection n={10} title="Your choices and data requests">
          <ul>
            <li>
              <span className={s.k}>Sharing:</span> dashboard sharing is optional and off by default. Leave the checkbox
              unticked to keep your complaint off the dashboard.
            </li>
            <li>
              <span className={s.k}>What to include:</span> adding personal or contact details is your choice. If you
              include them, administrators and the assigned department can see them. Evidence may also identify you.
            </li>
            <li>
              <span className={s.k}>View:</span> History lists your complaints. Your stored account details include your
              first name, last name, and RTU email.
            </li>
            <li>
              <span className={s.k}>Correct:</span> edit your name in Manage Profile. Email cannot be changed in the
              profile; for a wrong email, contact the privacy contact below.
            </li>
            <li>
              <span className={s.k}>Delete:</span> email the privacy contact below. A Super Admin deactivates the account
              immediately. Profile, login, and OTP records are removed by the nightly job only after the 30-day grace
              period has passed and no complaints remain after resolution and anonymization. This can take more than a
              year after the last complaint is resolved.
            </li>
          </ul>
          <p>
            A submitted complaint cannot be withdrawn. If you need a complaint reviewed, contact the admin office.
            You can also reach the RTU Voice team at{" "}
            <a href="mailto:2024-200380@rtu.edu.ph">2024-200380@rtu.edu.ph</a>.
          </p>
        </LegalSection>

        <LegalSection n={11} title="Changes to this notice">
          <p>
            We may update this notice. For important changes, we will notify you in the system and update the date at the
            top of this page.
          </p>
        </LegalSection>

        <LegalSection n={12} title="Contact">
          <p>
            Reach the RTU Voice team and privacy contact at{" "}
            <a href="mailto:2024-200380@rtu.edu.ph">2024-200380@rtu.edu.ph</a>.
          </p>
        </LegalSection>
      </LegalBody>
    </>
  );
}
