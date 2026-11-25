import type { Metadata } from "next";
import { getStudentAccounts } from "@/actions/superAdminActions";
import { PAGE_SIZE } from "@/features/shared/sharedUtils";
import { StudentsAccountsView } from "./StudentsAccountsView";

export const metadata: Metadata = { title: "Students' Accounts" };

export default async function StudentsAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const status = sp.status === "all" ? "all" : sp.status === "inactive" ? "inactive" : "active";
  const isActive = status === "all" ? undefined : status === "active";
  const result = await getStudentAccounts({ search: sp.q, isActive, page });

  return (
    <StudentsAccountsView
      rows={result.success ? result.rows : []}
      total={result.success ? result.total : 0}
      overallTotal={result.success ? result.overallTotal : 0}
      page={result.success ? result.page : page}
      pageSize={PAGE_SIZE}
      error={result.success ? null : result.message}
    />
  );
}
