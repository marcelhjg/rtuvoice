import type { Metadata } from "next";
import { getDepartmentAccounts } from "@/actions/superAdminActions";
import { PAGE_SIZE } from "@/features/shared/sharedUtils";
import { DepartmentsView } from "./DepartmentsView";

export const metadata: Metadata = { title: "Departments" };

export default async function DepartmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const status = sp.status === "active" || sp.status === "inactive" ? sp.status : "all";
  const isActive = status === "all" ? undefined : status === "active";

  const res = await getDepartmentAccounts({ search: sp.q, isActive, page });

  return (
    <DepartmentsView
      rows={res.success ? res.rows : []}
      total={res.success ? res.total : 0}
      overallTotal={res.success ? res.overallTotal : 0}
      page={res.success ? res.page : page}
      pageSize={PAGE_SIZE}
      error={res.success ? null : res.message}
    />
  );
}
