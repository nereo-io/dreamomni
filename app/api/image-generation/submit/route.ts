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
import type { AIServiceProvider } from "@/types/provider.d";
import { NextRequest } from "next/server";
import { getClientIp } from "@/lib/ip";
import { calculateImageCredits } from "@/config/image-models";
import { generateAgentImages } from "@/services/agentImageService";

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
    if (userCredits.left_credits <= 12 && captchaToken) {
      const clientIP = await getClientIp();
      const captchaValid = await verifyCaptcha(captchaToken, clientIP);

      if (!captchaValid) {
        return respErr("CAPTCHA验证失败，请重试");
      }

      console.log("✅ CAPTCHA验证通过");
    } else if (userCredits.left_credits <= 12 && !captchaToken) {
      return respErr("新用户需要完成CAPTCHA验证");
    }

    // 确定使用的服务提供商
    let selectedProvider: AIServiceProvider;
    if (provider) {
      selectedProvider = provider as AIServiceProvider;
    } else {
      selectedProvider = aiServiceManager.getAvailableProviders()[0];
      if (!selectedProvider) {
        return respErr("No AI service providers available");
      }
    }

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
      // 1. 优化提示词（如果启用） - 在调用AI服务之前处理
      let enhancedPrompt = prompt;

      // 2. 调用AI服务提供商API
      console.log(`🤖 Calling ${selectedProvider} API...`);

      let result;
      if (
        (mode === "image-to-image" || mode === "image-edit") &&
        image_urls &&
        image_urls.length > 0
      ) {
        result = await aiServiceManager.editImage(selectedProvider, {
          prompt: enhancedPrompt,
          imageUrls: image_urls,
          model,
          negativePrompt: negative_prompt,
          output_format,
          image_size,
          // Pro 模型参数
          aspect_ratio,
          resolution,
        });
      } else {
        result = await aiServiceManager.generateImage(selectedProvider, {
          prompt: enhancedPrompt,
          model,
          negativePrompt: negative_prompt,
          count: 1,
          output_format,
          image_size,
          // Pro 模型参数
          aspect_ratio,
          resolution,
          image_input,
        });
      }

      console.log(`${selectedProvider} API response:`, result);

      // 3. 根据API调用结果确定初始状态
      let initialStatus: ImageGenerationStatus;
      if (result.taskId && result.status === "pending") {
        initialStatus = "IN_QUEUE";
      } else if (result.status === "completed") {
        initialStatus = "COMPLETED";
      } else if (result.error) {
        initialStatus = "FAILED";
      } else {
        initialStatus = "IN_PROGRESS";
      }

      // 4. 创建数据库记录 - 在AI服务调用之后
      const createParams: CreateImageGenerationParams = {
        user_id: userInfo.uuid!,
        model_id: model,
        prompt: prompt, // 存储原始用户输入
        optimized_prompt: enable_prompt_enhancement
          ? enhancedPrompt
          : undefined,
        negative_prompt,
        mode: mode as any,
        source: "web",
        provider: selectedProvider,
        input_image_urls: image_urls,
        // 图片比例：Pro 模型用 aspect_ratio，标准模型用 image_size
        aspect_ratio: aspect_ratio || image_size,
        credits_used: creditsRequired,
        status: initialStatus,
        provider_task_id: result.taskId,
        metadata: {
          request_source: "api",
          user_agent: req.headers.get("user-agent"),
          provider: selectedProvider,
          enable_prompt_enhancement,
          provider_task_id: result.taskId,
          provider_status: result.status,
          provider_metadata: result.metadata,
          // 将图片尺寸存储到元数据中
          image_size: image_size,
          output_format: output_format,
          // Pro 模型参数
          aspect_ratio: aspect_ratio,
          resolution: resolution,
          // 保存扣费池信息，用于退款追溯
          credit_deduction: {
            pools: deductResult.pools,
            total_deducted: deductResult.totalDeducted,
            deducted_at: new Date().toISOString(),
          },
        },
      };

      console.log(
        "📝 Creating image generation record with initial status:",
        initialStatus
      );
      const imageGeneration = await createImageGeneration(createParams);
      console.log("✅ Created image generation record:", imageGeneration.id);

      // 5. 根据API返回结果处理不同情况
      console.log(
        `📋 Processing API result: taskId=${result.taskId}, status=${result.status}`
      );

      if (result.taskId && result.status === "pending") {
        // 异步回调模式 - 任务已提交，等待回调
        console.log(
          `📝 TaskId ${result.taskId} stored for async callback processing`
        );

        return respData({
          id: imageGeneration.id,
          task_id: result.taskId,
          status: "in_queue",
          provider: selectedProvider,
          message: "Image generation task submitted successfully",
        });
      } else if (
        result.status === "completed" &&
        result.images &&
        result.images.length > 0
      ) {
        // 同步返回模式 - 直接更新结果
        console.log(
          `🖼️ Synchronous completion with ${result.images.length} images`
        );
        const imageUrls = result.images.map((img) => img.url);

        await updateImageGenerationById(imageGeneration.id, {
          status: "COMPLETED",
          image_urls: imageUrls,
          image_count: imageUrls.length,
          completed_at: new Date().toISOString(),
          metadata: {
            ...createParams.metadata,
            provider_response: result.metadata,
            provider_images: result.images,
          },
        });

        return respData({
          id: imageGeneration.id,
          status: "completed",
          image_url: imageUrls[0],
          image_urls: imageUrls,
          provider: selectedProvider,
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
            provider_response: result,
          },
        });

        // 生成失败，返还积分到原池
        try {
          // 遍历所有扣费的池，按原扣费金额逐一退款
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
          // 不阻止错误返回，但记录退款失败
        }

        return respErr(errorMessage);
      }
    } catch (error) {
      console.error("❌ Image generation error:", error);

      // 生成失败，返还积分到原池
      try {
        // 遍历所有扣费的池，按原扣费金额逐一退款
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
        // 不阻止错误返回，但记录退款失败
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
