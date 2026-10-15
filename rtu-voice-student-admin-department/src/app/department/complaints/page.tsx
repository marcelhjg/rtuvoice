import type { Metadata } from "next";
import { DepartmentList } from "@/components/department/DepartmentQueue";

export const metadata: Metadata = { title: "Total complaints" };

export default function Page() {
  return <DepartmentList kind="total" />;
}
