import type { Metadata } from "next";
import { DepartmentList } from "@/components/department/DepartmentQueue";

export const metadata: Metadata = { title: "In progress" };

export default function Page() {
  return <DepartmentList kind="progress" />;
}
