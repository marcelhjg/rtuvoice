import type { Metadata } from "next";
import { ComplaintList } from "@/components/admin/ComplaintList";

export const metadata: Metadata = { title: "Assigned" };

export default function Page() {
  return <ComplaintList kind="assigned" />;
}
