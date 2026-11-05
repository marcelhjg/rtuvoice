import Link from "next/link";
import { destinationFor, getCurrentUser } from "@/features/auth/guards";

/**
 * 404 buttons. One link back to the right place for whoever is signed in: the student dashboard,
 * the admin console, the department portal or the Super Admin portal; the landing page when signed out.
 * Runs on the server, so it can read the session.
 */
export async function NotFoundActions() {
  let href = "/";
  let label = "Go to home page";

  try {
    const me = await getCurrentUser();
    if (me) {
      href = destinationFor(me.role, null);
      label = me.role === "student" ? "Go to dashboard" : "Go to your portal";
    }
  } catch {
    // If the session can't be read, the landing page is a safe place to send them.
  }

  return (
    <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 28, flexWrap: "wrap" }}>
      <Link href={href} className="btn btn-primary" style={{ minHeight: 44 }}>
        {label}
      </Link>
    </div>
  );
}