import { createClient } from "@/lib/supabase/server";
import { Receipt } from "./Receipt"; // adjust to where Receipt.tsx lives

export default async function SubmittedPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id = "" } = await searchParams;
  const trackingId = id.trim();

  let verified: string | null = null;
  if (trackingId) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("get_my_complaints");
    const rows = (data ?? []) as { tracking_id: string }[];
    if (rows.some((r) => r.tracking_id === trackingId)) verified = trackingId;
  }

  return <Receipt trackingId={verified} />;
}