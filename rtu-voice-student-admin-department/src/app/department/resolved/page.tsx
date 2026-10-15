import type { Metadata } from "next";
import { DepartmentList } from "@/components/department/DepartmentQueue";

export const metadata: Metadata = { title: "Resolved" };

export default function Page() {
  return <DepartmentList kind="resolved" />;
}
