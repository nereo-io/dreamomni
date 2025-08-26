import { getSupabaseClient } from "./db";
import { VideoEffect, VideoEffectStatus } from "@/types/video-effect";

export async function getEffectConfigBySlug(
  slug: string,
  locale: string
): Promise<VideoEffect | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("effect_configs")
    .select("*")
    .eq("slug", slug)
    .eq("locale", locale)
    .eq("status", "online")
    .single();

  if (error || !data) {
    console.error("Error fetching effect config:", error);
    return null;
  }

  return data as VideoEffect;
}

export async function getAllEffectConfigs(
  locale: string
): Promise<VideoEffect[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("effect_configs")
    .select("*")
    .eq("locale", locale)
    .eq("status", VideoEffectStatus.Online)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching effect configs:", error);
    return [];
  }

  if (!data) {
    console.log("No effect configs found for locale:", locale);
    return [];
  }

  console.log(`Found ${data.length} effect configs for locale ${locale}`);
  return data as VideoEffect[];
}

export async function getEffectConfigsByCategory(
  category: string,
  locale: string
): Promise<VideoEffect[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("effect_configs")
    .select("*")
    .eq("category", category)
    .eq("locale", locale)
    .eq("status", "online")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Error fetching effect configs by category:", error);
    return [];
  }

  return data as VideoEffect[];
}

export async function getHotEffectConfigs(
  locale: string,
  limit: number = 6
): Promise<VideoEffect[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("effect_configs")
    .select("*")
    .eq("locale", locale)
    .eq("status", VideoEffectStatus.Online)
    .eq("is_hot", true)
    .order("display_order", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Error fetching hot effect configs:", error);
    return [];
  }

  if (!data) {
    console.log("No hot effect configs found for locale:", locale);
    return [];
  }

  console.log(`Found ${data.length} hot effect configs for locale ${locale}`);
  return data as VideoEffect[];
}

export async function getEffectUsageStats(
  effectId: string
): Promise<{ total_uses: number; unique_users: number }> {
  const supabase = getSupabaseClient();
  const { data, error, count } = await supabase
    .from("video_generations")
    .select("user_id", { count: "exact", head: false })
    .eq("effect_id", effectId);

  if (error) {
    console.error("Error fetching effect usage stats:", error);
    return { total_uses: 0, unique_users: 0 };
  }

  const totalUses = count || 0;
  const uniqueUsers = data ? new Set(data.map(row => row.user_id)).size : 0;

  return {
    total_uses: totalUses,
    unique_users: uniqueUsers
  };
}