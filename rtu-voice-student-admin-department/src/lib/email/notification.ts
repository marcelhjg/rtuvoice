import "server-only";
import { Resend } from "resend";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

const resend = new Resend(requireEnv("RESEND_API_KEY"));
const MAIL_FROM = requireEnv("MAIL_FROM");
const PORTAL_URL = process.env.NEXT_PUBLIC_APP_URL?.trim(); // optional

type EmailResult = { success: boolean; error?: string };

type Recipient = {
  rtu_email: string;
  first_name: string;
  last_name: string;
};

// ---------- shared sender ----------
async function sendEmail(
  to: string,
  subject: string,
  lines: string[],
  tag: string
): Promise<EmailResult> {
  const body = [...lines, ...(PORTAL_URL ? ["", `Portal: ${PORTAL_URL}`] : []), "", "Thank you."].join("\n");

  try {
    const { error } = await resend.emails.send({
      from: MAIL_FROM,
      to,
      subject,
      text: body,
    });

    if (error) {
      console.error(`[${tag}] Resend error:`, error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error(`[${tag}] Unexpected error:`, err);
    return { success: false, error: "Unexpected error sending email" };
  }
}

const fullName = (r: Recipient) => `${r.first_name} ${r.last_name}`;

// ---------- 1. New assignment (department head) ----------
export async function sendAssignmentEmail(
  dept: Recipient & { tracking_id: string }
) {
  return sendEmail(
    dept.rtu_email,
    `Action Required: New Complaint Assigned (#${dept.tracking_id})`,
    [
      `Hi ${fullName(dept)},`,
      "",
      `A new complaint (#${dept.tracking_id}) has been assigned to your department.`,
      "Please review it in the portal at your earliest convenience.",
    ],
    "sendAssignmentEmail"
  );
}

// ---------- 2. Reassignment (previous + new department) ----------
export async function sendReassignmentEmails(args: {
  trackingId: string;
  previousDept: Recipient;
  newDept: Recipient;
}) {
  const { trackingId, previousDept, newDept } = args;

  const [previous, current] = await Promise.all([
    sendEmail(
      previousDept.rtu_email,
      `Complaint Rerouted (#${trackingId})`,
      [
        `Hi ${fullName(previousDept)},`,
        "",
        `Complaint #${trackingId} has been rerouted to another department.`,
        "No further action is required from your department.",
      ],
      "sendReassignmentEmails:previous"
    ),
    sendEmail(
      newDept.rtu_email,
      `Action Required: Complaint Rerouted to Your Department (#${trackingId})`,
      [
        `Hi ${fullName(newDept)},`,
        "",
        `Complaint #${trackingId} has been rerouted to your department.`,
        "Please review it in the portal at your earliest convenience.",
      ],
      "sendReassignmentEmails:new"
    ),
  ]);

  return { previous, current };
}

// ---------- 3. Status updated (student) ----------
export async function sendStatusUpdateEmail(
  student: Recipient & { tracking_id: string; status: string }
) {
  return sendEmail(
    student.rtu_email,
    `Complaint Status Updated (#${student.tracking_id})`,
    [
      `Hi ${fullName(student)},`,
      "",
      `The status of your complaint (#${student.tracking_id}) has been updated to: ${student.status}.`,
    ],
    "sendStatusUpdateEmail"
  );
}

// ---------- 4. New update message (student) ----------
export async function sendUpdateMessageEmail(
  student: Recipient & { tracking_id: string }
) {
  return sendEmail(
    student.rtu_email,
    `New Update on Your Complaint (#${student.tracking_id})`,
    [
      `Hi ${fullName(student)},`,
      "",
      `The department has posted a new update on your complaint (#${student.tracking_id}).`,
      "Please check the portal to view it.",
    ],
    "sendUpdateMessageEmail"
  );
}

// ---------- 5. Complaint returned to admin (from department) ----------
export async function sendReturnedToAdminEmails(args: {
  trackingId: string;
  admins: Recipient[];
  departmentName?: string; // optional
  reason?: string | null;  // optional
}) {
  const { trackingId, admins, departmentName, reason } = args;

  const results = await Promise.all(
    admins.map((admin) =>
      sendEmail(
        admin.rtu_email,
        `Action Required: Complaint Returned (#${trackingId})`,
        [
          `Hi ${fullName(admin)},`,
          "",
          `Complaint #${trackingId} has been returned to admin${departmentName ? ` by ${departmentName}` : ""}.`,
          ...(reason ? [`Reason: ${reason}`] : []),
          "Please review it in the portal and reassign it if needed.",
        ],
        "sendReturnedToAdminEmails"
      )
    )
  );

  return results;
}