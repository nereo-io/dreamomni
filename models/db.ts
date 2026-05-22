import { createClient } from "@supabase/supabase-js";

export function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase URL or SUPABASE_SERVICE_ROLE_KEY is not set"
    );
  }

  const client = createClient(supabaseUrl, supabaseKey);

  return client;
}

export function getSupabaseAdminClient() {
  return getSupabaseClient();
}
