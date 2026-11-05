import { getRecentResolvedPublic } from "@/actions/studentActions";
import { getCurrentUser } from "@/features/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { RecentResolvedRow } from "@/features/student/studentTypes";
import { DashboardView } from "./DashboardView";

export default async function DashboardPage() {
  const me = await getCurrentUser();

  const res = await getRecentResolvedPublic();
  const rows = res.success ? (res.data ?? []) : [];

  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("id, name");
  const categoryNames: Record<number, string> = Object.fromEntries(
    ((data ?? []) as { id: number; name: string }[]).map((c) => [c.id, c.name])
  );

  const recent = (rows as RecentResolvedRow[]).map((r) => ({
    id: r.id,
    title: r.ai_title,
    category: categoryNames[r.category_id] ?? "—",
    date: r.created_at,
  }));

  return <DashboardView firstName={me?.firstName ?? ""} recent={recent} loadError={res.success ? null : res.message} />;
}