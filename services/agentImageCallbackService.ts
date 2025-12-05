/**
 * Agent 图片生成回调处理服务
 * Agent Image Generation Callback Service
 *
 * 职责：
 * 1. 处理 Agent 模式的并发回调（使用 PostgreSQL RPC 原子追加）
 * 2. 聚合多张图片的结果到主记录
 * 3. 处理部分失败的退款逻辑
 */

import { getSupabaseClient } from '@/models/db';
import {
  updateImageGenerationById,
  getImageGenerationById,
} from '@/models/imageGeneration';
import {
  increaseCredits,
  CreditsTransType,
} from '@/services/credit';
import { ImageStorageService } from '@/services/imageStorageService';
import { calculateImageCredits } from '@/config/image-models';

import type { AIServiceProvider } from '@/types/provider.d';
import type { ImageGeneration } from '@/types/image.d';

// =====================================================
// 类型定义
// =====================================================

/**
 * Provider 回调处理结果
 */
export interface ProcessedCallbackResult {
  taskId: string;
  status: 'completed' | 'failed' | 'processing' | 'pending';
  images?: Array<{ url: string }>;
  error?: string;
  metadata?: any;
}

/**
 * Agent 回调处理响应
 */
export interface AgentCallbackResponse {
  success: boolean;
  message: string;
  taskId: string;
  generationId: string;
  completedCount: number;
  failedCount: number;
  totalCount: number;
  allDone: boolean;
}

/**
 * RPC 函数返回结果
 */
interface RpcResult {
  generation_id: string;
  image_count: number;
  agent_image_count: number;
  failed_count: number;
  all_done: boolean;
}

// =====================================================
// 主要处理函数
// =====================================================

/**
 * 处理 Agent 模式的回调（使用 RPC 原子追加）
 * 聚合多张图片的结果到主记录
 *
 * @param imageGeneration - 图片生成记录
 * @param processedResult - Provider 回调处理结果
 * @param provider - AI 服务提供商
 * @returns Agent 回调处理响应
 */
export async function handleAgentModeCallback(
  imageGeneration: ImageGeneration,
  processedResult: ProcessedCallbackResult,
  provider: AIServiceProvider
): Promise<AgentCallbackResponse> {
  const taskId = processedResult.taskId;
  const agentImageCount = imageGeneration.agent_image_count ||
                          imageGeneration.metadata?.agent_image_count || 0;

  console.log(`[Callback-Agent] Processing task ${taskId} for generation ${imageGeneration.id}`);

  // 处理图片生成成功的回调
  if (processedResult.status === 'completed' && processedResult.images && processedResult.images.length > 0) {
    return await handleCompletedCallback(imageGeneration, processedResult, taskId, agentImageCount);
  }

  // 处理单个任务失败的回调
  if (processedResult.status === 'failed') {
    return await handleFailedCallback(imageGeneration, processedResult, taskId, agentImageCount);
  }

  // 处理其他状态（processing 等）
  console.log(`[Callback-Agent] Task ${taskId} status: ${processedResult.status} (no action needed)`);
  return {
    success: true,
    message: "Agent callback received",
    taskId,
    generationId: imageGeneration.id,
    completedCount: 0,
    failedCount: 0,
    totalCount: agentImageCount,
    allDone: false,
  };
}

// =====================================================
// 私有辅助函数
// =====================================================

/**
 * 处理图片生成成功的回调
 */
async function handleCompletedCallback(
  imageGeneration: ImageGeneration,
  processedResult: ProcessedCallbackResult,
  taskId: string,
  agentImageCount: number
): Promise<AgentCallbackResponse> {
  const newImageUrl = processedResult.images![0].url;
  console.log(`[Callback-Agent] Image received: ${newImageUrl}`);

  // 上传到 R2
  let r2Url: string | null = null;
  try {
    const uploadResult = await ImageStorageService.uploadImagesToR2(
      processedResult.images!,
      `${imageGeneration.id}-${Date.now()}`
    );
    if (uploadResult.success && uploadResult.r2Urls && uploadResult.r2Urls.length > 0) {
      r2Url = uploadResult.r2Urls[0];
      console.log(`[Callback-Agent] R2 uploaded: ${r2Url}`);
    }
  } catch (uploadError) {
    console.error(`[Callback-Agent] R2 upload failed:`, uploadError);
  }

  // 🔥 使用 RPC 原子追加图片
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .rpc('append_image_to_agent_generation', {
      p_generation_id: imageGeneration.id,
      p_image_url: newImageUrl,
      p_r2_url: r2Url,
      p_task_id: taskId,
      p_task_status: 'completed',
    });

  if (error) {
    console.error(`[Callback-Agent] RPC append failed:`, error);
    throw new Error(`Failed to append image: ${error.message}`);
  }

  const result = data as RpcResult;
  console.log(`[Callback-Agent] Image appended successfully. Progress: ${result.image_count}/${result.agent_image_count}, Failed: ${result.failed_count}`);

  // 检查是否全部完成
  if (result.all_done) {
    await handleAllTasksComplete(imageGeneration, result);
  }

  return {
    success: true,
    message: "Agent callback processed",
    taskId,
    generationId: imageGeneration.id,
    completedCount: result.image_count,
    failedCount: result.failed_count,
    totalCount: result.agent_image_count,
    allDone: result.all_done,
  };
}

/**
 * 处理单个任务失败的回调
 */
async function handleFailedCallback(
  imageGeneration: ImageGeneration,
  processedResult: ProcessedCallbackResult,
  taskId: string,
  agentImageCount: number
): Promise<AgentCallbackResponse> {
  console.error(`[Callback-Agent] Task ${taskId} failed: ${processedResult.error}`);

  // 🔥 使用 RPC 标记任务失败
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .rpc('mark_agent_task_failed', {
      p_generation_id: imageGeneration.id,
      p_task_id: taskId,
      p_error: processedResult.error || 'Unknown error',
    });

  if (error) {
    console.error(`[Callback-Agent] Mark failed RPC error:`, error);
    throw new Error(`Failed to mark task failed: ${error.message}`);
  }

  const result = data as RpcResult;
  console.log(`[Callback-Agent] Task marked as failed. Progress: ${result.image_count}/${result.agent_image_count}, Failed: ${result.failed_count}`);

  // 检查是否全部完成
  if (result.all_done) {
    await handleAllTasksCompleteWithFailures(imageGeneration, result);
  }

  return {
    success: true,
    message: "Agent callback processed (task failed)",
    taskId,
    generationId: imageGeneration.id,
    completedCount: result.image_count,
    failedCount: result.failed_count,
    totalCount: result.agent_image_count,
    allDone: result.all_done,
  };
}

/**
 * 处理所有任务完成的情况（全部成功或部分成功）
 */
async function handleAllTasksComplete(
  imageGeneration: ImageGeneration,
  result: RpcResult
): Promise<void> {
  console.log(`[Callback-Agent] All tasks done. Final count: ${result.image_count}/${result.agent_image_count}, Failed: ${result.failed_count}`);

  const updateData: any = {
    status: 'COMPLETED',
    completed_at: new Date().toISOString(),
  };

  // 部分失败退款
  if (result.failed_count > 0) {
    await handleAgentPartialRefund(imageGeneration, result.failed_count);
    const singleImageCredits = calculateImageCredits(
      imageGeneration.model_id,
      imageGeneration.metadata?.resolution
    );
    updateData.credits_used = imageGeneration.credits_used - (singleImageCredits * result.failed_count);
    console.log(`[Callback-Agent] Refunded ${singleImageCredits * result.failed_count} credits for ${result.failed_count} failed tasks`);
  }

  await updateImageGenerationById(imageGeneration.id, updateData);
  console.log(`[Callback-Agent] Generation ${imageGeneration.id} marked as COMPLETED`);
}

/**
 * 处理所有任务完成的情况（含失败任务）
 */
async function handleAllTasksCompleteWithFailures(
  imageGeneration: ImageGeneration,
  result: RpcResult
): Promise<void> {
  console.log(`[Callback-Agent] All tasks done (with failures). Final count: ${result.image_count}/${result.agent_image_count}, Failed: ${result.failed_count}`);

  if (result.image_count === 0) {
    // 全部失败
    await updateImageGenerationById(imageGeneration.id, {
      status: 'FAILED',
      error_message: 'All agent tasks failed',
    });
    await handleAgentFullRefund(imageGeneration);
    console.log(`[Callback-Agent] Generation ${imageGeneration.id} marked as FAILED (all tasks failed)`);
  } else {
    // 部分成功
    const updateData: any = {
      status: 'COMPLETED',
      completed_at: new Date().toISOString(),
    };
    await handleAgentPartialRefund(imageGeneration, result.failed_count);
    const singleImageCredits = calculateImageCredits(
      imageGeneration.model_id,
      imageGeneration.metadata?.resolution
    );
    updateData.credits_used = imageGeneration.credits_used - (singleImageCredits * result.failed_count);
    await updateImageGenerationById(imageGeneration.id, updateData);
    console.log(`[Callback-Agent] Generation ${imageGeneration.id} marked as COMPLETED (partial success)`);
  }
}

/**
 * Agent 模式部分退款
 * 按比例退款：成功 N 张扣 N 张积分，失败的自动退款
 */
async function handleAgentPartialRefund(
  imageGeneration: ImageGeneration,
  failedCount: number
): Promise<void> {
  try {
    const creditDeduction = imageGeneration.metadata?.credit_deduction;
    if (!creditDeduction?.pools?.length) {
      console.error(`[Callback-Agent] No credit_deduction info for partial refund`);
      return;
    }

    const singleImageCredits = calculateImageCredits(
      imageGeneration.model_id,
      imageGeneration.metadata?.resolution
    );
    const refundAmount = singleImageCredits * failedCount;

    let remainingRefund = refundAmount;
    const poolsReversed = [...creditDeduction.pools].reverse();

    for (const pool of poolsReversed) {
      if (remainingRefund <= 0) break;
      const refundFromPool = Math.min(pool.deducted, remainingRefund);

      await increaseCredits({
        user_uuid: imageGeneration.user_id,
        trans_type: CreditsTransType.RefundImageGenerationFailed,
        credits: refundFromPool,
        order_no: pool.order_no,
        expired_at: pool.expired_at,
      });

      remainingRefund -= refundFromPool;
      console.log(`[Callback-Agent] Refunded ${refundFromPool} credits to pool ${pool.order_no}`);
    }

    console.log(`[Callback-Agent] Total refunded: ${refundAmount} credits for ${failedCount} failed tasks`);
  } catch (error) {
    console.error(`[Callback-Agent] Partial refund failed:`, error);
  }
}

/**
 * Agent 模式全额退款
 * 用于所有任务都失败的情况
 */
async function handleAgentFullRefund(imageGeneration: ImageGeneration): Promise<void> {
  try {
    const creditDeduction = imageGeneration.metadata?.credit_deduction;
    if (!creditDeduction?.pools?.length) {
      console.error(`[Callback-Agent] No credit_deduction info for full refund`);
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
      console.log(`[Callback-Agent] Refunded ${pool.deducted} credits to pool ${pool.order_no}`);
    }

    console.log(`[Callback-Agent] Full refund completed: ${creditDeduction.totalDeducted} credits`);
  } catch (error) {
    console.error(`[Callback-Agent] Full refund failed:`, error);
  }
}
