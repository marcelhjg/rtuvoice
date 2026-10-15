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
          { icon: "clock", label: "Last Updated: October 2026" },
          { icon: "clock", label: "Effective: December 13, 2026" },
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
          <p>Concerns in five categories: Academic, Facilities &amp; Infrastructure, Administrative, Student Life, and Other.</p>
          <Callout tone="warning">
            Personal matters are best handled elsewhere. Harassment, bullying, and discrimination are best brought to the
            Guidance Office or OSA, not to this system.
          </Callout>
          <Callout tone="warning">
            RTU VOICE is not an emergency service. If someone is in danger, contact campus security or local emergency
            services right away. Submissions are not monitored in real time.
          </Callout>
        </LegalSection>

        <LegalSection n={4} title="Evidence files">
          <p>
            You may attach JPG/PNG images, MP3/WAV voice messages, PDFs and MP4 videos. The total limit is{" "}
            <strong>5 MB per submission.</strong> Do not upload files that show other people&apos;s private information.
          </p>
        </LegalSection>

        <LegalSection n={5} title="Be honest and respectful">
          <ul>
            <li>Spam, false reports and abusive content will be rejected and permanently deleted after 30 days.</li>
            <li>Authorized administrators can see who submitted a concern through an internal link, so they can follow up and investigate abuse.</li>
            <li>Serious misuse may be referred to the university&apos;s discipline process under the Student Handbook.</li>
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

        <LegalSection n={7} title="Anonymity">
          <p>
            Concerns are anonymous to the public, other students, and departments, but not to authorized administrators. See
            the <Link href="/privacy">Privacy Notice</Link> for details.
          </p>
        </LegalSection>

        <LegalSection n={8} title="Your content">
          <p>
            You keep ownership of what you write. You give RTU VOICE and the university permission to use it to process your
            concern and to produce anonymized statistics and reports.
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
            terms. These terms follow the laws of the Republic of the Philippines, including the Data Privacy Act of 2012.
          </p>
        </LegalSection>

        <LegalSection n={12} title="How concerns are handled">
          <p>
            An administrator reviews your concern and either rejects it with a reason or assigns it to a department. The
            department updates the status (In Progress, Resolved) and may post update messages for you. AI helps set priority
            and write summaries, but staff make the final decisions, and we cannot guarantee the AI is always accurate.
            Submitting a concern does not guarantee a specific outcome or response time.
          </p>
        </LegalSection>

        <LegalSection n={13} title="Public dashboard">
          <p>
            Other logged-in students can see an AI-written, depersonalized title and summary of your concern and its status.
            You can opt out with the checkbox on the concern form. Update messages from departments are never shown publicly.
          </p>
        </LegalSection>

        <LegalSection n={14} title="Emails">
          <p>
            We email you OTP codes, status changes and new department updates. Emails are short and contain no links, so you
            should always log in to RTU Voice yourself.
          </p>
        </LegalSection>

        <LegalSection n={15} title="Changes">
          <p>
            We may update these terms. If you keep using RTU VOICE after a change, you accept the new terms. We will tell
            you about important changes in the system. Questions:{" "}
            <a href="mailto:RTUVoice@gmail.com">RTUVoice@gmail.com</a>.
          </p>
        </LegalSection>
      </LegalBody>
    </>
  );
}
