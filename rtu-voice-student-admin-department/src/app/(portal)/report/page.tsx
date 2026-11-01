import { createClient } from "@/lib/supabase/server";
import ReportForm from "./ReportForm"

export default async function ReportPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("id, category").order("id");
  return <ReportForm categories={(data ?? []) as { id: number; category: string }[]} />;
} 