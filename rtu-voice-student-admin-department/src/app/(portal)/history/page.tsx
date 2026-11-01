import { getHistory } from "@/actions/studentActions";
import { createClient } from "@/lib/supabase/server";
import { HistoryTable } from "./HistoryTable";

export default async function HistoryPage() {
  const res = await getHistory();

  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("id, category");
  const categoryNames: Record<number, string> = Object.fromEntries(
    ((data ?? []) as { id: number; category: string }[]).map((c) => [c.id, c.category])
  );

  return (
    <HistoryTable
      rows={res.historyData ?? []}
      categoryNames={categoryNames}
      loadError={res.success ? null : res.message}
    />
  );
}