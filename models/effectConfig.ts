import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

export interface EffectConfig {
  id: string;
  slug: string;
  title: Record<string, string>;
  description: Record<string, string>;
  seo_title?: Record<string, string>;
  seo_description?: Record<string, string>;
  seo_keywords?: Record<string, string>;
  preview_image?: string;
  preview_video?: string;
  poster_image?: string;
  parameters: Record<string, any>;
  prompt_template: string;
  status: 'active' | 'inactive' | 'draft';
  is_hot: boolean;
  is_free: boolean;
  category?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export async function getEffectConfigBySlug(
  supabase: SupabaseClient<Database>,
  slug: string
): Promise<EffectConfig | null> {
  const { data, error } = await supabase
    .from("effect_configs")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error || !data) {
    console.error("Error fetching effect config:", error);
    return null;
  }

  return data as EffectConfig;
}

export async function getAllEffectConfigs(
  supabase: SupabaseClient<Database>
): Promise<EffectConfig[]> {
  const { data, error } = await supabase
    .from("effect_configs")
    .select("*")
    .eq("status", "active")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Error fetching effect configs:", error);
    return [];
  }

  return data as EffectConfig[];
}

export async function getEffectConfigsByCategory(
  supabase: SupabaseClient<Database>,
  category: string
): Promise<EffectConfig[]> {
  const { data, error } = await supabase
    .from("effect_configs")
    .select("*")
    .eq("status", "active")
    .eq("category", category)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Error fetching effect configs by category:", error);
    return [];
  }

  return data as EffectConfig[];
}