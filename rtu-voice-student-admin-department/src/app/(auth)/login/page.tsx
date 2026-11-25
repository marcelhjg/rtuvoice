import type { Metadata } from "next";
import { Suspense } from "react";
import { redirectIfAuthenticated } from "@/features/auth/guards";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
