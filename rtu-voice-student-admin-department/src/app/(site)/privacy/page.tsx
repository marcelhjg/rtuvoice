import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { LegalBody, LegalHero, LegalSection, legalStyles as s } from "@/components/legal/Legal";

export const metadata: Metadata = { title: "Privacy Notice" };

type Cell = "yes" | "no" | { text: string };
const ROWS: { info: string; cells: [Cell, Cell, Cell, Cell] }[] = [
  { info: "Your name and email", cells: ["yes", "no", "no", { text: "Authorized only" }] },
  { info: "Concern title, description and files", cells: ["yes", "no", "yes", "yes"] },
  { info: "AI title and public summary", cells: ["yes", { text: "Only if you share" }, "yes", "yes"] },
  // Figma shows a check for "You" here, but the note under the table and the SRS say priority is never shown to students.
  { info: "Priority level (set by AI)", cells: ["no", "no", "yes", "yes"] },
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
          { icon: "clock", label: "Last Updated: October 2026" },
          { icon: "clock", label: "Effective: December 13, 2026" },
          { icon: "shield", label: "Data Privacy Act of 2012" },
        ]}
      />
      <LegalBody>
        <LegalSection n={1} title="Who this covers">
          <p>
            This notice explains how RTU Voice handles the information of students who register and submit concerns. RTU
            Voice is a project of Group 4Voices, BSIT, for Rizal Technological University-Pasig Campus.
          </p>
        </LegalSection>

        <LegalSection n={2} title="What we collect">
          <ul>
            <li>
              <span className={s.k}>Account details:</span> your name and @rtu.edu.ph email.
            </li>
            <li>
              <span className={s.k}>Your concerns:</span> the title, category, description and any files you attach (up to 5 MB per submission).
            </li>
            <li>
              <span className={s.k}>Activity:</span> status changes, department updates and the tracking ID that links them.
            </li>
          </ul>
        </LegalSection>

        <LegalSection n={3} title="Who can see what">
          <p>
            Every concern is identity-shielded. You are not anonymous to the system, but your identity is hidden from everyone
            who does not need it.
          </p>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">Information</th>
                  <th scope="col">You</th>
                  <th scope="col">Other students and public dashboard</th>
                  <th scope="col">Department</th>
                  <th scope="col">Administrators</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.info}>
                    <th scope="row" className={s.rowHead}>
                      {r.info}
                    </th>
                    {r.cells.map((c, i) => (
                      <td key={i}>
                        <CellView cell={c} />
                      </td>
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
                  {(["You", "Other students and public dashboard", "Department", "Administrators"] as const).map((audience, i) => (
                    <div key={audience} className={s.tableCardCell}>
                      <dt>{audience}</dt>
                      <dd>
                        <CellView cell={row.cells[i]} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
          <p className={s.tableNote}>
            Departments see only the concerns assigned to them. Priority level is never shown to students, including on your own concerns.
          </p>
        </LegalSection>

        <LegalSection n={4} title="How we keep you shielded">
          <p>
            Your account and your concern are linked internally so authorized administrators can follow up, investigate abuse,
            and respond to serious cases, and so you can use the Status Tracker and History pages. That link is hidden from
            other students, the public, and the department handling your concern. After one academic year from resolution, we
            remove the link to your identity.
          </p>
        </LegalSection>

        <LegalSection n={5} title="How long we keep it">
          <div className={s.retention}>
            <div className={s.retainCard}>
              <p className={s.retainHead}>30 Days</p>
              <p className={s.retainText}>Rejected or spam concerns are permanently deleted.</p>
            </div>
            <Icon name="arrow-right" size={22} className={s.arrow} />
            <div className={s.retainCard}>
              <p className={s.retainHead}>1 academic year</p>
              <p className={s.retainText}>Active and resolved concerns are kept for one academic year after resolution.</p>
            </div>
            <Icon name="arrow-right" size={22} className={s.arrow} />
            <div className={s.retainCard}>
              <p className={s.retainHead}>3 to 5 years</p>
              <p className={s.retainText}>Data is anonymized: your link and identifiers are removed. Kept for aggregate trend reports only.</p>
            </div>
          </div>
          <p className={s.legalShort}>Verification codes (OTP) expire after 10 minutes.</p>
        </LegalSection>

        <LegalSection n={6} title="How we protect it">
          <ul>
            <li>Connections are encrypted, and access is limited by role through database-level security rules.</li>
            <li>The public cannot read anything without logging in.</li>
            <li>We follow the Data Privacy Act of 2012.</li>
            <li>No system is completely secure. If a data breach affects you, we will notify you and the National Privacy Commission as the law requires.</li>
          </ul>
        </LegalSection>

        <LegalSection n={7} title="How AI is used">
          <p>
            When an administrator assigns a department, an AI model reads the concern to suggest a priority level for staff and
            to write a short, depersonalized title and summary for the public dashboard. A person always decides where a concern
            goes. Please don&apos;t put names or contact details in your description. Your concern text is sent to the AI service
            for analysis. We cannot guarantee the AI is always accurate; staff make the final decisions.
          </p>
        </LegalSection>

        <LegalSection n={8} title="Service providers we use">
          <p>
            We use trusted third-party services to run RTU Voice. They process data on our behalf and only for these purposes:
          </p>
          <ul>
            <li>Supabase: database, authentication, and file storage.</li>
            <li>Vercel: website hosting.</li>
            <li>Resend: sending verification and notification emails.</li>
            <li>OpenRouter and its AI model providers: analyzing your concern to estimate priority and write a summary.</li>
          </ul>
        </LegalSection>

        <LegalSection n={9} title="Your rights">
          <p>
            Under the Data Privacy Act of 2012 (Republic Act No. 10173), you have the right to be informed, to access your
            personal data, to object to its processing, to correct inaccurate data, to request that your data be suspended,
            withdrawn, blocked, or deleted, to receive your data in a portable format, to claim compensation for damages caused
            by unlawful processing, and to file a complaint with the National Privacy Commission at privacy.gov.ph. To use any
            of these rights, contact Rizal Technological University – Pasig Campus at pasig_campus@rtu.edu.ph. Some data cannot
            be deleted right away, such as an open concern or records we must keep for legal reasons. We will explain this if it applies.
          </p>
        </LegalSection>

        <LegalSection n={10} title="Changes to this notice">
          <p>
            We may update this notice. When we make important changes, we will tell you in the system and update the date at the
            top of this page.
          </p>
        </LegalSection>

        <LegalSection n={11} title="Contact">
          <p>
            Questions about your data? Reach the project team at <a href="mailto:RTUVoice@gmail.com">RTUVoice@gmail.com</a>. For general inquiries or concerns,
            you may contact Rizal Technological University – Pasig Campus at pasig_campus@rtu.edu.ph.
          </p>
        </LegalSection>
      </LegalBody>
    </>
  );
}
