import { getSupabaseClient } from "./db";
import type { PostgrestError } from "@supabase/supabase-js";
import type {
  MusicGeneration,
  MusicGenerationStatus,
  CreateMusicGenerationParams,
  UpdateMusicGenerationParams,
} from "@/types/music.d";

const supabase = getSupabaseClient();

/**
 * 统一处理 Supabase 查询错误
 */
function handleSupabaseError(error: PostgrestError | null, context: string) {
  if (error) {
    console.error(`Supabase error in ${context}:`, error);
    throw new Error(`Failed to ${context}: ${error.message}`);
  }
}

// ----- MODEL FUNCTIONS -----

/**
 * 创建新的音乐生成记录
 */
export async function createMusicGeneration(
  params: CreateMusicGenerationParams
): Promise<MusicGeneration> {
  const { data, error } = await supabase
    .from("music_generations")
    .insert({
      user_id: params.user_id,
      provider: params.provider,
      model_id: params.model_id,
      generation_type: params.generation_type,
      custom_mode: params.custom_mode,
      instrumental: params.instrumental,
      prompt: params.prompt,
      title: params.title,
      style: params.style,
      negative_tags: params.negative_tags,
      upload_audio_url: params.upload_audio_url,
      vocal_gender: params.vocal_gender,
      style_weight: params.style_weight,
      weirdness_constraint: params.weirdness_constraint,
      audio_weight: params.audio_weight,
      persona_id: params.persona_id,
      status: params.status || "PENDING",
      credits_cost: params.credits_cost || 12,
      metadata: params.metadata || {},
    })
    .select()
    .single();

  handleSupabaseError(error, "create music generation");
  return data as MusicGeneration;
}

/**
 * 根据音乐生成记录的 ID 获取记录
 */
export async function getMusicGenerationById(
  id: string,
  userId?: string
): Promise<MusicGeneration | null> {
  let query = supabase.from("music_generations").select("*").eq("id", id);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.single();

  if (error && error.code !== "PGRST116") {
    handleSupabaseError(error, `get music generation by id ${id}`);
  }
  return data || null;
}

/**
 * 根据提供商任务 ID 获取音乐生成记录
 */
export async function getMusicGenerationByProviderTaskId(
  providerTaskId: string
): Promise<MusicGeneration | null> {
  const { data, error } = await supabase
    .from("music_generations")
    .select("*")
    .eq("provider_task_id", providerTaskId)
    .single();

  if (error && error.code !== "PGRST116") {
    handleSupabaseError(
      error,
      `get music generation by provider_task_id ${providerTaskId}`
    );
  }
  return data || null;
}

/**
 * 根据音乐生成记录的 ID 更新记录
 */
export async function updateMusicGeneration(
  id: string,
  params: UpdateMusicGenerationParams
): Promise<MusicGeneration> {
  const { data, error } = await supabase
    .from("music_generations")
    .update({
      ...params,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  handleSupabaseError(error, `update music generation by id ${id}`);
  return data as MusicGeneration;
}

/**
 * 根据提供商任务 ID 更新音乐生成记录
 */
export async function updateMusicGenerationByProviderTaskId(
  providerTaskId: string,
  params: UpdateMusicGenerationParams
): Promise<MusicGeneration | null> {
  const { data, error } = await supabase
    .from("music_generations")
    .update({
      ...params,
      updated_at: new Date().toISOString(),
    })
    .eq("provider_task_id", providerTaskId)
    .select()
    .single();

  if (error && error.code !== "PGRST116") {
    handleSupabaseError(
      error,
      `update music generation by provider_task_id ${providerTaskId}`
    );
  }
  return data || null;
}

/**
 * 获取指定用户的音乐生成历史记录（分页）
 */
export async function getMusicGenerationsByUserId(
  userId: string,
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<{ items: MusicGeneration[]; total: number }> {
  const offset = (page - 1) * limit;

  let query = supabase
    .from("music_generations")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .eq("is_delete", false)
    .order("created_at", { ascending: false });

  if (search?.trim()) {
    const escapedSearch = search.trim().replace(/,/g, '\\,');
    const pattern = `%${escapedSearch}%`;
    query = query.or(`prompt.ilike.${pattern},title.ilike.${pattern}`);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  handleSupabaseError(error, `get music generations for user ${userId}`);

  return {
    items: data || [],
    total: count || 0,
  };
}

/**
 * 删除指定ID的音乐生成记录
 */
export async function deleteMusicGeneration(
  id: string,
  userId?: string
): Promise<boolean> {
  let query = supabase.from("music_generations").delete().eq("id", id);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { error } = await query;

  if (error) {
    handleSupabaseError(error, `delete music generation by id ${id}`);
    return false;
  }
  return true;
}

/**
 * 软删除音乐生成记录
 */
export async function softDeleteMusicGeneration(
  musicId: string,
  userId: string
): Promise<boolean> {
  try {
    console.log(`🗑️ Soft deleting music: ${musicId} for user: ${userId}`);

    const { data: existingRecord, error: checkError } = await supabase
      .from("music_generations")
      .select("id, user_id, is_delete")
      .eq("id", musicId)
      .single();

    if (checkError) {
      console.error("Error checking music record:", checkError);
      return false;
    }

    if (!existingRecord) {
      console.warn(`❌ Music record not found: ${musicId}`);
      return false;
    }

    if (existingRecord.user_id !== userId) {
      console.warn(`❌ User ${userId} doesn't own music ${musicId}`);
      return false;
    }

    if (existingRecord.is_delete === true) {
      console.log(`✅ Music ${musicId} is already deleted`);
      return true;
    }

    const { data, error } = await supabase
      .from("music_generations")
      .update({ is_delete: true })
      .eq("id", musicId)
      .eq("user_id", userId)
      .select();

    if (error) {
      console.error("Supabase error in soft delete music generation:", error);
      return false;
    }

    if (!data || data.length === 0) {
      console.warn(`❌ No records updated for music: ${musicId}`);
      return false;
    }

    console.log(`✅ Successfully soft deleted music generation: ${musicId}`);
    return true;

  } catch (err) {
    console.error("Unexpected error in softDeleteMusicGeneration:", err);
    return false;
  }
}

/**
 * 获取用户音乐生成统计
 */
export async function getMusicGenerationStats(userId: string): Promise<{
  total: number;
  completed: number;
  failed: number;
  pending: number;
  processing: number;
}> {
  const { data, error } = await supabase
    .from("music_generations")
    .select("status")
    .eq("user_id", userId)
    .eq("is_delete", false);

  handleSupabaseError(
    error,
    `get music generation stats for user ${userId}`
  );

  const stats = {
    total: data?.length || 0,
    completed: 0,
    failed: 0,
    pending: 0,
    processing: 0,
  };

  if (data) {
    data.forEach((record) => {
      switch (record.status) {
        case "COMPLETED":
        case "SAVED_TO_R2":
          stats.completed++;
          break;
        case "FAILED":
          stats.failed++;
          break;
        case "PENDING":
          stats.pending++;
          break;
        case "TEXT_GENERATED":
        case "FIRST_TRACK_COMPLETED":
          stats.processing++;
          break;
      }
    });
  }

  return stats;
}
