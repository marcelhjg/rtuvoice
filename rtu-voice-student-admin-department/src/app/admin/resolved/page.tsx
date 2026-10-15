import type { Metadata } from "next";
import { ComplaintList } from "@/components/admin/ComplaintList";

export const metadata: Metadata = { title: "Resolved" };

export default function Page() {
  return <ComplaintList kind="resolved" />;
}
