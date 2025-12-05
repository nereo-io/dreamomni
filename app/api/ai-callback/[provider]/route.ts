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
import { handleAgentModeCallback } from "@/services/agentImageCallbackService";

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

    // 验证提供商是否支持
    const providerInstance = aiServiceManager.getProvider(provider);
    if (!providerInstance) {
      console.error(`[Callback] ❌ Unsupported provider: ${provider}`);
      return respErr(`Unsupported provider: ${provider}`);
    }

    // 解析回调数据
    const callbackData = await req.json();
    // 使用提供商特定的处理逻辑
    const processedResult = await providerInstance.handleCallback(callbackData);

    // 查找对应的图片生成记录
    // 1. 首先尝试用 provider_task_id 查找（常规模式）
    let imageGeneration = await getImageGenerationByProviderTaskId(
      processedResult.taskId
    );

    // 2. 如果找不到，尝试用 agent_task_id 查找（Agent 模式）
    let isAgentModeCallback = false;
    if (!imageGeneration) {
      imageGeneration = await getImageGenerationByAgentTaskId(processedResult.taskId);
      if (imageGeneration) {
        isAgentModeCallback = true;
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

    // ============ Agent 模式回调处理 ============
    if (isAgentModeCallback || imageGeneration.is_agent_mode || imageGeneration.metadata?.is_agent_mode) {
      const result = await handleAgentModeCallback(
        imageGeneration,
        processedResult,
        provider
      );
      return respData(result);
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

        // 记录回调成功的图片 URL（provider 返回）
        console.log(`[Callback] Images received: ${updateData.image_urls.join(", ")}`);

        // 使用 ImageStorageService 上传图片到 R2
        const uploadResult = await ImageStorageService.uploadImagesToR2(
          processedResult.images,
          imageGeneration.id
        );
        
        if (uploadResult.success && uploadResult.r2Urls) {
          updateData.image_urls_r2 = uploadResult.r2Urls;
          console.log(`[Callback] R2 uploaded: ${uploadResult.r2Urls.join(", ")}`);
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
    console.log(`[Callback] DB updated for ${imageGeneration.id}, status -> ${updateData.status}`);

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
