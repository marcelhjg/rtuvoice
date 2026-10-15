import { Suspense } from "react";
import { PublicDashboard } from "./PublicDashboard";

export default function PublicDashboardPage() {
  return (
    <Suspense>
      <PublicDashboard />
    </Suspense>
  );
}
