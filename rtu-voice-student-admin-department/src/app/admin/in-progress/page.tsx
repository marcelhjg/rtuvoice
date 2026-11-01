import type { Metadata } from "next";
import { ComplaintList } from "@/components/admin/ComplaintList";

export const metadata: Metadata = { title: "In progress" };

export default function Page() {
  return <ComplaintList kind="progress" />;
}
