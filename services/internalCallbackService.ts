/**
 * Internal Callback Service
 * 内部回调服务 - 用于同步 Provider 的回调处理
 *
 * 设计目的：
 * 1. 解耦 Provider 和回调处理逻辑，避免循环依赖
 * 2. 统一处理 Agent 模式和普通模式的回调
 * 3. 只处理成功回调，失败在主流程处理
 *
 * 注意：Seedream 使用同步模式，回调同步执行（包括 R2 上传）
 */

import {
  updateImageGenerationById,
  getImageGenerationById,
  getImageGenerationByProviderTaskId,
  getImageGenerationByAgentTaskId,
} from '@/models/imageGeneration';
import { handleAgentModeCallback } from './agentImageCallbackService';
import { ImageStorageService } from './imageStorageService';

import type { AIServiceProvider, ProviderImageResult } from '@/types/provider.d';
import type { ImageGeneration } from '@/types/image.d';

/**
 * 内部回调数据结构
 */
export interface InternalCallbackData {
  taskId: string;
  generationId?: string;  // 用于直接查询数据库记录（非 Agent 模式使用）
  status: 'completed' | 'failed';
  images?: ProviderImageResult[];
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * 触发内部回调（同步执行）
 * 用于同步 Provider 在生成图片后处理 R2 上传等后续操作
 *
 * @param data - 回调数据
 */
export async function triggerInternalCallback(data: InternalCallbackData): Promise<void> {
  try {
    await processInternalCallback(data);
  } catch (error) {
    console.error(`[InternalCallback] ❌ Error processing task ${data.taskId}:`, error);
  }
}

/**
 * 处理内部回调
 * 根据记录类型分发到不同的处理逻辑
 *
 * @param data - 回调数据
 */
export async function processInternalCallback(data: InternalCallbackData): Promise<void> {
  const { taskId, generationId, status, images = [], error, metadata = {} } = data;

  console.log(`[InternalCallback] Processing task ${taskId}, generationId: ${generationId || 'N/A'}, status: ${status}`);

  // 查找记录（记录在 API 调用前已创建，无需重试）
  let imageGeneration: ImageGeneration | null = null;
  let isAgentMode = false;

  // 1. 优先使用 generationId 直接查询（非 Agent 模式，最可靠）
  if (generationId) {
    imageGeneration = await getImageGenerationById(generationId);
    if (imageGeneration) {
      console.log(`[InternalCallback] Found record by generationId: ${generationId}`);
    }
  }

  // 2. 如果没有 generationId 或查找失败，尝试 Agent 模式查询
  if (!imageGeneration) {
    imageGeneration = await getImageGenerationByAgentTaskId(taskId);
    isAgentMode = !!imageGeneration;
  }

  // 3. 最后尝试 provider_task_id 查询
  if (!imageGeneration) {
    imageGeneration = await getImageGenerationByProviderTaskId(taskId);
  }

  if (!imageGeneration) {
    console.error(`[InternalCallback] ❌ Image generation NOT FOUND for task ${taskId}, generationId: ${generationId || 'N/A'}`);
    return;
  }

  // 根据模式分发处理
  if (isAgentMode || imageGeneration.is_agent_mode || imageGeneration.metadata?.is_agent_mode) {
    await handleAgentCallback(imageGeneration, data);
  } else {
    await handleNormalCallback(imageGeneration, data);
  }
}

/**
 * 处理 Agent 模式回调
 */
async function handleAgentCallback(
  imageGeneration: ImageGeneration,
  data: InternalCallbackData
): Promise<void> {
  const { taskId, status, images = [], error, metadata = {} } = data;

  console.log(`[InternalCallback] Agent mode callback for generation ${imageGeneration.id}`);

  // 构建与外部回调一致的处理结果格式
  const processedResult = {
    taskId,
    status,
    images: images.map(img => ({ url: img.url })),
    error,
    metadata,
  };

  const provider = (imageGeneration.provider || 'seedream') as AIServiceProvider;
  const result = await handleAgentModeCallback(imageGeneration, processedResult, provider);

  console.log(`[InternalCallback] ✅ Agent task ${taskId}: ${result.completedCount}/${result.totalCount} completed, ${result.failedCount} failed`);
}

/**
 * 处理普通模式回调（只处理成功情况，失败在主流程处理）
 */
async function handleNormalCallback(
  imageGeneration: ImageGeneration,
  data: InternalCallbackData
): Promise<void> {
  const { taskId, status, images = [], metadata = {} } = data;

  console.log(`[InternalCallback] Normal mode callback for generation ${imageGeneration.id}`);

  // 只处理成功回调，失败在主流程已处理退款
  if (status !== 'completed' || images.length === 0) {
    console.log(`[InternalCallback] Skipping non-success callback (status: ${status}, images: ${images.length})`);
    return;
  }

  // 成功：保存图片
  const imageUrls = images.map(img => img.url);

  // 同步上传到 R2
  let r2Urls: string[] | undefined;
  try {
    const uploadResult = await ImageStorageService.uploadImagesToR2(images, imageGeneration.id);
    if (uploadResult.success && uploadResult.r2Urls) {
      r2Urls = uploadResult.r2Urls;
      console.log(`[InternalCallback] ✅ R2 upload completed: ${r2Urls.length} images`);
    }
  } catch (uploadError) {
    console.error(`[InternalCallback] ❌ R2 upload failed:`, uploadError);
    // R2 上传失败不影响主流程
  }

  // 更新数据库
  await updateImageGenerationById(imageGeneration.id, {
    provider_task_id: taskId,
    status: 'COMPLETED',
    image_urls: imageUrls,
    image_urls_r2: r2Urls,
    image_count: imageUrls.length,
    completed_at: new Date().toISOString(),
    metadata: {
      ...imageGeneration.metadata,
      provider_response: metadata,
      callback_received_at: new Date().toISOString(),
    },
  });

  console.log(`[InternalCallback] ✅ Generation ${imageGeneration.id} updated to COMPLETED`);
}
