import { Suspense } from "react";
import { AdminDashboard } from "./AdminDashboard";

export default function AdminDashboardPage() {
  return (
    <Suspense>
      <AdminDashboard />
    </Suspense>
  );
}
