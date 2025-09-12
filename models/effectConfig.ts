import { getSupabaseClient } from "./db";
import { VideoEffect, VideoEffectStatus } from "@/types/video-effect";

export async function getEffectConfigBySlug(
  slug: string,
  locale: string
): Promise<VideoEffect | null> {
  const supabase = getSupabaseClient();
  
  // 首先尝试获取目标语言的特效
  const { data, error } = await supabase
    .from("effect_configs")
    .select("*")
    .eq("slug", slug)
    .eq("locale", locale)
    .eq("status", "online")
    .single();

  if (!error && data) {
    return data as VideoEffect;
  }

  // 如果目标语言没有找到且不是英语，降级到英语
  if (locale !== "en") {
    console.log(`No effect config found for locale ${locale}, falling back to English`);
    const { data: enData, error: enError } = await supabase
      .from("effect_configs")
      .select("*")
      .eq("slug", slug)
      .eq("locale", "en")
      .eq("status", "online")
      .single();

    if (!enError && enData) {
      return enData as VideoEffect;
    }
  }

  console.error("Error fetching effect config:", error);
  return null;
}

export async function getAllEffectConfigs(
  locale: string
): Promise<VideoEffect[]> {
  const supabase = getSupabaseClient();
  
  // 首先尝试获取目标语言的特效
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

  // 如果有数据，直接返回
  if (data && data.length > 0) {
    console.log(`Found ${data.length} effect configs for locale ${locale}`);
    return data as VideoEffect[];
  }

  // 如果目标语言没有数据且不是英语，降级到英语
  if (locale !== "en") {
    console.log(`No effect configs found for locale ${locale}, falling back to English`);
    const { data: enData, error: enError } = await supabase
      .from("effect_configs")
      .select("*")
      .eq("locale", "en")
      .eq("status", VideoEffectStatus.Online)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (!enError && enData && enData.length > 0) {
      console.log(`Found ${enData.length} English effect configs as fallback`);
      return enData as VideoEffect[];
    }
  }

  console.log("No effect configs found for locale:", locale);
  return [];
}

export async function getEffectConfigById(
  id: string
): Promise<VideoEffect | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("effect_configs")
    .select("*")
    .eq("id", id)
    .eq("status", "online")
    .single();

  if (error || !data) {
    console.error("Error fetching effect config by id:", error);
    return null;
  }

  return data as VideoEffect;
}

export async function getEffectConfigsByCategory(
  category: string,
  locale: string
): Promise<VideoEffect[]> {
  const supabase = getSupabaseClient();
  
  // 首先尝试获取目标语言的分类特效
  const { data, error } = await supabase
    .from("effect_configs")
    .select("*")
    .eq("category", category)
    .eq("locale", locale)
    .eq("status", "online")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching effect configs by category:", error);
    return [];
  }

  // 如果有数据，直接返回
  if (data && data.length > 0) {
    return data as VideoEffect[];
  }

  // 如果目标语言没有该分类的特效且不是英语，降级到英语
  if (locale !== "en") {
    console.log(`No effect configs found for category ${category} in locale ${locale}, falling back to English`);
    const { data: enData, error: enError } = await supabase
      .from("effect_configs")
      .select("*")
      .eq("category", category)
      .eq("locale", "en")
      .eq("status", "online")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (!enError && enData && enData.length > 0) {
      return enData as VideoEffect[];
    }
  }

  return [];
}

export async function getHotEffectConfigs(
  locale: string,
  limit: number = 6
): Promise<VideoEffect[]> {
  const supabase = getSupabaseClient();
  
  // 首先尝试获取目标语言的热门特效
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

  // 如果有数据，直接返回
  if (data && data.length > 0) {
    console.log(`Found ${data.length} hot effect configs for locale ${locale}`);
    return data as VideoEffect[];
  }

  // 如果目标语言没有热门特效且不是英语，降级到英语
  if (locale !== "en") {
    console.log(`No hot effect configs found for locale ${locale}, falling back to English`);
    const { data: enData, error: enError } = await supabase
      .from("effect_configs")
      .select("*")
      .eq("locale", "en")
      .eq("status", VideoEffectStatus.Online)
      .eq("is_hot", true)
      .order("display_order", { ascending: true })
      .limit(limit);

    if (!enError && enData && enData.length > 0) {
      console.log(`Found ${enData.length} English hot effect configs as fallback`);
      return enData as VideoEffect[];
    }
  }

  console.log("No hot effect configs found for locale:", locale);
  return [];
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