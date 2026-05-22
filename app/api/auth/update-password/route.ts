import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { respData, respErr } from "@/lib/resp";

function getSupabaseServiceClient() {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase URL or SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(req: NextRequest) {
  try {
    const { access_token, refresh_token, password } = await req.json();

    if (!access_token || !refresh_token || !password) {
      return respErr("invalid params");
    }

    if (typeof password !== "string" || password.length < 6) {
      return respErr("Password must be at least 6 characters");
    }

    const supabase = getSupabaseServiceClient();
    const { error: sessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (sessionError) {
      return respErr(sessionError.message || "Invalid or expired reset link");
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return respErr(error.message || "Failed to reset password");
    }

    return respData({ success: true });
  } catch (error: any) {
    return respErr(error.message || "Failed to reset password");
  }
}
