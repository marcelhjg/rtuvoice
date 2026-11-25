import { redirectIfAuthenticated } from "@/features/auth/guards";
import { RegisterForm } from "./RegisterForm";

export default async function RegisterPage() {
  await redirectIfAuthenticated();

  return <RegisterForm />;
}
