import { getSupabaseClient } from "./db";
import type { PostgrestError } from "@supabase/supabase-js";
import type {
  ImageGenerationStatus,
  ImageGeneration,
  CreateImageGenerationParams,
  UpdateImageGenerationParams,
  ImageGenerationStats,
  ImageGenerationHistoryItem,
} from "@/types/image.d";

// Supabase 客户端初始化
const supabase = getSupabaseClient();

/**
 * 统一处理 Supabase 查询错误
 * @param error PostgrestError | null
 * @param context Operation context for better error messages
 */
function handleSupabaseError(error: PostgrestError | null, context: string) {
  if (error) {
    console.error(`Supabase error in ${context}:`, error);
    throw new Error(`Failed to ${context}: ${error.message}`);
  }
}

// ----- IMAGE GENERATION MODEL FUNCTIONS -----

/**
 * 创建新的图片生成记录
 */
export async function createImageGeneration(
  params: CreateImageGenerationParams
): Promise<ImageGeneration> {
  // 构建插入数据，包含 Agent 模式字段
  const insertData: Record<string, any> = {
    user_id: params.user_id,
    model_id: params.model_id,
    prompt: params.prompt,
    optimized_prompt: params.optimized_prompt,
    negative_prompt: params.negative_prompt,
    mode: params.mode,
    source: params.source,
    provider: params.provider,
    task_id: params.task_id,
    provider_task_id: params.provider_task_id,
    is_delete: params.is_delete || false,
    input_image_urls: params.input_image_urls,
    aspect_ratio: params.aspect_ratio,
    quality: params.quality,
    style: params.style,
    seed: params.seed,
    credits_used: params.credits_used,
    status: params.status || "PENDING",
    metadata: params.metadata,
  };

  // 添加 Agent 模式字段（如果提供）
  if (params.is_agent_mode !== undefined) {
    insertData.is_agent_mode = params.is_agent_mode;
  }
  if (params.agent_image_count !== undefined) {
    insertData.agent_image_count = params.agent_image_count;
  }
  if (params.expanded_prompts !== undefined) {
    insertData.expanded_prompts = params.expanded_prompts;
  }

  const { data, error } = await supabase
    .from("image_generations")
    .insert(insertData)
    .select()
    .single();

  handleSupabaseError(error, "create image generation");
  return data as ImageGeneration;
}

/**
 * 根据图片生成记录的 ID 获取记录
 */
export async function getImageGenerationById(
  id: string,
  userId?: string
): Promise<ImageGeneration | null> {
  let query = supabase.from("image_generations").select("*").eq("id", id);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.single();

  if (error && error.code !== "PGRST116") {
    // PGRST116: Row not found
    handleSupabaseError(error, `get image generation by id ${id}`);
  }
  return data || null;
}

/**
 * 根据任务ID获取图片生成记录
 */
export async function getImageGenerationByTaskId(
  taskId: string
): Promise<ImageGeneration | null> {
  const { data, error } = await supabase
    .from("image_generations")
    .select("*")
    .eq("task_id", taskId)
    .single();

  if (error && error.code !== "PGRST116") {
    handleSupabaseError(
      error,
      `get image generation by task_id ${taskId}`
    );
  }
  return data || null;
}

/**
 * 根据服务提供商任务ID获取图片生成记录
 */
export async function getImageGenerationByProviderTaskId(
  providerTaskId: string
): Promise<ImageGeneration | null> {
  const { data, error } = await supabase
    .from("image_generations")
    .select("*")
    .eq("provider_task_id", providerTaskId)
    .single();

  if (error && error.code !== "PGRST116") {
    handleSupabaseError(
      error,
      `get image generation by provider_task_id ${providerTaskId}`
    );
  }
  return data || null;
}

/**
 * 根据 Agent 模式的子任务 ID 获取主记录
 * 搜索 metadata.agent_task_ids 数组中包含指定 taskId 的记录
 */
export async function getImageGenerationByAgentTaskId(
  taskId: string
): Promise<ImageGeneration | null> {
  // 策略1: 先尝试用 is_agent_mode 列查询
  const { data: agentRecordsByColumn, error: columnError } = await supabase
    .from("image_generations")
    .select("*")
    .eq("is_agent_mode", true)
    .in("status", ["IN_PROGRESS", "PENDING", "IN_QUEUE"]);

  if (columnError) {
    console.error(`[DB-Agent] Column query error:`, columnError);
  }

  // 策略2: 也用 metadata.is_agent_mode 查询（兼容旧数据）
  const { data: agentRecordsByMetadata, error: metadataError } = await supabase
    .from("image_generations")
    .select("*")
    .eq("metadata->>is_agent_mode", "true")
    .in("status", ["IN_PROGRESS", "PENDING", "IN_QUEUE"]);

  if (metadataError) {
    console.error(`[DB-Agent] Metadata query error:`, metadataError);
  }

  // 合并两个查询结果，去重
  const allRecords = new Map<string, any>();
  agentRecordsByColumn?.forEach(r => allRecords.set(r.id, r));
  agentRecordsByMetadata?.forEach(r => allRecords.set(r.id, r));

  const uniqueRecords = Array.from(allRecords.values());

  // 手动搜索包含该 taskId 的记录
  const matchedRecord = uniqueRecords.find((record) => {
    const taskIds = record.metadata?.agent_task_ids || [];
    const found = taskIds.includes(taskId);
    return found;
  });

  return matchedRecord || null;
}

/**
 * 根据图片生成记录的 ID 更新记录
 */
export async function updateImageGenerationById(
  id: string,
  params: UpdateImageGenerationParams
): Promise<ImageGeneration> {
  const updateData = {
    ...params,
    updated_at: new Date().toISOString(),
  };

  // 如果状态更新为完成，设置完成时间
  if (params.status === "COMPLETED" && !params.completed_at) {
    updateData.completed_at = new Date().toISOString();
  }

  // 更新图片数量
  if (params.image_urls) {
    updateData.image_count = params.image_urls.length;
  }

  const { data, error } = await supabase
    .from("image_generations")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  handleSupabaseError(error, `update image generation by id ${id}`);
  return data as ImageGeneration;
}

/**
 * 根据任务ID更新图片生成记录
 */
export async function updateImageGenerationByTaskId(
  taskId: string,
  params: UpdateImageGenerationParams
): Promise<ImageGeneration | null> {
  const updateData = {
    ...params,
    updated_at: new Date().toISOString(),
  };

  // 如果状态更新为完成，设置完成时间
  if (params.status === "COMPLETED" && !params.completed_at) {
    updateData.completed_at = new Date().toISOString();
  }

  // 更新图片数量
  if (params.image_urls) {
    updateData.image_count = params.image_urls.length;
  }

  const { data, error } = await supabase
    .from("image_generations")
    .update(updateData)
    .eq("task_id", taskId)
    .select()
    .single();

  if (error && error.code !== "PGRST116") {
    handleSupabaseError(
      error,
      `update image generation by task_id ${taskId}`
    );
  }
  return data || null;
}

/**
 * 根据服务提供商任务ID更新图片生成记录
 */
export async function updateImageGenerationByProviderTaskId(
  providerTaskId: string,
  params: UpdateImageGenerationParams
): Promise<ImageGeneration | null> {
  const updateData = {
    ...params,
    updated_at: new Date().toISOString(),
  };

  // 如果状态更新为完成，设置完成时间
  if (params.status === "COMPLETED" && !params.completed_at) {
    updateData.completed_at = new Date().toISOString();
  }

  // 更新图片数量
  if (params.image_urls) {
    updateData.image_count = params.image_urls.length;
  }

  const { data, error } = await supabase
    .from("image_generations")
    .update(updateData)
    .eq("provider_task_id", providerTaskId)
    .select()
    .single();

  if (error && error.code !== "PGRST116") {
    console.warn(`Image generation record not found for provider_task_id: ${providerTaskId}. Skipping update.`);
    return null;
  }

  handleSupabaseError(error, `update image generation by provider_task_id ${providerTaskId}`);
  return data as ImageGeneration;
}

/**
 * 获取指定用户的图片生成历史记录 (分页)
 */
export async function getUserImageGenerations(
  userId: string,
  limit: number = 10,
  offset: number = 0
): Promise<{ data: ImageGenerationHistoryItem[]; total: number }> {
  // 首先查询表结构，检查哪些字段存在
  const { data: tableInfo } = await supabase
    .from("information_schema.columns")
    .select("column_name")
    .eq("table_schema", "public")
    .eq("table_name", "image_generations");

  // 基础字段（必须存在）
  const baseFields = [
    "id",
    "prompt",
    "optimized_prompt",
    "image_urls",
    "image_urls_r2",
    "input_image_urls",  // 添加输入图片URLs字段
    "status",
    "model_id",
    "mode",
    "source",
    "provider",
    "credits_used",
    "created_at",
    "error_message",
    // Agent 模式字段
    "is_agent_mode",
    "agent_image_count",
    "expanded_prompts"
  ];

  // 可选字段（可能不存在）
  const optionalFields = [
    "aspect_ratio",
    "quality", 
    "style",
    "updated_at",
    "is_delete",
    "metadata"
  ];

  // 检查哪些字段存在
  const existingColumns = new Set(tableInfo?.map(col => col.column_name) || []);
  
  // 构建查询字段列表
  const selectFields = [
    ...baseFields,
    ...optionalFields.filter(field => existingColumns.has(field)),
    // 强制包含metadata字段
    'metadata'
  ].join(',\n      ');


  // 构建查询，强制应用删除过滤
  let query = supabase
    .from("image_generations")
    .select(selectFields, { count: "exact" })
    .eq("user_id", userId);

  // 尝试添加 is_delete 过滤条件
  console.log("📋 Attempting to filter by is_delete = false");
  
  try {
    // 强制尝试添加 is_delete 过滤，即使字段检查说不存在
    query = query.eq("is_delete", false);
    console.log("✅ Successfully added is_delete filter");
  } catch (filterError) {
    console.log("⚠️ Could not add is_delete filter, field may not exist");
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  // 如果查询失败且是因为 is_delete 字段，则重试不带过滤条件的查询
  if (error && error.message?.includes("is_delete")) {
    console.log("🔄 Retrying query without is_delete filter due to field error");
    
    const { data: retryData, error: retryError, count: retryCount } = await supabase
      .from("image_generations")
      .select(selectFields, { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (retryError) {
      handleSupabaseError(retryError, `get user image generations for user ${userId} (retry)`);
    }
    
    return {
      data: (retryData as unknown as ImageGenerationHistoryItem[]) || [],
      total: retryCount || 0,
    };
  }

  handleSupabaseError(error, `get user image generations for user ${userId}`);

  return {
    data: (data as unknown as ImageGenerationHistoryItem[]) || [],
    total: count || 0,
  };
}

/**
 * 软删除图片生成记录
 */
export async function softDeleteImageGeneration(
  imageId: string,
  userId: string
): Promise<boolean> {
  try {
    // 首先检查记录是否存在
    console.log(`🔍 Checking if image exists: ${imageId} for user: ${userId}`);
    
    const { data: existingRecord, error: checkError } = await supabase
      .from("image_generations")
      .select("id, user_id, is_delete")
      .eq("id", imageId)
      .single();

    if (checkError) {
      console.error("Error checking image record:", checkError);
      // 如果是字段不存在错误，尝试不检查 is_delete 字段
      if (checkError.message?.includes("is_delete")) {
        console.log("⚠️ is_delete field doesn't exist, trying without it...");
        
        const { data: simpleRecord, error: simpleError } = await supabase
          .from("image_generations")
          .select("id, user_id")
          .eq("id", imageId)
          .single();
          
        if (simpleError) {
          console.error("Image record not found:", simpleError);
          return false;
        }
        
        if (simpleRecord.user_id !== userId) {
          console.error("User doesn't own this image");
          return false;
        }
        
        // 尝试添加 is_delete 字段并更新
        const { data, error } = await supabase
          .from("image_generations")
          .update({ is_delete: true })
          .eq("id", imageId)
          .eq("user_id", userId)
          .select();
          
        if (error) {
          console.error("Error updating with is_delete field:", error);
          // 如果 is_delete 字段不存在，建议用户运行迁移
          if (error.message?.includes("is_delete")) {
            console.error("💡 Please run the database migration script: docs/database/add-is-delete-field.sql");
          }
          return false;
        }
        
        console.log(`✅ Successfully added is_delete field and marked as deleted: ${imageId}`);
        return data && data.length > 0;
      }
      return false;
    }

    if (!existingRecord) {
      console.warn(`❌ Image record not found: ${imageId}`);
      return false;
    }

    if (existingRecord.user_id !== userId) {
      console.warn(`❌ User ${userId} doesn't own image ${imageId} (owned by ${existingRecord.user_id})`);
      return false;
    }

    if (existingRecord.is_delete === true) {
      console.log(`✅ Image ${imageId} is already deleted, treating as success`);
      return true; // 已经删除的图片，视为成功
    }

    // 执行软删除
    console.log(`🗑️ Executing soft delete for image: ${imageId}`);
    const { data, error } = await supabase
      .from("image_generations")
      .update({ is_delete: true })
      .eq("id", imageId)
      .eq("user_id", userId)
      .select();

    if (error) {
      console.error("Supabase error in soft delete image generation:", error);
      return false;
    }

    if (!data || data.length === 0) {
      console.warn(`❌ No records updated for image: ${imageId}, but deletion may have succeeded`);
      // 即使没有更新记录，我们也检查一下是否实际上已经被删除了
      const { data: checkData, error: checkError } = await supabase
        .from("image_generations")
        .select("is_delete")
        .eq("id", imageId)
        .eq("user_id", userId)
        .single();
        
      if (!checkError && checkData && checkData.is_delete === true) {
        console.log(`✅ Image ${imageId} is confirmed deleted despite update failure`);
        return true;
      }
      
      return false;
    }

    console.log(`✅ Successfully soft deleted image generation: ${imageId}`);
    return true;
    
  } catch (err) {
    console.error("Unexpected error in softDeleteImageGeneration:", err);
    return false;
  }
}

/**
 * 获取用户图片生成统计
 */
export async function getUserImageGenerationStats(userId: string): Promise<ImageGenerationStats> {
  const { data, error } = await supabase
    .from("image_generations")
    .select("status")
    .eq("user_id", userId);

  handleSupabaseError(
    error,
    `get user image generation stats for user ${userId}`
  );

  const stats: ImageGenerationStats = {
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
 * 删除指定ID的图片生成记录
 */
export async function deleteImageGeneration(
  id: string,
  userId?: string
): Promise<boolean> {
  let query = supabase.from("image_generations").delete().eq("id", id);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { error } = await query;

  if (error) {
    handleSupabaseError(error, `delete image generation by id ${id}`);
    return false;
  }
  return true;
}

/**
 * 获取待处理的图片生成任务 (用于后台处理)
 */
export async function getPendingImageGenerations(
  limit: number = 50
): Promise<ImageGeneration[]> {
  const { data, error } = await supabase
    .from("image_generations")
    .select("*")
    .in("status", ["PENDING", "IN_QUEUE"])
    .order("created_at", { ascending: true })
    .limit(limit);

  handleSupabaseError(error, "get pending image generations");
  return data || [];
}

/**
 * 批量更新图片生成记录状态
 */
export async function batchUpdateImageGenerationStatus(
  ids: string[],
  status: ImageGenerationStatus,
  errorMessage?: string
): Promise<number> {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (errorMessage) {
    updateData.error_message = errorMessage;
  }

  if (status === "COMPLETED") {
    updateData.completed_at = new Date().toISOString();
  }

  const { count, error } = await supabase
    .from("image_generations")
    .update(updateData)
    .in("id", ids);

  handleSupabaseError(error, `batch update image generation status to ${status}`);
  return count || 0;
}

/**
 * 获取图片生成的积分消耗统计
 */
export async function getImageGenerationCreditsStats(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<{
  total_credits_used: number;
  total_generations: number;
  avg_credits_per_generation: number;
}> {
  let query = supabase
    .from("image_generations")
    .select("credits_used")
    .eq("user_id", userId)
    .eq("status", "COMPLETED");

  if (startDate) {
    query = query.gte("created_at", startDate);
  }
  if (endDate) {
    query = query.lte("created_at", endDate);
  }

  const { data, error } = await query;

  handleSupabaseError(error, `get image generation credits stats for user ${userId}`);

  const totalCreditsUsed = data?.reduce((sum, record) => sum + (record.credits_used || 0), 0) || 0;
  const totalGenerations = data?.length || 0;
  const avgCreditsPerGeneration = totalGenerations > 0 ? totalCreditsUsed / totalGenerations : 0;

  return {
    total_credits_used: totalCreditsUsed,
    total_generations: totalGenerations,
    avg_credits_per_generation: Math.round(avgCreditsPerGeneration * 100) / 100,
  };
}
