import type { Metadata } from "next";
import Link from "next/link";
import { Callout, LegalBody, LegalHero, LegalSection } from "@/components/legal/Legal";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <>
      <LegalHero
        eyebrow="LEGAL"
        title="Terms of Use"
        lead="The simple rules for using RTU Voice, so it stays useful and safe for everyone."
        chips={[
          { icon: "clock", label: "Last Updated: November 25, 2026" },
          { icon: "clock", label: "Effective: November 26, 2026" },
          { icon: "users", label: "For RTU—Pasig students" },
        ]}
      />
      <LegalBody>
        <LegalSection n={1} title="Who can use RTU Voice">
          <p>
            Students of Rizal Technological University—Pasig with a valid @rtu.edu.ph email. Administrator and department
            accounts are created by the system administrators, not through sign-up.
          </p>
        </LegalSection>

        <LegalSection n={2} title="Your account">
          <ul>
            <li>Register with your RTU email and verify your account with a one-time code before the account is created.</li>
            <li>Keep your password private. You are responsible for activity on your account.</li>
            <li>Give accurate information when you register.</li>
            <li>Do not create more than one account or use another person&apos;s account.</li>
            <li>Tell us right away if you think someone else is using your account.</li>
          </ul>
        </LegalSection>

        <LegalSection n={3} title="What you can submit">
          <p>
            Concerns in nine categories: Academic, Facilities &amp; Infrastructure, Administrative, Student Life, Safety and Security,
            Technology &amp; Online Systems, Food, Health &amp; Sanitation, Library &amp; Learning Resources, and Others.
          </p>
          <Callout tone="warning">
            Harassment, bullying, discrimination, and illegal activity are not handled here. Report them in person to
            Campus Security, the Guidance Office, or HR.
          </Callout>
          <Callout tone="warning">
            RTU VOICE is not an emergency service. If someone is in danger, contact campus security or local emergency
            services right away. Submissions are not monitored in real time.
          </Callout>
        </LegalSection>

        <LegalSection n={4} title="Evidence files">
          <p>
            You may attach JPG, PNG, WebP, MP3, M4A, WAV, PDF, or MP4 files, up to{" "}
            <strong>5 MB total per complaint.</strong> Staff see neutral labels such as “Evidence 1”; students see their
            own file names. A file can still identify you through a face, voice, or name on a document. Adding identifying
            details is your choice.
          </p>
        </LegalSection>

        <LegalSection n={5} title="Be honest and respectful">
          <ul>
            <li>Rejected or spam complaints are permanently deleted after 30 days.</li>
            <li>Authorized administrators can see who submitted a concern through an internal link, so they can follow up and investigate abuse.</li>
            <li>Whether serious misuse may be referred to a university discipline process is [TO CONFIRM].</li>
          </ul>
        </LegalSection>

        <LegalSection n={6} title="What you must not do">
          <ul>
            <li>Submit false, misleading, or malicious concerns.</li>
            <li>Submit spam, repeated duplicates, or unrelated content.</li>
            <li>Post content that is abusive, threatening, discriminatory, obscene, or defamatory.</li>
            <li>Use the system to harass or expose any person.</li>
            <li>Upload files that contain viruses or harmful code, or that you have no right to share.</li>
            <li>Share other people&apos;s private information without their permission.</li>
            <li>Try to break, overload, or get unauthorized access to the system or other users&apos; data.</li>
            <li>Try to identify other students who submitted concerns.</li>
          </ul>
        </LegalSection>

        <LegalSection n={7} title="Identity and privacy">
          <p>
            Concerns are pseudonymous, not anonymous: each complaint is linked to your account, and authorized
            administrators can use that link to follow up. Department staff do not receive your name, email, account
            details, or the account link, but they can see the complaint title, description, and files assigned to them.
            Details you choose to include may identify you. See the <Link href="/privacy">Privacy Notice</Link> for details.
          </p>
        </LegalSection>

        <LegalSection n={8} title="Your content">
          <p>
            Ownership and any permissions for using submitted content beyond handling your complaint are [TO CONFIRM].
          </p>
        </LegalSection>

        <LegalSection n={9} title="Removing content or access">
          <p>
            We may remove content, reject concerns, or suspend or end accounts that break these terms or put the system or
            other users at risk.
          </p>
        </LegalSection>

        <LegalSection n={10} title="Availability and responsibility">
          <p>
            We work to keep RTU VOICE available, but it may be down for maintenance or technical problems. RTU VOICE is
            provided as is for use within the university. To the extent the law allows, the project team and the university
            are not responsible for losses caused by system downtime, delays in handling a concern, or the actions of other
            users.
          </p>
        </LegalSection>

        <LegalSection n={11} title="Privacy and governing law">
          <p>
            Our <Link href="/privacy">Privacy Notice</Link> explains how we handle your personal data and forms part of these
            terms. Governing-law wording is [TO CONFIRM].
          </p>
        </LegalSection>

        <LegalSection n={12} title="How concerns are handled">
          <p>
            An administrator reviews your concern and either rejects it with a reason or assigns it to a department. The
            department updates the status (In Progress, Resolved) and may post update messages for you. When an
            administrator assigns a complaint, AI reads its original title and description and returns a priority visible to
            administrators and department staff. Administrators cannot change that priority. Submitting a concern does not
            guarantee a specific outcome or response time.
          </p>
          <p>
            A submitted complaint cannot be withdrawn. If you need one reviewed, contact the admin office. Contact details
            are [TO CONFIRM]. A complaint still being handled cannot be erased on request; see the Privacy Notice for the
            deletion process and retention periods.
          </p>
        </LegalSection>

        <LegalSection n={13} title="Public dashboard">
          <p>
            Dashboard sharing is optional and the checkbox is unticked by default. If you opt in, other logged-in students
            can see an AI-written title and summary intended to remove personal details, plus the category, status, and
            date. This is not a guarantee that every identifying detail will be removed. The dashboard does not show your
            name, original text, or priority; the general public cannot view it. If you do not opt in, your complaint is
            not shown there. Department update messages are not shown on the dashboard.
          </p>
        </LegalSection>

        <LegalSection n={14} title="Emails">
          <p>
            We use Resend to email you one-time codes, status changes, and department updates. Administrators are emailed
            when a department returns a complaint. Email content and links may vary by message.
          </p>
        </LegalSection>

        <LegalSection n={15} title="Changes">
          <p>
            We may update these terms and will tell you about important changes in the system. The effect of continued use
            after a change is [TO CONFIRM]. Questions:{" "}
            <a href="mailto:2024-200380@rtu.edu.ph">2024-200380@rtu.edu.ph</a>.
          </p>
        </LegalSection>
      </LegalBody>
    </>
  );
}
