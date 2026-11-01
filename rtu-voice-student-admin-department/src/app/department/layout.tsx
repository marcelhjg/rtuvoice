import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DepartmentShell } from "@/components/department/DepartmentShell";

export const metadata: Metadata = {
  title: { default: "Department Portal", template: "%s · RTU Voice Department" },
};

export default function DepartmentLayout({ children }: { children: ReactNode }) {
  return <DepartmentShell>{children}</DepartmentShell>;
}
