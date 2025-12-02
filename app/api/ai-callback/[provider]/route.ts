/**
 * 通用AI服务提供商回调接口
 * Generic AI Provider Callback API
 */

import { respData, respErr } from "@/lib/resp";
import { aiServiceManager } from "@/services/AIServiceManager";
import {
  updateImageGenerationById,
  getImageGenerationByProviderTaskId,
  getImageGenerationByAgentTaskId,
} from "@/models/imageGeneration";
import {
  increaseCredits,
  CreditsTransType,
} from "@/services/credit";
import { ImageStorageService } from "@/services/imageStorageService";
import { calculateImageCredits } from "@/config/image-models";

import type { AIServiceProvider } from "@/types/provider.d";
import type { ImageGeneration } from "@/types/image.d";
import { NextRequest } from "next/server";

/**
 * 处理AI服务提供商的回调请求
 * Handle callback requests from AI service providers
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const provider = params.provider as AIServiceProvider;

    console.log(`[Callback] ========================================`);
    console.log(`[Callback] Received callback from provider: ${provider}`);
    console.log(`[Callback] Timestamp: ${new Date().toISOString()}`);

    // 验证提供商是否支持
    const providerInstance = aiServiceManager.getProvider(provider);
    if (!providerInstance) {
      console.error(`[Callback] ❌ Unsupported provider: ${provider}`);
      return respErr(`Unsupported provider: ${provider}`);
    }

    // 解析回调数据
    const callbackData = await req.json();
    console.log(`[Callback] Raw callback data:`, JSON.stringify({
      code: callbackData.code,
      msg: callbackData.msg,
      taskId: callbackData.data?.taskId,
      state: callbackData.data?.state,
      model: callbackData.data?.model,
    }, null, 2));

    // 使用提供商特定的处理逻辑
    const processedResult = await providerInstance.handleCallback(callbackData);
    console.log(`[Callback] Processed result:`, {
      taskId: processedResult.taskId,
      status: processedResult.status,
      hasImages: !!(processedResult.images && processedResult.images.length > 0),
      imageCount: processedResult.images?.length || 0,
      error: processedResult.error,
    });

    // 查找对应的图片生成记录
    // 1. 首先尝试用 provider_task_id 查找（常规模式）
    console.log(`[Callback] Step 1: Searching by provider_task_id: ${processedResult.taskId}`);
    let imageGeneration = await getImageGenerationByProviderTaskId(
      processedResult.taskId
    );

    if (imageGeneration) {
      console.log(`[Callback] ✅ Found by provider_task_id: ${imageGeneration.id}`);
    }

    // 2. 如果找不到，尝试用 agent_task_id 查找（Agent 模式）
    let isAgentModeCallback = false;
    if (!imageGeneration) {
      console.log(`[Callback] Step 2: Not found by provider_task_id, trying agent_task_ids...`);
      imageGeneration = await getImageGenerationByAgentTaskId(processedResult.taskId);
      if (imageGeneration) {
        isAgentModeCallback = true;
        console.log(`[Callback] ✅ Found Agent mode record: ${imageGeneration.id}`);
        console.log(`[Callback]   is_agent_mode: ${imageGeneration.is_agent_mode}`);
        console.log(`[Callback]   agent_image_count: ${imageGeneration.agent_image_count}`);
        console.log(`[Callback]   metadata.is_agent_mode: ${imageGeneration.metadata?.is_agent_mode}`);
      }
    }

    if (!imageGeneration) {
      console.error(`[Callback] ❌ Image generation NOT FOUND for task: ${processedResult.taskId}`);
      console.error(`[Callback] This callback will be ignored. Possible reasons:`);
      console.error(`[Callback]   1. Record not in database yet (timing issue)`);
      console.error(`[Callback]   2. Task ID mismatch`);
      console.error(`[Callback]   3. Record status not in [IN_PROGRESS, PENDING, IN_QUEUE]`);
      return respErr(`Image generation not found for task: ${processedResult.taskId}`);
    }

    console.log(`[Callback] ✅ Found generation record: ${imageGeneration.id}`);
    console.log(`[Callback]   Current status: ${imageGeneration.status}`);
    console.log(`[Callback]   is_agent_mode column: ${imageGeneration.is_agent_mode}`);
    console.log(`[Callback]   metadata.is_agent_mode: ${imageGeneration.metadata?.is_agent_mode}`);

    // ============ Agent 模式回调处理 ============
    if (isAgentModeCallback || imageGeneration.is_agent_mode || imageGeneration.metadata?.is_agent_mode) {
      return await handleAgentModeCallback(
        imageGeneration,
        processedResult,
        provider
      );
    }
    // ============ Agent 模式回调处理结束 ============

    // 映射 ProviderResponse 状态到数据库状态
    const mapStatusToDb = (providerStatus: string): string => {
      switch (providerStatus.toLowerCase()) {
        case "completed":
          return "COMPLETED";
        case "failed":
          return "FAILED";
        case "processing":
          return "IN_PROGRESS";
        case "pending":
          return "PENDING";
        default:
          return "PENDING";
      }
    };

    // 根据处理结果更新数据库
    const updateData: any = {
      status: mapStatusToDb(processedResult.status),
      provider_task_id: processedResult.taskId,
      updated_at: new Date().toISOString(),
    };

    if (processedResult.status === 'completed') {
      if (processedResult.images && processedResult.images.length > 0) {
        // 保存原始 provider URLs
        updateData.image_urls = processedResult.images.map(img => img.url);
        updateData.image_count = processedResult.images.length;
        updateData.completed_at = new Date().toISOString();
        
        console.log(`[Callback] Completed with ${processedResult.images.length} images`);
        
        // 使用 ImageStorageService 上传图片到 R2
        const uploadResult = await ImageStorageService.uploadImagesToR2(
          processedResult.images,
          imageGeneration.id
        );
        
        if (uploadResult.success && uploadResult.r2Urls) {
          updateData.image_urls_r2 = uploadResult.r2Urls;
          console.log(`[Callback] R2 upload complete: ${uploadResult.r2Urls.length} successful, ${uploadResult.failedCount} failed`);
        } else if (uploadResult.failedCount > 0) {
          console.warn(`[Callback] R2 upload partial failure: ${uploadResult.failedCount} images failed`);
        }
      } else {
        console.error(`[Callback] Completed but no images found`);
      }
      
      // 存储提供商的响应数据
      updateData.metadata = {
        ...imageGeneration.metadata,
        provider_response: processedResult.metadata,
        provider_images: processedResult.images,
        callback_received_at: new Date().toISOString(),
      };
    } else if (processedResult.status === 'failed') {
      updateData.error_message = processedResult.error || 'Generation failed';
      updateData.metadata = {
        ...imageGeneration.metadata,
        provider_error: processedResult.error,
        provider_metadata: processedResult.metadata,
        callback_received_at: new Date().toISOString(),
        failed_at: new Date().toISOString(), // 移到metadata中，因为数据库表中没有failed_at字段
      };

      // 图片生成失败，返还积分到原池
      try {
        // 从 metadata 中提取原始扣费池信息
        const creditDeduction = imageGeneration.metadata?.credit_deduction;

        if (!creditDeduction || !creditDeduction.pools || creditDeduction.pools.length === 0) {
          console.error("[Callback] ❌ Missing credit_deduction metadata for generation:", imageGeneration.id);
          console.error("[Callback] Cannot refund credits - pool information lost");
          throw new Error("Missing credit pool information for refund. This is a data integrity issue.");
        }

        // 遍历所有扣费的池，按原扣费金额逐一退款
        for (const pool of creditDeduction.pools) {
          await increaseCredits({
            user_uuid: imageGeneration.user_id,
            trans_type: CreditsTransType.RefundImageGenerationFailed,
            credits: pool.deducted,
            order_no: pool.order_no,
            expired_at: pool.expired_at,
          });

          console.log(
            `[Callback] ✅ Credits refunded: ${pool.deducted} to pool ${pool.order_no} for failed generation ${imageGeneration.id}`
          );
        }

        console.log(
          `[Callback] ✅ Total refunded: ${creditDeduction.totalDeducted} credits across ${creditDeduction.pools.length} pool(s) for image generation ${imageGeneration.id}`
        );
      } catch (refundError) {
        console.error("[Callback] Failed to refund credits:", refundError);
        // 不阻止回调处理，继续执行
      }
    } else {
      // 处理中状态
      updateData.metadata = {
        ...imageGeneration.metadata,
        provider_status: processedResult.status,
        provider_metadata: processedResult.metadata,
        last_update_at: new Date().toISOString(),
      };
    }

    // 更新数据库记录
    const updatedRecord = await updateImageGenerationById(imageGeneration.id, updateData);
    console.log(`[Callback] Updated generation ${imageGeneration.id} with status: ${updateData.status}`);

    // 返回成功响应
    return respData({
      success: true,
      message: "Callback processed successfully",
      taskId: processedResult.taskId,
      status: processedResult.status,
      processedAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error("[Callback] Processing error:", error);
    return respErr(error instanceof Error ? error.message : "Internal server error");
  }
}

/**
 * 处理 Agent 模式的回调
 * 聚合多张图片的结果到主记录
 */
async function handleAgentModeCallback(
  imageGeneration: ImageGeneration,
  processedResult: any,
  provider: AIServiceProvider
): Promise<Response> {
  const taskId = processedResult.taskId;
  const agentImageCount = imageGeneration.agent_image_count ||
    imageGeneration.metadata?.agent_image_count || 0;
  const agentTasks = imageGeneration.metadata?.agent_tasks || [];

  console.log(`[Callback-Agent] Processing task ${taskId} for Agent generation ${imageGeneration.id}`);
  console.log(`[Callback-Agent] Expected images: ${agentImageCount}`);

  // 找到对应的任务索引
  const taskIndex = agentTasks.findIndex((t: any) => t.taskId === taskId);
  if (taskIndex === -1) {
    console.warn(`[Callback-Agent] Task ${taskId} not found in agent_tasks, searching by task_ids...`);
  }

  // 获取当前已完成的图片
  const currentImageUrls = imageGeneration.image_urls || [];
  const currentR2Urls = imageGeneration.image_urls_r2 || [];

  // 更新 agent_tasks 中对应任务的状态
  const updatedAgentTasks = [...agentTasks];
  if (taskIndex >= 0) {
    updatedAgentTasks[taskIndex] = {
      ...updatedAgentTasks[taskIndex],
      status: processedResult.status,
      completedAt: new Date().toISOString(),
    };
  }

  if (processedResult.status === 'completed' && processedResult.images?.length > 0) {
    // 图片生成成功
    const newImageUrl = processedResult.images[0].url;
    console.log(`[Callback-Agent] Task ${taskId} completed with image: ${newImageUrl.substring(0, 50)}...`);

    // 追加图片到数组
    const newImageUrls = [...currentImageUrls, newImageUrl];

    // 上传到 R2
    let newR2Urls = [...currentR2Urls];
    try {
      const uploadResult = await ImageStorageService.uploadImagesToR2(
        processedResult.images,
        `${imageGeneration.id}-${newImageUrls.length}`
      );
      if (uploadResult.success && uploadResult.r2Urls && uploadResult.r2Urls.length > 0) {
        newR2Urls = [...currentR2Urls, ...uploadResult.r2Urls];
        console.log(`[Callback-Agent] R2 upload successful`);
      }
    } catch (uploadError) {
      console.error(`[Callback-Agent] R2 upload failed:`, uploadError);
    }

    // 更新任务结果
    if (taskIndex >= 0) {
      updatedAgentTasks[taskIndex].imageUrl = newImageUrl;
      updatedAgentTasks[taskIndex].r2Url = newR2Urls[newR2Urls.length - 1];
    }

    // 检查是否所有图片都已完成
    const completedCount = newImageUrls.length;
    const failedCount = updatedAgentTasks.filter((t: any) => t.status === 'failed').length;
    const allDone = completedCount + failedCount >= agentImageCount;

    console.log(`[Callback-Agent] Progress: ${completedCount} completed, ${failedCount} failed, ${agentImageCount - completedCount - failedCount} pending`);

    // 构建更新数据
    const updateData: any = {
      image_urls: newImageUrls,
      image_urls_r2: newR2Urls,
      image_count: newImageUrls.length,
      metadata: {
        ...imageGeneration.metadata,
        agent_tasks: updatedAgentTasks,
        completed_count: completedCount,
        failed_count: failedCount,
        last_callback_at: new Date().toISOString(),
      },
    };

    if (allDone) {
      updateData.status = failedCount > 0 ? 'COMPLETED' : 'COMPLETED'; // 可以区分 PARTIAL_COMPLETED
      updateData.completed_at = new Date().toISOString();

      // 如果有失败的任务，按比例退款
      if (failedCount > 0) {
        await handleAgentPartialRefund(imageGeneration, failedCount);
        updateData.credits_used = imageGeneration.credits_used -
          (calculateImageCredits(imageGeneration.model_id, imageGeneration.metadata?.resolution) * failedCount);
      }

      console.log(`[Callback-Agent] All tasks done! Final status: ${updateData.status}`);
    } else {
      updateData.status = 'IN_PROGRESS';
    }

    await updateImageGenerationById(imageGeneration.id, updateData);

    return respData({
      success: true,
      message: "Agent callback processed",
      taskId,
      generationId: imageGeneration.id,
      completedCount,
      totalCount: agentImageCount,
      allDone,
    });

  } else if (processedResult.status === 'failed') {
    // 单个任务失败
    console.error(`[Callback-Agent] Task ${taskId} failed: ${processedResult.error}`);

    if (taskIndex >= 0) {
      updatedAgentTasks[taskIndex].status = 'failed';
      updatedAgentTasks[taskIndex].error = processedResult.error;
    }

    const completedCount = currentImageUrls.length;
    const failedCount = updatedAgentTasks.filter((t: any) => t.status === 'failed').length;
    const allDone = completedCount + failedCount >= agentImageCount;

    const updateData: any = {
      metadata: {
        ...imageGeneration.metadata,
        agent_tasks: updatedAgentTasks,
        completed_count: completedCount,
        failed_count: failedCount,
        last_callback_at: new Date().toISOString(),
      },
    };

    if (allDone) {
      if (completedCount === 0) {
        // 全部失败
        updateData.status = 'FAILED';
        updateData.error_message = 'All agent tasks failed';
        await handleAgentFullRefund(imageGeneration);
      } else {
        // 部分成功
        updateData.status = 'COMPLETED';
        updateData.completed_at = new Date().toISOString();
        await handleAgentPartialRefund(imageGeneration, failedCount);
        updateData.credits_used = imageGeneration.credits_used -
          (calculateImageCredits(imageGeneration.model_id, imageGeneration.metadata?.resolution) * failedCount);
      }
    }

    await updateImageGenerationById(imageGeneration.id, updateData);

    return respData({
      success: true,
      message: "Agent callback processed (task failed)",
      taskId,
      generationId: imageGeneration.id,
      completedCount,
      failedCount,
      totalCount: agentImageCount,
      allDone,
    });
  }

  // 其他状态（processing 等）
  return respData({
    success: true,
    message: "Agent callback received",
    taskId,
    status: processedResult.status,
  });
}

/**
 * Agent 模式部分退款
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

      console.log(`[Callback-Agent] Partial refund: ${refundFromPool} to pool ${pool.order_no}`);
      remainingRefund -= refundFromPool;
    }

    console.log(`[Callback-Agent] Total partial refund: ${refundAmount} credits for ${failedCount} failed tasks`);
  } catch (error) {
    console.error(`[Callback-Agent] Partial refund failed:`, error);
  }
}

/**
 * Agent 模式全额退款
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

      console.log(`[Callback-Agent] Full refund: ${pool.deducted} to pool ${pool.order_no}`);
    }

    console.log(`[Callback-Agent] Total full refund: ${creditDeduction.total_deducted} credits`);
  } catch (error) {
    console.error(`[Callback-Agent] Full refund failed:`, error);
  }
}

/**
 * 处理回调完成的任务
 */
async function handleCompletedCallback(callbackData: any): Promise<void> {
  // 额外的完成后处理逻辑
}

/**
 * 处理回调失败的任务
 */
async function handleFailedCallback(callbackData: any): Promise<void> {
  // 额外的失败处理逻辑
}

/**
 * 处理回调中的任务
 */
async function handleProcessingCallback(callbackData: any): Promise<void> {
  // 额外的处理中逻辑
}

// 不支持其他 HTTP 方法
export async function GET() {
  return new Response("Method not allowed", { status: 405 });
}

export async function PUT() {
  return new Response("Method not allowed", { status: 405 });
}

export async function DELETE() {
  return new Response("Method not allowed", { status: 405 });
}
