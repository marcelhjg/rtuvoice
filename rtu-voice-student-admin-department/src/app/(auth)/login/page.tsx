import { redirect } from "next/navigation";
import { getCurrentUser, destinationFor } from "@/features/auth/guards"; // wherever getCurrentUser lives
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; registered?: string; reset?: string }>;
}) {
  const { next, registered, reset } = await searchParams;

  const me = await getCurrentUser();
  if (me) redirect(destinationFor(me.role, next ?? null));

  const notice = registered === "1" ? "registered" : reset === "1" ? "reset" : null;

  return <LoginForm next={next ?? null} notice={notice} />;
}