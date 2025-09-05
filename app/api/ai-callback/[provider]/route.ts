/**
 * 通用AI服务提供商回调接口
 * Generic AI Provider Callback API
 */

import { respData, respErr } from "@/lib/resp";
import { aiServiceManager } from "@/services/AIServiceManager";
import { 
  updateImageGenerationById,
  getImageGenerationByProviderTaskId 
} from "@/models/imageGeneration";
import {
  increaseCredits,
  CreditsTransType,
} from "@/services/credit";

import type { AIServiceProvider } from "@/types/provider.d";
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
    
    console.log(`[Callback] Received from provider: ${provider}`);

    // 验证提供商是否支持
    const providerInstance = aiServiceManager.getProvider(provider);
    if (!providerInstance) {
      console.error(`[Callback] Unsupported provider: ${provider}`);
      return respErr(`Unsupported provider: ${provider}`);
    }

    // 解析回调数据
    const callbackData = await req.json();
    console.log(`[Callback] Data from ${provider}:`, {
      taskId: callbackData.data?.taskId,
      state: callbackData.data?.state,
      code: callbackData.code
    });

    // 使用提供商特定的处理逻辑
    const processedResult = await providerInstance.handleCallback(callbackData);

    // 查找对应的图片生成记录
    const imageGeneration = await getImageGenerationByProviderTaskId(
      processedResult.taskId
    );

    if (!imageGeneration) {
      console.error(`[Callback] Image generation not found for task: ${processedResult.taskId}`);
      return respErr(`Image generation not found for task: ${processedResult.taskId}`);
    }

    console.log(`[Callback] Found generation record: ${imageGeneration.id} for task: ${processedResult.taskId}`);

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
        updateData.image_urls = processedResult.images.map(img => img.url);
        updateData.image_count = processedResult.images.length;
        updateData.completed_at = new Date().toISOString();
        
        console.log(`[Callback] Completed with ${processedResult.images.length} images`);
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

      // 图片生成失败，返还积分
      try {
        const creditsToRefund = imageGeneration.credits_used || 2; // 默认2个积分
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
        const expiredAt = oneMonthFromNow.toISOString();

        await increaseCredits({
          user_uuid: imageGeneration.user_id,
          trans_type: CreditsTransType.RefundImageGenerationFailed,
          credits: creditsToRefund,
          expired_at: expiredAt,
        });

        console.log(`[Callback] Credits refunded: ${creditsToRefund} for failed generation ${imageGeneration.id}`);
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
