import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import { getUserInfo } from "@/services/user";
import { aiServiceManager } from "@/services/AIServiceManager";
import {
  createImageGeneration,
  updateImageGenerationById,
} from "@/models/imageGeneration";
import {
  decreaseCredits,
  increaseCredits,
  CreditsTransType,
  getUserCredits,
} from "@/services/credit";
import type {
  CreateImageGenerationParams,
  ImageGenerationStatus,
} from "@/types/image.d";
import type {
  GenerateImageRequest,
  EditImageRequest,
  ProviderResponse,
} from "@/services/providers/BaseAIProvider";
import type { AIServiceProvider } from "@/types/provider.d";
import { NextRequest } from "next/server";
import { getClientIp } from "@/lib/ip";
import { calculateImageCredits } from "@/config/image-models";
import { generateAgentImages } from "@/services/agentImageService";
import { isRetryableProviderError } from "@/services/fallback/falFallbackConfig";
import { submitFalImageFallback } from "@/services/fallback/falFallbackProviders";

// 降级处理结果类型
type FallbackResult = {
  success: boolean;
  result?: ProviderResponse;
  usedProvider?: AIServiceProvider;
  fallbackInfo?: {
    from_provider: AIServiceProvider;
    from_model: string;
    to_provider: AIServiceProvider;
    to_model: string;
    error: string;
    at: string;
  };
};

/**
 * 尝试降级到 fal.ai（异步队列模式）
 * 统一处理异常和失败状态的降级逻辑
 */
async function tryFallbackToFal(
  originalProvider: AIServiceProvider,
  model: string,
  request: GenerateImageRequest | EditImageRequest,
  isEditMode: boolean,
  errorOrResult: Error | ProviderResponse
): Promise<FallbackResult> {
  // 仅支持 nano_banana 降级到 fal
  if (originalProvider !== "nano_banana") {
    return { success: false };
  }

  // 提取错误信息
  const errorMessage =
    errorOrResult instanceof Error
      ? errorOrResult.message
      : (errorOrResult as ProviderResponse).error || "Unknown error";

  // 检查是否可以降级
  if (!isRetryableProviderError(errorMessage)) {
    return { success: false };
  }

  console.warn(
    `⚠️ ${originalProvider} failed, attempting fal.ai fallback for model ${model} (async queue mode)`
  );

  try {
    // webhook URL 已内聚到 fal fallback 逻辑中
    const fallbackResult = await submitFalImageFallback(
      model,
      request,
      isEditMode ? "edit" : "generate"
    );

    if (!fallbackResult) {
      console.warn("⚠️ Fallback to fal.ai not available for this model");
      return { success: false };
    }

    console.log(`✅ Fallback to fal.ai succeeded (request_id: ${fallbackResult.response.taskId})`);

    return {
      success: true,
      result: fallbackResult.response,
      usedProvider: "fal",
      fallbackInfo: {
        from_provider: originalProvider,
        from_model: model,
        to_provider: "fal",
        to_model: fallbackResult.modelId,
        error: errorMessage,
        at: new Date().toISOString(),
      },
    };
  } catch (fallbackError) {
    console.error("❌ Fallback to fal.ai failed:", fallbackError);
    return { success: false };
  }
}

/**
 * 调用图片生成 Provider（带降级处理）
 * 高内聚：封装调用、异常处理、降级逻辑
 */
async function callImageProviderWithFallback(
  provider: AIServiceProvider,
  model: string,
  generateRequest: GenerateImageRequest,
  editRequest: EditImageRequest | null,
  isEditMode: boolean
): Promise<{
  result: ProviderResponse;
  usedProvider: AIServiceProvider;
  fallbackInfo?: FallbackResult["fallbackInfo"];
}> {
  let result: ProviderResponse;
  let hasException = false;

  // 1. 调用 AI 服务提供商
  try {
    result = isEditMode
      ? await aiServiceManager.editImage(provider, editRequest!)
      : await aiServiceManager.generateImage(provider, generateRequest);
  } catch (providerError) {
    // 将异常转换为失败响应，后续统一处理
    hasException = true;
    result = {
      taskId: "",
      status: "failed",
      error:
        providerError instanceof Error
          ? providerError.message
          : String(providerError),
      metadata: { provider },
    };
  }

  // 2. 统一处理失败（异常 + 状态失败）
  if (result.status === "failed") {
    const fallback = await tryFallbackToFal(
      provider,
      model,
      isEditMode ? editRequest! : generateRequest,
      isEditMode,
      result
    );

    if (fallback.success && fallback.result) {
      // 降级成功（异步队列模式）
      return {
        result: fallback.result,
        usedProvider: fallback.usedProvider!,
        fallbackInfo: fallback.fallbackInfo,
      };
    } else if (hasException) {
      // 异常 + 降级失败 → 抛出错误
      throw new Error(result.error || "Provider failed");
    }
    // 状态失败 + 降级失败 → 返回失败结果（后续会记录失败、退款）
  }

  // 3. 返回成功或失败结果
  return {
    result,
    usedProvider: provider,
  };
}

// 验证Cloudflare Turnstile CAPTCHA
async function verifyCaptcha(
  token: string,
  clientIP: string
): Promise<boolean> {
  if (!process.env.TURNSTILE_SECRET_KEY) {
    console.warn(
      "TURNSTILE_SECRET_KEY not configured, skipping CAPTCHA verification"
    );
    return true; // 如果没配置密钥，跳过验证
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: clientIP,
        }),
      }
    );

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error("CAPTCHA verification error:", error);
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. 用户认证检查
    const session = await auth();
    if (!session?.user?.uuid) {
      return respErr("User not authenticated");
    }

    console.log("🔐 Session user UUID:", session.user.uuid);

    // 2. 获取用户信息并验证用户存在
    let userInfo = await getUserInfo();
    if (!userInfo?.uuid) {
      console.error(
        "❌ User not found in database for UUID:",
        session.user.uuid
      );

      // 尝试从 session 重新创建用户记录
      if (session.user?.email) {
        console.log("🔄 Attempting to recreate user record from session...");
        try {
          const { saveUser } = await import("@/services/user");
          const sessionUser = {
            uuid: session.user.uuid,
            email: session.user.email,
            nickname: session.user.name || session.user.email,
            avatar_url: session.user.image || "",
            signin_provider: "session_recovery",
          };
          const savedUser = await saveUser(sessionUser);
          userInfo = savedUser;
          console.log("✅ User record recreated successfully:", userInfo.uuid);
        } catch (error) {
          console.error("❌ Failed to recreate user record:", error);
          return respErr(
            "Failed to sync user data. Please sign out and sign in again."
          );
        }
      } else {
        return respErr(
          "User record not found and cannot be recreated. Please sign in again."
        );
      }
    }

    console.log("✅ User validated:", userInfo.uuid);

    // 3. 检查用户积分
    const userCredits = await getUserCredits(userInfo.uuid!);
    if (!userCredits) {
      return respErr("Failed to get user credits");
    }

    const {
      model,
      prompt,
      mode = "text-to-image",
      image_urls,
      source_image_ids, // 新增：来源图片ID数组（用于追踪"My Creations"选择）
      negative_prompt,
      provider,
      enable_prompt_enhancement = true,
      output_format,
      image_size,
      aspect_ratio, // Pro 模型参数
      resolution,   // Pro 模型参数
      image_input,  // Pro 模型图生图参数
      captchaToken,
      // Agent 模式参数
      agent_mode = false,
      agent_image_count = 6,
    } = await req.json();

    // 验证必需参数
    if (!model || !prompt) {
      return respErr("model 和 prompt 参数是必需的");
    }

    // 验证图片编辑模式的参数
    if (
      (mode === "image-to-image" || mode === "image-edit") &&
      (!image_urls || image_urls.length === 0)
    ) {
      return respErr("图片编辑模式需要提供 image_urls 参数");
    }

    // 4. CAPTCHA验证（新用户）
    if (process.env.TURNSTILE_SECRET_KEY && userCredits.left_credits <= 12 && captchaToken) {
      const clientIP = await getClientIp();
      const captchaValid = await verifyCaptcha(captchaToken, clientIP);

      if (!captchaValid) {
        return respErr("CAPTCHA验证失败，请重试");
      }

      console.log("✅ CAPTCHA验证通过");
    } else if (process.env.TURNSTILE_SECRET_KEY && userCredits.left_credits <= 12 && !captchaToken) {
      return respErr("新用户需要完成CAPTCHA验证");
    }

    // 确定使用的服务提供商 - 优先使用请求指定的provider，否则根据模型ID自动选择
    let selectedProvider: AIServiceProvider;
    if (provider) {
      selectedProvider = provider as AIServiceProvider;
    } else {
      // 根据模型ID自动选择正确的provider
      const providerByModel = aiServiceManager.getProviderByModelId(model);
      if (providerByModel) {
        selectedProvider = providerByModel;
      } else {
        // 如果模型没有配置对应的provider，回退到第一个可用的provider
        selectedProvider = aiServiceManager.getAvailableProviders()[0];
        if (!selectedProvider) {
          return respErr("No AI service providers available");
        }
      }
    }

    console.log(`🔄 Provider selection for model ${model}: ${selectedProvider}`);
    console.log(`🔍 Request params - aspect_ratio: ${aspect_ratio}, resolution: ${resolution}, image_size: ${image_size}`);

    // 验证提供商是否可用
    const providerInstance = aiServiceManager.getProvider(selectedProvider);
    if (!providerInstance) {
      return respErr(`Service provider ${selectedProvider} is not available`);
    }

    // ============ Agent 模式处理 ============
    if (agent_mode) {
      console.log(`🤖 Agent mode enabled, generating ${agent_image_count} images...`);

      // 验证 Agent 模式参数
      if (![6, 9, 12].includes(agent_image_count)) {
        return respErr("Agent mode requires 6, 9, or 12 images");
      }

      // 计算 Agent 模式积分消耗
      const singleImageCredits = calculateImageCredits(model, resolution);
      const totalAgentCredits = singleImageCredits * agent_image_count;

      console.log(`💰 Agent mode credits: ${singleImageCredits} × ${agent_image_count} = ${totalAgentCredits}`);

      // 检查积分是否充足
      if (userCredits.left_credits < totalAgentCredits) {
        return respErr(
          `Insufficient credits. Need ${totalAgentCredits} credits for Agent mode (${agent_image_count} images).`
        );
      }

      try {
        // 调用 Agent 图片生成服务
        const agentResult = await generateAgentImages({
          userId: userInfo.uuid!,
          userUuid: userInfo.uuid!,
          prompt,
          imageCount: agent_image_count as 6 | 9 | 12,
          model,
          aspectRatio: aspect_ratio,
          resolution,
          imageInput: image_urls || image_input,
          provider: selectedProvider,
          outputFormat: output_format,
          imageSize: image_size,
          metadata: {
            request_source: "api",
            user_agent: req.headers.get("user-agent"),
            enable_prompt_enhancement,
          },
        });

        console.log(`✅ Agent mode generation started: ${agentResult.generationId}`);

        return respData({
          id: agentResult.generationId,
          status: agentResult.status,
          image_count: agentResult.imageCount,
          agent_image_count: agentResult.imageCount,  // Agent 模式图片数量
          expanded_prompts: agentResult.expandedPrompts,
          tasks: agentResult.tasks.map((t) => ({
            index: t.index,
            success: t.success,
            task_id: t.taskId,
            error: t.error,
          })),
          credits_used: agentResult.creditsUsed,
          provider: selectedProvider,
          is_agent_mode: true,
          image_urls: [],      // 初始为空数组
          image_urls_r2: [],   // 初始为空数组
          message: `Agent mode: ${agentResult.tasks.filter((t) => t.success).length}/${agent_image_count} tasks submitted`,
        });
      } catch (error) {
        console.error("❌ Agent mode generation error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Agent mode generation failed";
        return respErr(errorMessage);
      }
    }
    // ============ Agent 模式处理结束 ============

    // 计算积分消耗 - 根据模型和分辨率计算（Pro 模型根据分辨率差异化计费）
    const creditsRequired = calculateImageCredits(model, resolution);
    if (creditsRequired === 0) {
      return respErr(`Invalid or unsupported model: ${model}`);
    }

    console.log(`💰 Credits required for model ${model} (resolution: ${resolution || 'default'}): ${creditsRequired}`);

    // 4. 检查积分是否充足
    if (userCredits.left_credits < creditsRequired) {
      return respErr(
        `Insufficient credits. Need ${creditsRequired} credits to generate image.`
      );
    }

    // 5. 扣除积分（在创建任务前扣除）
    let deductResult;
    try {
      deductResult = await decreaseCredits({
        user_uuid: userInfo.uuid!,
        trans_type: CreditsTransType.ImageGeneration,
        credits: creditsRequired,
      });
      console.log(
        `💰 Credits deducted: ${deductResult.totalDeducted} from ${deductResult.pools.length} pool(s) for user ${userInfo.uuid}`
      );
    } catch (error) {
      console.error("扣除积分失败:", error);
      return respErr("Failed to deduct credits, please try again later");
    }

    try {
      // 1. 优化提示词（如果启用）
      let enhancedPrompt = prompt;

      // 2. 判断是否为编辑模式
      const isEditMode =
        (mode === "image-to-image" || mode === "image-edit") &&
        image_urls &&
        image_urls.length > 0;

      // 3. 先创建数据库记录（在 API 调用之前）
      const createParams: CreateImageGenerationParams = {
        user_id: userInfo.uuid!,
        model_id: model,
        prompt: prompt,
        optimized_prompt: enable_prompt_enhancement ? enhancedPrompt : undefined,
        negative_prompt,
        mode: mode as any,
        source: "web",
        provider: selectedProvider,
        input_image_urls: image_urls,
        source_image_ids: source_image_ids,
        aspect_ratio: aspect_ratio || image_size,
        credits_used: creditsRequired,
        status: "IN_PROGRESS",
        provider_task_id: undefined,
        metadata: {
          request_source: "api",
          user_agent: req.headers.get("user-agent"),
          provider: selectedProvider,
          enable_prompt_enhancement,
          image_size,
          output_format,
          aspect_ratio,
          resolution,
          credit_deduction: {
            pools: deductResult.pools,
            total_deducted: deductResult.totalDeducted,
            deducted_at: new Date().toISOString(),
          },
        },
      };

      console.log("📝 Creating record BEFORE API call");
      const imageGeneration = await createImageGeneration(createParams);
      console.log(`✅ Pre-created record ${imageGeneration.id}`);

      // 4. 准备 Provider 请求参数（包含 generationId 和 isAgentMode）
      console.log(`🤖 Calling ${selectedProvider} API...`);

      const generateRequest: GenerateImageRequest = {
        prompt: enhancedPrompt,
        model,
        negativePrompt: negative_prompt,
        count: 1,
        output_format,
        image_size,
        aspect_ratio,
        resolution,
        image_input,
        generationId: imageGeneration.id,
        isAgentMode: false,
      };

      const editRequest: EditImageRequest | null = isEditMode
        ? {
            prompt: enhancedPrompt,
            imageUrls: image_urls!,
            model,
            negativePrompt: negative_prompt,
            output_format,
            image_size,
            aspect_ratio,
            resolution,
            generationId: imageGeneration.id,
            isAgentMode: false,
          }
        : null;

      // 5. 调用图片生成服务（包含降级处理）
      const { result, usedProvider, fallbackInfo } =
        await callImageProviderWithFallback(
          selectedProvider,
          model,
          generateRequest,
          editRequest,
          isEditMode
        );

      console.log(`${usedProvider} API response:`, result);

      // 5. 更新 provider 和 provider_task_id
      await updateImageGenerationById(imageGeneration.id, {
        provider: usedProvider,
        provider_task_id: result.taskId,
        metadata: {
          ...createParams.metadata,
          provider: usedProvider,
          provider_task_id: result.taskId,
          ...(fallbackInfo && { fallback: fallbackInfo }),
        },
      });

      // 6. 根据 API 返回结果处理不同情况
      console.log(
        `📋 Processing API result: taskId=${result.taskId}, status=${result.status}`
      );

      if (result.taskId && result.status === "pending") {
        // 异步回调模式 - 更新状态为 IN_QUEUE，等待回调
        await updateImageGenerationById(imageGeneration.id, {
          status: "IN_QUEUE",
        });

        return respData({
          id: imageGeneration.id,
          task_id: result.taskId,
          status: "in_queue",
          provider: usedProvider,
          message: "Image generation task submitted successfully",
        });
      } else if (
        result.status === "completed" &&
        result.images &&
        result.images.length > 0
      ) {
        // 同步完成模式（Seedream）
        const imageUrls = result.images.map((img) => img.url);

        await updateImageGenerationById(imageGeneration.id, {
          status: "COMPLETED",
          image_urls: imageUrls,
          image_count: imageUrls.length,
          completed_at: new Date().toISOString(),
        });

        return respData({
          id: imageGeneration.id,
          status: "completed",
          image_url: imageUrls[0],
          image_urls: imageUrls,
          provider: usedProvider,
          message: "Image generated successfully",
        });
      } else {
        // 错误处理
        const errorMessage =
          result.error || "Unknown error occurred during generation";

        console.error(
          `❌ Generation failed for ${imageGeneration.id}:`,
          errorMessage
        );

        await updateImageGenerationById(imageGeneration.id, {
          status: "FAILED",
          error_message: errorMessage,
          metadata: {
            ...createParams.metadata,
            provider: usedProvider,
            provider_response: result,
          },
        });

        // 生成失败，返还积分到原池
        try {
          for (const pool of deductResult.pools) {
            await increaseCredits({
              user_uuid: userInfo.uuid!,
              trans_type: CreditsTransType.RefundImageGenerationFailed,
              credits: pool.deducted,
              order_no: pool.order_no,
              expired_at: pool.expired_at,
            });

            console.log(
              `💰 Credits refunded: ${pool.deducted} to pool ${pool.order_no} for user ${userInfo.uuid} due to provider error`
            );
          }

          console.log(
            `💰 Total refunded: ${deductResult.totalDeducted} credits across ${deductResult.pools.length} pool(s)`
          );
        } catch (refundError) {
          console.error("❌ Failed to refund credits:", refundError);
        }

        return respErr(errorMessage);
      }
    } catch (error) {
      console.error("❌ Image generation error:", error);

      // 生成失败，返还积分到原池
      try {
        for (const pool of deductResult.pools) {
          await increaseCredits({
            user_uuid: userInfo.uuid!,
            trans_type: CreditsTransType.RefundImageGenerationFailed,
            credits: pool.deducted,
            order_no: pool.order_no,
            expired_at: pool.expired_at,
          });

          console.log(
            `💰 Credits refunded: ${pool.deducted} to pool ${pool.order_no} for user ${userInfo.uuid} due to generation failure`
          );
        }

        console.log(
          `💰 Total refunded: ${deductResult.totalDeducted} credits across ${deductResult.pools.length} pool(s)`
        );
      } catch (refundError) {
        console.error("❌ Failed to refund credits:", refundError);
      }

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      return respErr(errorMessage);
    }
  } catch (error) {
    console.error("❌ Request processing error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return respErr(errorMessage);
  }
}

export async function GET() {
  return new Response("Method not allowed", { status: 405 });
}
