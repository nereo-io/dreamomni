/**
 * Agent Image Service
 * Agent 模式图片生成服务 - 批量多角度图片生成业务逻辑
 */

import pLimit from "p-limit";
import { expandImagePrompts, UserContext } from "./promptExpander";
import { aiServiceManager } from "./AIServiceManager";
import {
  createImageGeneration,
  updateImageGenerationById,
} from "@/models/imageGeneration";
import {
  decreaseCredits,
  increaseCredits,
  CreditsTransType,
} from "@/services/credit";
import { calculateImageCredits } from "@/config/image-models";
import type { CreateImageGenerationParams } from "@/types/image.d";
import type { AIServiceProvider } from "@/types/provider.d";

// 最大并发请求数
const MAX_CONCURRENT = 3;

// 图片尺寸类型
type ImageSizeType = "auto" | "1:1" | "3:4" | "9:16" | "4:3" | "16:9";

// Agent 模式生成参数
export interface AgentGenerationParams {
  userId: string;
  userUuid: string;
  prompt: string;
  imageCount: 6 | 9 | 12;
  model: string;
  aspectRatio?: string;
  resolution?: string;
  imageInput?: string[];
  provider: AIServiceProvider;
  outputFormat?: "png" | "jpeg";
  imageSize?: ImageSizeType;
  userContext?: UserContext;
  metadata?: Record<string, any>;
}

// 单个任务结果
export interface AgentTaskResult {
  index: number;
  success: boolean;
  taskId?: string;
  error?: string;
  expandedPrompt: string;
}

// Agent 模式生成结果
export interface AgentGenerationResult {
  generationId: string;
  status: "processing" | "completed" | "partial_failure" | "failed";
  imageCount: number;
  expandedPrompts: string[];
  tasks: AgentTaskResult[];
  creditsUsed: number;
  creditDeduction: any;
}

/**
 * Agent 模式图片生成
 * 1. 扩展提示词
 * 2. 计算并扣除积分
 * 3. 创建数据库记录
 * 4. 并发生成图片
 */
export async function generateAgentImages(
  params: AgentGenerationParams
): Promise<AgentGenerationResult> {
  const {
    userId,
    userUuid,
    prompt,
    imageCount,
    model,
    aspectRatio,
    resolution,
    imageInput,
    provider,
    outputFormat,
    imageSize,
    userContext = "general",
    metadata = {},
  } = params;

  console.log(`[AgentImageService] Starting agent mode generation`);
  console.log(
    `[AgentImageService] User: ${userId}, Count: ${imageCount}, Model: ${model}`
  );

  // 1. 扩展提示词
  console.log(`[AgentImageService] Expanding prompts...`);
  const hasReferenceImages = imageInput && imageInput.length > 0;
  const expandedPrompts = await expandImagePrompts(
    prompt,
    imageCount,
    hasReferenceImages,
    userContext
  );

  console.log(
    `[AgentImageService] Expanded to ${expandedPrompts.length} prompts`
  );

  // 2. 计算并扣除积分
  const singleImageCredits = calculateImageCredits(model, resolution);
  const totalCredits = singleImageCredits * imageCount;

  console.log(
    `[AgentImageService] Credits: ${singleImageCredits} × ${imageCount} = ${totalCredits}`
  );

  let deductResult;
  try {
    deductResult = await decreaseCredits({
      user_uuid: userUuid,
      trans_type: CreditsTransType.ImageGeneration,
      credits: totalCredits,
    });

    console.log(
      `[AgentImageService] Credits deducted: ${deductResult.totalDeducted} from ${deductResult.pools.length} pool(s)`
    );
  } catch (error) {
    console.error("[AgentImageService] Failed to deduct credits:", error);
    throw new Error("Failed to deduct credits");
  }

  // 3. 创建数据库记录
  const createParams: CreateImageGenerationParams = {
    user_id: userId,
    model_id: model,
    prompt,
    mode: hasReferenceImages ? "image-to-image" : "text-to-image",
    source: "web",
    provider,
    input_image_urls: imageInput,
    aspect_ratio: aspectRatio || imageSize,
    credits_used: totalCredits,
    status: "IN_PROGRESS",
    // Agent 模式字段 - 必须作为顶级字段传递
    is_agent_mode: true,
    agent_image_count: imageCount,
    expanded_prompts: expandedPrompts,
    metadata: {
      ...metadata,
      is_agent_mode: true, // 同时保留在 metadata 中作为备份
      agent_image_count: imageCount,
      expanded_prompts: expandedPrompts,
      user_context: userContext,
      resolution,
      output_format: outputFormat,
      credit_deduction: {
        pools: deductResult.pools,
        total_deducted: deductResult.totalDeducted,
        deducted_at: new Date().toISOString(),
      },
    },
  };

  let imageGeneration;
  try {
    imageGeneration = await createImageGeneration(createParams);
    console.log(
      `[AgentImageService] Created generation record: ${imageGeneration.id}`
    );
  } catch (error) {
    console.error(
      "[AgentImageService] Failed to create generation record:",
      error
    );

    // 退还积分
    await refundCredits(userUuid, deductResult);
    throw new Error("Failed to create generation record");
  }

  // 4. 并发生成图片 (最大 3 并发)
  const limit = pLimit(MAX_CONCURRENT);
  const providerInstance = aiServiceManager.getProvider(provider);

  if (!providerInstance) {
    console.error(`[AgentImageService] Provider ${provider} not available`);

    // 更新记录状态并退款
    await updateImageGenerationById(imageGeneration.id, {
      status: "FAILED",
      error_message: `Provider ${provider} not available`,
    });
    await refundCredits(userUuid, deductResult);

    throw new Error(`Provider ${provider} not available`);
  }

  const tasks = expandedPrompts.map((expandedPrompt, idx) =>
    limit(async (): Promise<AgentTaskResult> => {
      try {
        console.log(
          `[AgentImageService] Generating image ${idx + 1}/${imageCount}...`
        );

        let result;
        if (hasReferenceImages) {
          // 图生图模式
          result = await aiServiceManager.editImage(provider, {
            prompt: expandedPrompt,
            imageUrls: imageInput!,
            model,
            aspect_ratio: aspectRatio,
            resolution,
            output_format: outputFormat,
            image_size: imageSize,
          });
        } else {
          // 文生图模式
          result = await aiServiceManager.generateImage(provider, {
            prompt: expandedPrompt,
            model,
            aspect_ratio: aspectRatio,
            resolution,
            count: 1,
            output_format: outputFormat,
            image_size: imageSize,
          });
        }

        // Ensure provider returned a valid taskId
        if (!result.taskId || result.status === "failed") {
          const providerError =
            result.error || "No taskId returned from provider";
          throw new Error(providerError);
        }

        console.log(
          `[AgentImageService] Task ${idx + 1} submitted: taskId=${
            result.taskId
          }`
        );

        return {
          index: idx,
          success: true,
          taskId: result.taskId,
          expandedPrompt,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          `[AgentImageService] Task ${idx + 1} failed:`,
          errorMessage
        );

        return {
          index: idx,
          success: false,
          error: errorMessage,
          expandedPrompt,
        };
      }
    })
  );

  const results = await Promise.all(tasks);

  // 统计结果
  const successCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;

  console.log(
    `[AgentImageService] Generation tasks completed: ${successCount} success, ${failedCount} failed`
  );

  // 5. 更新数据库记录，存储 agent_task_ids
  const taskIds = results
    .filter((r) => r.success && r.taskId)
    .map((r) => r.taskId);

  console.log(`[AgentImageService] ========== Storing task IDs ==========`);
  console.log(`[AgentImageService] Generation ID: ${imageGeneration.id}`);
  console.log(`[AgentImageService] Total task IDs: ${taskIds.length}`);
  console.log(`[AgentImageService] Task IDs: ${taskIds.join(", ")}`);

  let status: "processing" | "completed" | "partial_failure" | "failed";
  if (failedCount === 0) {
    status = "processing";
  } else if (successCount === 0) {
    status = "failed";
  } else {
    status = "partial_failure";
  }

  const updatedMetadata = {
    ...createParams.metadata,
    agent_tasks: results,
    agent_task_ids: taskIds,
    success_count: successCount,
    failed_count: failedCount,
  };

  console.log(
    `[AgentImageService] Updating record with metadata.agent_task_ids: ${
      updatedMetadata.agent_task_ids?.length || 0
    } IDs`
  );

  await updateImageGenerationById(imageGeneration.id, {
    metadata: updatedMetadata,
  });

  console.log(`[AgentImageService] ✅ Record updated with task IDs`);
  console.log(`[AgentImageService] ========================================`);

  // 6. 如果全部失败，退还全部积分
  if (status === "failed") {
    console.log(
      "[AgentImageService] All tasks failed, refunding all credits..."
    );
    await refundCredits(userUuid, deductResult);

    await updateImageGenerationById(imageGeneration.id, {
      status: "FAILED",
      error_message: "All image generation tasks failed",
      credits_used: 0,
    });
  }

  // 7. 如果部分失败，退还失败部分的积分
  if (status === "partial_failure") {
    const refundAmount = singleImageCredits * failedCount;
    console.log(
      `[AgentImageService] Partial failure, refunding ${refundAmount} credits for ${failedCount} failed tasks...`
    );

    await refundPartialCredits(
      userUuid,
      deductResult,
      refundAmount,
      singleImageCredits
    );

    await updateImageGenerationById(imageGeneration.id, {
      credits_used: singleImageCredits * successCount,
      metadata: {
        ...createParams.metadata,
        agent_tasks: results,
        agent_task_ids: taskIds,
        success_count: successCount,
        failed_count: failedCount,
        partial_refund: {
          refund_amount: refundAmount,
          refund_at: new Date().toISOString(),
        },
      },
    });
  }

  return {
    generationId: imageGeneration.id,
    status,
    imageCount,
    expandedPrompts,
    tasks: results,
    creditsUsed: status === "failed" ? 0 : singleImageCredits * successCount,
    creditDeduction: deductResult,
  };
}

/**
 * 退还全部积分
 */
async function refundCredits(
  userUuid: string,
  deductResult: any
): Promise<void> {
  try {
    for (const pool of deductResult.pools) {
      await increaseCredits({
        user_uuid: userUuid,
        trans_type: CreditsTransType.RefundImageGenerationFailed,
        credits: pool.deducted,
        order_no: pool.order_no,
        expired_at: pool.expired_at,
      });

      console.log(
        `[AgentImageService] Credits refunded: ${pool.deducted} to pool ${pool.order_no}`
      );
    }

    console.log(
      `[AgentImageService] Total refunded: ${deductResult.totalDeducted} credits`
    );
  } catch (error) {
    console.error("[AgentImageService] Failed to refund credits:", error);
  }
}

/**
 * 退还部分积分（按比例）
 */
async function refundPartialCredits(
  userUuid: string,
  deductResult: any,
  refundAmount: number,
  singleImageCredits: number
): Promise<void> {
  try {
    let remainingRefund = refundAmount;

    // 从最后一个池开始退款（LIFO）
    const poolsReversed = [...deductResult.pools].reverse();

    for (const pool of poolsReversed) {
      if (remainingRefund <= 0) break;

      const refundFromPool = Math.min(pool.deducted, remainingRefund);

      await increaseCredits({
        user_uuid: userUuid,
        trans_type: CreditsTransType.RefundImageGenerationFailed,
        credits: refundFromPool,
        order_no: pool.order_no,
        expired_at: pool.expired_at,
      });

      console.log(
        `[AgentImageService] Partial refund: ${refundFromPool} to pool ${pool.order_no}`
      );

      remainingRefund -= refundFromPool;
    }

    console.log(
      `[AgentImageService] Total partial refund: ${refundAmount} credits`
    );
  } catch (error) {
    console.error(
      "[AgentImageService] Failed to refund partial credits:",
      error
    );
  }
}

/**
 * 处理 Agent 模式完成回调
 * 当单张图片生成完成时，聚合到主记录
 */
export async function handleAgentImageCallback(
  generationId: string,
  taskId: string,
  imageUrl: string,
  imageIndex: number
): Promise<{ allCompleted: boolean; completedCount: number }> {
  // 这个函数会在 ai-callback 路由中调用
  // 用于聚合多张图片的回调结果

  // 实现细节将在修改 ai-callback 路由时完成
  console.log(
    `[AgentImageService] Callback for generation ${generationId}, task ${taskId}, index ${imageIndex}`
  );

  return {
    allCompleted: false,
    completedCount: 0,
  };
}
