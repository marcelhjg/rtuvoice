import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser, ROLE_HOME } from "@/features/auth/guards"; // wherever getCurrentUser lives
import { PortalShell } from "@/components/portal/PortalShell"; // keep your existing import path

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const me = await getCurrentUser();

  if (!me) redirect("/login");
  if (me.role !== "student") redirect(ROLE_HOME[me.role]); // staff can't open student pages

  return (
    <PortalShell user={{ firstName: me.firstName, lastName: me.lastName, email: me.email ?? "" }}>
      {children}
    </PortalShell>
  );
}