/**
 * Internal Callback Service
 * 内部回调服务 - 用于同步 Provider（如 Seedream）模拟异步回调行为
 *
 * 设计目的：
 * 1. 解耦 Provider 和回调处理逻辑，避免循环依赖
 * 2. 统一处理 Agent 模式和普通模式的回调
 * 3. 让同步 Provider 也能使用异步回调模式，前端继续轮询状态
 */

import {
  updateImageGenerationById,
  getImageGenerationByProviderTaskId,
  getImageGenerationByAgentTaskId,
} from '@/models/imageGeneration';
import { handleAgentModeCallback } from './agentImageCallbackService';
import { ImageStorageService } from './imageStorageService';
import {
  increaseCredits,
  CreditsTransType,
} from '@/services/credit';

import type { AIServiceProvider, ProviderImageResult } from '@/types/provider.d';
import type { ImageGeneration } from '@/types/image.d';

/**
 * 内部回调数据结构
 */
export interface InternalCallbackData {
  taskId: string;
  status: 'completed' | 'failed';
  images?: ProviderImageResult[];
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * 触发内部回调（异步执行，不阻塞调用方）
 * 用于同步 Provider 在生成图片后模拟异步回调行为
 *
 * @param data - 回调数据
 */
export function triggerInternalCallback(data: InternalCallbackData): void {
  // 使用 setImmediate 异步执行，不阻塞主流程
  setImmediate(async () => {
    try {
      await processInternalCallback(data);
    } catch (error) {
      console.error(`[InternalCallback] ❌ Error processing task ${data.taskId}:`, error);
    }
  });
}

// 重试配置（处理数据库记录可能尚未创建的竞态条件）
const RETRY_CONFIG = {
  maxRetries: 3,        // 最大重试次数
  initialDelay: 500,    // 初始延迟 (ms)
  maxDelay: 3000,       // 最大延迟 (ms)
  backoffMultiplier: 2, // 退避倍数
};
// 重试时间线: 500ms → 1000ms → 2000ms，总等待 3.5 秒

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 处理内部回调（同步执行）
 * 根据记录类型分发到不同的处理逻辑
 * 包含重试机制，处理数据库记录可能尚未创建的竞态条件
 *
 * @param data - 回调数据
 */
export async function processInternalCallback(data: InternalCallbackData): Promise<void> {
  const { taskId, status, images = [], error, metadata = {} } = data;

  console.log(`[InternalCallback] Processing task ${taskId}, status: ${status}`);

  // 带重试的记录查找
  let imageGeneration: ImageGeneration | null = null;
  let isAgentMode = false;
  let retryCount = 0;
  let currentDelay = RETRY_CONFIG.initialDelay;

  while (retryCount <= RETRY_CONFIG.maxRetries) {
    // 1. 先尝试查找 Agent 模式记录
    imageGeneration = await getImageGenerationByAgentTaskId(taskId);
    isAgentMode = !!imageGeneration;

    // 2. 如果不是 Agent 模式，查找普通模式记录
    if (!imageGeneration) {
      imageGeneration = await getImageGenerationByProviderTaskId(taskId);
    }

    // 找到记录，跳出重试循环
    if (imageGeneration) {
      if (retryCount > 0) {
        console.log(`[InternalCallback] ✅ Found record after ${retryCount} retries`);
      }
      break;
    }

    // 未找到且还有重试次数
    if (retryCount < RETRY_CONFIG.maxRetries) {
      console.log(`[InternalCallback] Record not found for task ${taskId}, retry ${retryCount + 1}/${RETRY_CONFIG.maxRetries} after ${currentDelay}ms`);
      await delay(currentDelay);
      currentDelay = Math.min(currentDelay * RETRY_CONFIG.backoffMultiplier, RETRY_CONFIG.maxDelay);
      retryCount++;
    } else {
      break;
    }
  }

  if (!imageGeneration) {
    console.error(`[InternalCallback] ❌ Image generation NOT FOUND for task ${taskId} after ${RETRY_CONFIG.maxRetries} retries`);
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
 * 处理普通模式回调
 * 逻辑与 ai-callback route 保持一致
 */
async function handleNormalCallback(
  imageGeneration: ImageGeneration,
  data: InternalCallbackData
): Promise<void> {
  const { taskId, status, images = [], error, metadata = {} } = data;

  console.log(`[InternalCallback] Normal mode callback for generation ${imageGeneration.id}`);

  const updateData: any = {
    provider_task_id: taskId,
    updated_at: new Date().toISOString(),
  };

  if (status === 'completed' && images.length > 0) {
    // 成功：保存图片并上传到 R2
    updateData.status = 'COMPLETED';
    updateData.image_urls = images.map(img => img.url);
    updateData.image_count = images.length;
    updateData.completed_at = new Date().toISOString();

    console.log(`[InternalCallback] Images received: ${updateData.image_urls.join(', ')}`);

    // 上传到 R2
    try {
      const uploadResult = await ImageStorageService.uploadImagesToR2(
        images,
        imageGeneration.id
      );
      if (uploadResult.success && uploadResult.r2Urls) {
        updateData.image_urls_r2 = uploadResult.r2Urls;
        console.log(`[InternalCallback] R2 uploaded: ${uploadResult.r2Urls.join(', ')}`);
      }
    } catch (uploadError) {
      console.error(`[InternalCallback] R2 upload failed:`, uploadError);
    }

    updateData.metadata = {
      ...imageGeneration.metadata,
      provider_response: metadata,
      callback_received_at: new Date().toISOString(),
    };

  } else if (status === 'failed' || images.length === 0) {
    // 失败：记录错误并退款
    updateData.status = 'FAILED';
    updateData.error_message = error || 'Generation failed';
    updateData.metadata = {
      ...imageGeneration.metadata,
      provider_error: error,
      callback_received_at: new Date().toISOString(),
      failed_at: new Date().toISOString(),
    };

    // 退款
    await handleRefund(imageGeneration);
  }

  await updateImageGenerationById(imageGeneration.id, updateData);
  console.log(`[InternalCallback] ✅ Generation ${imageGeneration.id} updated to ${updateData.status}`);
}

/**
 * 处理退款
 */
async function handleRefund(imageGeneration: ImageGeneration): Promise<void> {
  try {
    const creditDeduction = imageGeneration.metadata?.credit_deduction;

    if (!creditDeduction?.pools?.length) {
      console.error(`[InternalCallback] ❌ No credit_deduction info for refund`);
      return;
    }

    for (const pool of creditDeduction.pools) {
      await increaseCredits({
        user_uuid: imageGeneration.user_id,
        trans_type: CreditsTransType.RefundImageGenerationFailed,
        credits: pool.deducted,
        order_no: pool.order_no,
        expired_at: pool.expired_at,
      });

      console.log(`[InternalCallback] Credits refunded: ${pool.deducted} to pool ${pool.order_no}`);
    }

    console.log(`[InternalCallback] Total refunded: ${creditDeduction.totalDeducted} credits`);
  } catch (error) {
    console.error(`[InternalCallback] Refund failed:`, error);
  }
}
