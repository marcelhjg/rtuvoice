import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

export const createAdminClient = async () => {
  // Bypasses Row Level Security (RLS) entirely
    return createClient(
    supabaseUrl!,
    supabaseKey!
  );
};