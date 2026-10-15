import type { Metadata } from "next";
import { NeedsAttention } from "@/components/department/DepartmentQueue";

export const metadata: Metadata = { title: "Needs attention" };

export default function Page() {
  return <NeedsAttention />;
}
