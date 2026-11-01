import { Suspense } from "react";
import { PublicDashboard } from "./PublicDashboard";
import { getPublicComplaints } from "@/actions/studentActions"; // your real path
import { PublicConcern } from "@/features/student/studentTypes";

export default async function PublicDashboardPage() {
  const { rows, total } = await getPublicComplaints(0, "", "");

  return (
    <Suspense>
      <PublicDashboard initialRows={rows as PublicConcern[]} total={total ?? 0} />
    </Suspense>
  );
}
