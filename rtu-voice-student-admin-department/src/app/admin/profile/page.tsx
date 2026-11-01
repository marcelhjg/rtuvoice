import type { Metadata } from "next";
import { ProfileForm } from "@/components/ProfileForm";

export const metadata: Metadata = { title: "Manage Profile" };

export default function AdminProfilePage() {
  return <ProfileForm />;
}
