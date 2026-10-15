import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SuperadminShell } from "@/components/admin/SuperadminShell";

export const metadata: Metadata = {
  title: { default: "Superadmin Portal", template: "%s · RTU Voice Superadmin" },
};

export default function SuperadminLayout({ children }: { children: ReactNode }) {
  return <SuperadminShell>{children}</SuperadminShell>;
}
