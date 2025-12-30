import { getSupabaseClient } from "./db";
import type { PostgrestError } from "@supabase/supabase-js";
import type {
  VideoGenerationStatus,
  VideoGeneration,
  CreateVideoGenerationParams,
  UpdateVideoGenerationParams,
} from "@/types/video.d"; // Added import for types

// Supabase 客户端初始化
const supabase = getSupabaseClient(); // Changed

/**
 * 统一处理 Supabase 查询错误。
 * @param error PostgrestError | null
 * @param context Operation context for better error messages
 */
function handleSupabaseError(error: PostgrestError | null, context: string) {
  if (error) {
    console.error(`Supabase error in ${context}:`, error);
    throw new Error(`Failed to ${context}: ${error.message}`);
  }
}

// ----- MODEL FUNCTIONS -----

/**
 * 创建新的视频生成记录。
 */
export async function createVideoGeneration(
  params: CreateVideoGenerationParams
): Promise<VideoGeneration> {
  const { data, error } = await supabase
    .from("video_generations")
    .insert({
      user_id: params.user_id,
      model_id: params.model_id,
      prompt: params.prompt,
      optimized_prompt: params.optimized_prompt,
      fal_request_id: params.fal_request_id,
      volcano_request_id: params.volcano_request_id,
      veo3_request_id: params.veo3_request_id,
      ali_request_id: params.ali_request_id,
      pixverse_request_id: params.pixverse_request_id,
      sora_request_id: params.sora_request_id,
      input_image_url: params.input_image_url,
      image_urls: params.image_urls, // 新增：支持1-2张图片数组
      source_image_ids: params.source_image_ids, // 新增：来源图片ID数组
      negative_prompt: params.negative_prompt,
      aspect_ratio: params.aspect_ratio || "16:9",
      duration_seconds: params.duration_seconds || 5,
      cfg_scale: params.cfg_scale,
      seed: params.seed,
      has_audio: params.has_audio || false,
      status: params.status || "PENDING",
      metadata: params.metadata || {},
      effect_id: params.effect_id,
    })
    .select()
    .single();

  handleSupabaseError(error, "create video generation");
  return data as VideoGeneration;
}

/**
 * 根据视频生成记录的 ID 获取记录。
 * userId 用于确保用户只能获取自己的记录 (如果RLS未完全覆盖或作为额外检查)。
 */
export async function getVideoGenerationById(
  id: string,
  userId?: number // 可选，因为RLS应该处理权限
): Promise<VideoGeneration | null> {
  let query = supabase.from("video_generations").select("*").eq("id", id);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.single();

  if (error && error.code !== "PGRST116") {
    // PGRST116: Row not found
    handleSupabaseError(error, `get video generation by id ${id}`);
  }
  return data || null;
}

/**
 * 根据 Fal.ai 请求 ID 获取视频生成记录。
 */
export async function getVideoGenerationByFalRequestId(
  falRequestId: string
): Promise<VideoGeneration | null> {
  const { data, error } = await supabase
    .from("video_generations")
    .select("*")
    .eq("fal_request_id", falRequestId)
    .single();

  if (error && error.code !== "PGRST116") {
    handleSupabaseError(
      error,
      `get video generation by fal_request_id ${falRequestId}`
    );
  }
  return data || null;
}

/**
 * 根据 Volcano Engine 请求 ID 获取视频生成记录。
 */
export async function getVideoGenerationByVolcanoRequestId(
  volcanoRequestId: string
): Promise<VideoGeneration | null> {
  const { data, error } = await supabase
    .from("video_generations")
    .select("*")
    .eq("volcano_request_id", volcanoRequestId)
    .single();

  if (error && error.code !== "PGRST116") {
    handleSupabaseError(
      error,
      `get video generation by volcano_request_id ${volcanoRequestId}`
    );
  }
  return data || null;
}

/**
 * 根据 Veo3 APICore 请求 ID 获取视频生成记录。
 */
export async function getVideoGenerationByVeo3RequestId(
  veo3RequestId: string
): Promise<VideoGeneration | null> {
  const { data, error } = await supabase
    .from("video_generations")
    .select("*")
    .eq("veo3_request_id", veo3RequestId)
    .single();

  if (error && error.code !== "PGRST116") {
    handleSupabaseError(
      error,
      `get video generation by veo3_request_id ${veo3RequestId}`
    );
  }
  return data || null;
}

/**
 * 根据 Ali Video Generation 请求 ID 获取视频生成记录。
 */
export async function getVideoGenerationByAliRequestId(
  aliRequestId: string
): Promise<VideoGeneration | null> {
  const { data, error } = await supabase
    .from("video_generations")
    .select("*")
    .eq("ali_request_id", aliRequestId)
    .single();

  if (error && error.code !== "PGRST116") {
    handleSupabaseError(
      error,
      `get video generation by ali_request_id ${aliRequestId}`
    );
  }
  return data || null;
}

/**
 * 根据 PixVerse 请求 ID 获取视频生成记录。
 */
export async function getVideoGenerationByPixVerseRequestId(
  pixverseRequestId: string
): Promise<VideoGeneration | null> {
  const { data, error } = await supabase
    .from("video_generations")
    .select("*")
    .eq("pixverse_request_id", pixverseRequestId)
    .single();

  if (error && error.code !== "PGRST116") {
    handleSupabaseError(
      error,
      `get video generation by pixverse_request_id ${pixverseRequestId}`
    );
  }
  return data || null;
}

/**
 * 根据 Sora 2 请求 ID 获取视频生成记录。
 */
export async function getVideoGenerationBySoraRequestId(
  soraRequestId: string
): Promise<VideoGeneration | null> {
  const { data, error } = await supabase
    .from("video_generations")
    .select("*")
    .eq("sora_request_id", soraRequestId)
    .single();

  if (error && error.code !== "PGRST116") {
    handleSupabaseError(
      error,
      `get video generation by sora_request_id ${soraRequestId}`
    );
  }
  return data || null;
}

/**
 * 根据视频生成记录的 ID 更新记录。
 */
export async function updateVideoGenerationById(
  id: string,
  params: UpdateVideoGenerationParams
): Promise<VideoGeneration> {
  const { data, error } = await supabase
    .from("video_generations")
    .update({
      ...params,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  handleSupabaseError(error, `update video generation by id ${id}`);
  return data as VideoGeneration;
}

/**
 * 根据 Fal.ai 请求 ID 更新视频生成记录。
 */
export async function updateVideoGenerationByFalRequestId(
  falRequestId: string,
  params: UpdateVideoGenerationParams
): Promise<VideoGeneration | null> {
  const { data, error } = await supabase
    .from("video_generations")
    .update({
      ...params,
      updated_at: new Date().toISOString(),
    })
    .eq("fal_request_id", falRequestId)
    .select()
    .single();

  if (error && error.code !== "PGRST116") {
    handleSupabaseError(
      error,
      `update video generation by fal_request_id ${falRequestId}`
    );
  }
  return data || null;
}

/**
 * 根据 Volcano Engine 请求 ID 更新视频生成记录。
 */
export async function updateVideoGenerationByVolcanoRequestId(
  volcanoRequestId: string,
  params: UpdateVideoGenerationParams
): Promise<VideoGeneration | null> {
  const { data, error } = await supabase
    .from("video_generations")
    .update({
      ...params,
      updated_at: new Date().toISOString(),
    })
    .eq("volcano_request_id", volcanoRequestId)
    .select()
    .single();

  if (error && error.code !== "PGRST116") {
    handleSupabaseError(
      error,
      `update video generation by volcano_request_id ${volcanoRequestId}`
    );
  }
  return data || null;
}

/**
 * 根据 Veo3 APICore 请求 ID 更新视频生成记录。
 */
export async function updateVideoGenerationByVeo3RequestId(
  veo3RequestId: string,
  params: UpdateVideoGenerationParams
): Promise<VideoGeneration | null> {
  const { data, error } = await supabase
    .from("video_generations")
    .update({
      ...params,
      updated_at: new Date().toISOString(),
    })
    .eq("veo3_request_id", veo3RequestId)
    .select()
    .single();

  if (error && error.code !== "PGRST116") {
    handleSupabaseError(
      error,
      `update video generation by veo3_request_id ${veo3RequestId}`
    );
  }
  return data || null;
}

/**
 * 根据 Ali Video Generation 请求 ID 更新视频生成记录。
 */
export async function updateVideoGenerationByAliRequestId(
  aliRequestId: string,
  params: UpdateVideoGenerationParams
): Promise<VideoGeneration | null> {
  const { data, error } = await supabase
    .from("video_generations")
    .update({
      ...params,
      updated_at: new Date().toISOString(),
    })
    .eq("ali_request_id", aliRequestId)
    .select()
    .single();

  if (error && error.code !== "PGRST116") {
    handleSupabaseError(
      error,
      `update video generation by ali_request_id ${aliRequestId}`
    );
  }
  return data || null;
}

/**
 * 根据 PixVerse 请求 ID 更新视频生成记录。
 */
export async function updateVideoGenerationByPixVerseRequestId(
  pixverseRequestId: string,
  params: UpdateVideoGenerationParams
): Promise<VideoGeneration | null> {
  const { data, error } = await supabase
    .from("video_generations")
    .update({
      ...params,
      updated_at: new Date().toISOString(),
    })
    .eq("pixverse_request_id", pixverseRequestId)
    .select()
    .single();

  if (error && error.code !== "PGRST116") {
    handleSupabaseError(
      error,
      `update video generation by pixverse_request_id ${pixverseRequestId}`
    );
  }
  return data || null;
}

/**
 * 根据 Sora 2 请求 ID 更新视频生成记录。
 */
export async function updateVideoGenerationBySoraRequestId(
  soraRequestId: string,
  params: UpdateVideoGenerationParams
): Promise<VideoGeneration | null> {
  const { data, error } = await supabase
    .from("video_generations")
    .update({
      ...params,
      updated_at: new Date().toISOString(),
    })
    .eq("sora_request_id", soraRequestId)
    .select()
    .single();

  if (error && error.code !== "PGRST116") {
    handleSupabaseError(
      error,
      `update video generation by sora_request_id ${soraRequestId}`
    );
  }
  return data || null;
}

/**
 * 获取指定用户的视频生成历史记录 (分页)。
 */
export async function getUserVideoGenerations(
  userId: number,
  limit: number = 10,
  offset: number = 0,
  search?: string
): Promise<{ data: VideoGeneration[]; total: number }> {
  let query = supabase
    .from("video_generations")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .eq("is_delete", false)
    .order("created_at", { ascending: false });

  if (search?.trim()) {
    const escapedSearch = search.trim().replace(/,/g, '\\,');
    const pattern = `%${escapedSearch}%`;
    query = query.or(`prompt.ilike.${pattern},optimized_prompt.ilike.${pattern}`);
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  handleSupabaseError(error, `get user video generations for user ${userId}`);

  return {
    data: data || [],
    total: count || 0,
  };
}

/**
 * 删除指定ID的视频生成记录。
 * userId 用于确保用户只能删除自己的记录 (如果RLS未完全覆盖或作为额外检查)。
 */
export async function deleteVideoGeneration(
  id: string,
  userId?: number // 可选，RLS应处理
): Promise<boolean> {
  let query = supabase.from("video_generations").delete().eq("id", id);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { error } = await query;

  // 如果记录不存在或因RLS无法删除，delete不会返回PGRST116，而是可能没有错误但rowCount为0
  // 或因RLS权限不足直接报错。我们依赖RLS策略来保证安全。
  if (error) {
    handleSupabaseError(error, `delete video generation by id ${id}`);
    return false; //显式返回错误
  }
  return true;
}

/**
 * 获取用户视频生成统计
 */
export async function getUserVideoGenerationStats(userId: number): Promise<{
  total: number;
  completed: number;
  failed: number;
  pending: number;
  processing: number; // IN_QUEUE or IN_PROGRESS
}> {
  const { data, error } = await supabase
    .from("video_generations")
    .select("status")
    .eq("user_id", userId);

  handleSupabaseError(
    error,
    `get user video generation stats for user ${userId}`
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
        case "PROMPT_OPTIMIZING":
        case "IN_QUEUE":
        case "IN_PROGRESS":
          stats.processing++;
          break;
      }
    });
  }

  return stats;
}

/**
 * 软删除视频生成记录
 */
export async function softDeleteVideoGeneration(
  videoId: string,
  userId: string
): Promise<boolean> {
  try {
    // 首先检查记录是否存在
    console.log(`🔍 Checking if video exists: ${videoId} for user: ${userId}`);

    const { data: existingRecord, error: checkError } = await supabase
      .from("video_generations")
      .select("id, user_id, is_delete")
      .eq("id", videoId)
      .single();

    if (checkError) {
      console.error("Error checking video record:", checkError);
      // 如果是字段不存在错误，尝试不检查 is_delete 字段
      if (checkError.message?.includes("is_delete")) {
        console.log("⚠️ is_delete field doesn't exist, trying without it...");

        const { data: simpleRecord, error: simpleError } = await supabase
          .from("video_generations")
          .select("id, user_id")
          .eq("id", videoId)
          .single();

        if (simpleError) {
          console.error("Video record not found:", simpleError);
          return false;
        }

        if (simpleRecord.user_id !== userId) {
          console.error("User doesn't own this video");
          return false;
        }

        // 尝试添加 is_delete 字段并更新
        const { data, error } = await supabase
          .from("video_generations")
          .update({ is_delete: true })
          .eq("id", videoId)
          .eq("user_id", userId)
          .select();

        if (error) {
          console.error("Error updating with is_delete field:", error);
          // 如果 is_delete 字段不存在，建议用户运行迁移
          if (error.message?.includes("is_delete")) {
            console.error("💡 Please run the database migration script: docs/database/add-video-is-delete-field.sql");
          }
          return false;
        }

        console.log(`✅ Successfully added is_delete field and marked as deleted: ${videoId}`);
        return data && data.length > 0;
      }
      return false;
    }

    if (!existingRecord) {
      console.warn(`❌ Video record not found: ${videoId}`);
      return false;
    }

    if (existingRecord.user_id !== userId) {
      console.warn(`❌ User ${userId} doesn't own video ${videoId} (owned by ${existingRecord.user_id})`);
      return false;
    }

    if (existingRecord.is_delete === true) {
      console.log(`✅ Video ${videoId} is already deleted, treating as success`);
      return true; // 已经删除的视频，视为成功
    }

    // 执行软删除
    console.log(`🗑️ Executing soft delete for video: ${videoId}`);
    const { data, error } = await supabase
      .from("video_generations")
      .update({ is_delete: true })
      .eq("id", videoId)
      .eq("user_id", userId)
      .select();

    if (error) {
      console.error("Supabase error in soft delete video generation:", error);
      return false;
    }

    if (!data || data.length === 0) {
      console.warn(`❌ No records updated for video: ${videoId}, but deletion may have succeeded`);
      // 即使没有更新记录，我们也检查一下是否实际上已经被删除了
      const { data: checkData, error: checkError } = await supabase
        .from("video_generations")
        .select("is_delete")
        .eq("id", videoId)
        .eq("user_id", userId)
        .single();

      if (!checkError && checkData && checkData.is_delete === true) {
        console.log(`✅ Video ${videoId} is confirmed deleted despite update failure`);
        return true;
      }

      return false;
    }

    console.log(`✅ Successfully soft deleted video generation: ${videoId}`);
    return true;

  } catch (err) {
    console.error("Unexpected error in softDeleteVideoGeneration:", err);
    return false;
  }
}
