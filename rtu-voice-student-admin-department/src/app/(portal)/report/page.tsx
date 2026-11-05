import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/Icon";
import ReportForm from "./ReportForm";

function ReportUnavailable() {
  return (
    <div className="container">
      <div className="page-head">
        <h1 className="page-title">Report a concern</h1>
      </div>
      <div className="alert alert-warning" role="alert">
        <Icon name="alert-triangle" size={22} />
        <div>
          <strong>The report form is temporarily unavailable.</strong>
          <br />
          We couldn&apos;t load the report categories. Please try again, or return to your dashboard.
        </div>
      </div>
      <div className="route-state-actions">
        <a href="/report" className="btn btn-primary">
          Try again
        </a>
        <Link href="/dashboard" className="btn btn-outline">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}

export default async function ReportPage() {
  await connection();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    console.error("Could not initialize the report form: Supabase environment variables are missing.");
    return <ReportUnavailable />;
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase.from("categories").select("id, category").order("id");

    if (error || !data?.length) {
      console.error("Could not load report categories:", error ?? "No categories were returned.");
      return <ReportUnavailable />;
    }

    return <ReportForm categories={data as { id: number; category: string }[]} />;
  } catch (error) {
    console.error("Could not initialize the report form:", error);
    return <ReportUnavailable />;
  }
}