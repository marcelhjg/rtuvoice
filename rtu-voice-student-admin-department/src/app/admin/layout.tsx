import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, ROLE_HOME } from "@/features/auth/guards";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: { default: "Central Admin Console", template: "%s · RTU Voice Admin" },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const me = await getCurrentUser();

  if (!me) redirect("/login");
  if (me.role !== "admin") redirect(ROLE_HOME[me.role]);

  return (
    <AdminShell user={{ firstName: me.firstName, lastName: me.lastName, email: me.email ?? "" }}>
      {children}
    </AdminShell>
  );
}