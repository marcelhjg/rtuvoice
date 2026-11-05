import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/guards"; // wherever getCurrentUser lives
import { ProfileForm } from "@/components/ProfileForm";

export default async function ProfilePage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  return <ProfileForm firstName={me.firstName ?? ""} lastName={me.lastName ?? ""} email={me.email ?? ""} />;
}