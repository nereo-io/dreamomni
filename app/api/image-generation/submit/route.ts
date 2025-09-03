import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import { getUserInfo } from "@/services/user";
import { aiServiceManager } from "@/services/AIServiceManager";
import { 
  createImageGeneration, 
  updateImageGenerationById 
} from "@/models/imageGeneration";
import {
  decreaseCredits,
  increaseCredits,
  CreditsTransType,
  getUserCredits,
} from "@/services/credit";
import type { CreateImageGenerationParams } from "@/types/image.d";
import type { AIServiceProvider } from "@/types/provider.d";
import { NextRequest } from "next/server";
import { getClientIp } from "@/lib/ip";

// 验证Cloudflare Turnstile CAPTCHA
async function verifyCaptcha(token: string, clientIP: string): Promise<boolean> {
  if (!process.env.TURNSTILE_SECRET_KEY) {
    console.warn("TURNSTILE_SECRET_KEY not configured, skipping CAPTCHA verification");
    return true; // 如果没配置密钥，跳过验证
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: clientIP,
      }),
    });

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('CAPTCHA verification error:', error);
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
      console.error("❌ User not found in database for UUID:", session.user.uuid);
      
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
          return respErr("Failed to sync user data. Please sign out and sign in again.");
        }
      } else {
        return respErr("User record not found and cannot be recreated. Please sign in again.");
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
      captchaToken,
    } = await req.json();

    // 验证必需参数
    if (!model || !prompt) {
      return respErr("model 和 prompt 参数是必需的");
    }

    // 验证图片转图片模式的参数
    if (mode === "image-to-image" && (!image_urls || image_urls.length === 0)) {
      return respErr("图片转图片模式需要提供 image_urls 参数");
    }

    // 4. CAPTCHA验证（新用户）
    if (userCredits.left_credits === 10 && captchaToken) {
      const clientIP = await getClientIp();
      const captchaValid = await verifyCaptcha(captchaToken, clientIP);
      
      if (!captchaValid) {
        return respErr("CAPTCHA验证失败，请重试");
      }
      
      console.log("✅ CAPTCHA验证通过");
    } else if (userCredits.left_credits === 10 && !captchaToken) {
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

    // Debug: 检查 API Key 状态
    if ('debugApiKey' in providerInstance && typeof providerInstance.debugApiKey === 'function') {
      const apiKeyDebug = (providerInstance as any).debugApiKey();
      console.log('🔑 API Key Debug Info:', apiKeyDebug);
      
      if (!apiKeyDebug.hasKey) {
        console.error('❌ API Key is missing or invalid');
        return respErr('API Key configuration error. Please check your environment variables.');
      }
    }

    // 计算积分消耗 - 图片生成固定2个积分
    const creditsRequired = 2;

    // 4. 检查积分是否充足
    if (userCredits.left_credits < creditsRequired) {
      return respErr(`Insufficient credits. Need ${creditsRequired} credits to generate image.`);
    }

    // 5. 扣除积分（在创建任务前扣除）
    try {
      await decreaseCredits({
        user_uuid: userInfo.uuid!,
        trans_type: CreditsTransType.ImageGeneration,
        credits: creditsRequired,
      });
      console.log(`💰 Credits deducted: ${creditsRequired} from user ${userInfo.uuid}`);
    } catch (error) {
      console.error("扣除积分失败:", error);
      return respErr("Failed to deduct credits, please try again later");
    }

    try {
      // 1. 创建数据库记录
      const createParams: CreateImageGenerationParams = {
        user_id: userInfo.uuid!,
        model_id: model,
        prompt,
        negative_prompt,
        mode: mode as any,
        source: "web",
        provider: selectedProvider,
        input_image_urls: image_urls,
        credits_used: creditsRequired,
        status: "PENDING",
        metadata: {
          request_source: "api",
          user_agent: req.headers.get("user-agent"),
          provider: selectedProvider,
        },
      };

      console.log("📝 Creating image generation record...");
      const imageGeneration = await createImageGeneration(createParams);
      console.log("✅ Created image generation record:", imageGeneration.id);

      // 2. 更新状态为 IN_PROGRESS
      console.log("🔄 Updating status to IN_PROGRESS...");
      await updateImageGenerationById(imageGeneration.id, {
        status: "IN_PROGRESS",
      });

      // 3. 调用AI服务提供商API
      console.log(`🤖 Calling ${selectedProvider} API...`);
      
      let result;
      if (mode === "image-to-image" && image_urls && image_urls.length > 0) {
        result = await aiServiceManager.editImage(selectedProvider, {
          prompt,
          imageUrls: image_urls,
          model,
          negativePrompt: negative_prompt,
        });
      } else {
        result = await aiServiceManager.generateImage(selectedProvider, {
          prompt,
          model,
          negativePrompt: negative_prompt,
          count: 1,
        });
      }

      console.log(`${selectedProvider} API response:`, result);

      // 4. 根据API返回结果更新数据库
      console.log(`📋 Processing API result: taskId=${result.taskId}, status=${result.status}`);

      if (result.taskId && result.status === "pending") {
        // 异步回调模式 - 更新任务ID，等待回调
        console.log(`📝 Storing taskId ${result.taskId} for async callback processing`);
        
        await updateImageGenerationById(imageGeneration.id, {
          status: "IN_QUEUE",
          provider_task_id: result.taskId,
          metadata: {
            ...createParams.metadata,
            provider_task_id: result.taskId,
            provider_status: result.status,
            provider_metadata: result.metadata,
          },
        });

        console.log(`✅ TaskId ${result.taskId} stored successfully for image generation ${imageGeneration.id}`);

        return respData({
          id: imageGeneration.id,
          task_id: result.taskId,
          status: "in_queue",
          provider: selectedProvider,
          message: "Image generation task submitted successfully",
        });
      } else if (result.status === "completed" && result.images && result.images.length > 0) {
        // 同步返回模式 - 直接更新结果
        console.log(`🖼️ Synchronous completion with ${result.images.length} images`);
        const imageUrls = result.images.map(img => img.url);
        
        await updateImageGenerationById(imageGeneration.id, {
          status: "COMPLETED",
          image_urls: imageUrls,
          image_count: imageUrls.length,
          provider_task_id: result.taskId,
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
        const errorMessage = result.error || "Unknown error occurred during generation";
        
        console.error(`❌ Generation failed for ${imageGeneration.id}:`, errorMessage);
        
        await updateImageGenerationById(imageGeneration.id, {
          status: "FAILED",
          error_message: errorMessage,
          provider_task_id: result.taskId,
          metadata: {
            ...createParams.metadata,
            provider_response: result,
          },
        });

        return respErr(errorMessage);
      }

    } catch (error) {
      console.error("❌ Image generation error:", error);
      
      // 生成失败，返还积分
      try {
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
        const expiredAt = oneMonthFromNow.toISOString();

        await increaseCredits({
          user_uuid: userInfo.uuid!,
          trans_type: CreditsTransType.RefundImageGenerationFailed,
          credits: creditsRequired,
          expired_at: expiredAt,
        });
        
        console.log(`💰 Credits refunded: ${creditsRequired} to user ${userInfo.uuid} due to generation failure`);
      } catch (refundError) {
        console.error("❌ Failed to refund credits:", refundError);
        // 不阻止错误返回，但记录退款失败
      }
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      return respErr(errorMessage);
    }

  } catch (error) {
    console.error("❌ Request processing error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return respErr(errorMessage);
  }
}

export async function GET() {
  return new Response("Method not allowed", { status: 405 });
}
