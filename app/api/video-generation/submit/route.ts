import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import { getUserInfo } from "@/services/user";
import { getClientIp, isIPBlocked } from "@/lib/ip";
import { createVideoGeneration } from "@/models/videoGeneration";
import {
  decreaseCredits,
  CreditsTransType,
  CreditsAmount,
  getUserCredits,
} from "@/services/credit";
import {
  VIDEO_MODELS,
  getVideoModel,
  getSupportedModelIds,
  isImageToVideoModel,
  isKlingModel,
  isVeo2Model,
  isVeo3Model,
  isVeo3ApicoreModel,
  isKieAiModel,
  isSeedanceModel,
  isVeoModel,
  isVolcanoModel,
  isBytePlusModel,
  isAliModel,
  isMinimaxModel,
  isSora2Model,
  isKieAiVeo3Model,
  useSignedVideoCallback,
  isStoryboardModel,
  calculateCredits,
  VideoModelProvider,
  modelSupportsAudio,
} from "@/config/video-models";
import { ProviderFactory } from "@/services/providers";
import { optimizeVideoPromptWithTimeout } from "@/services/promptOptimization";
import { tryVolcanoSubmit } from "@/services/seedanceFallbackService";
import { VideoSubmitService } from "@/services/videoSubmitService";
import { getEffectConfigById } from "@/models/effectConfig";
import { buildSignedVideoCallbackUrl } from "@/services/videoCallbackSignature";

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

export async function POST(req: Request) {
  try {
    // 1. 用户认证检查
    const session = await auth();
    if (!session?.user?.uuid) {
      return respErr("User not authenticated");
    }

    // 2. 获取用户信息
    const userInfo = await getUserInfo();
    if (!userInfo?.uuid) {
      return respErr("Failed to get user information");
    }

    // 检查用户是否被禁用
    if (userInfo.is_banned) {
      return respErr("Account has been suspended due to suspicious activity");
    }

    // 检查IP是否在黑名单中
    const clientIP = await getClientIp();
    const isBlocked = await isIPBlocked(clientIP);
    if (isBlocked) {
      console.warn(`Video generation blocked for IP: ${clientIP}`);
      return respErr("Video generation not available from this network");
    }

    // 3. 检查用户积分
    const userCredits = await getUserCredits(userInfo.uuid);
    if (!userCredits) {
      return respErr("Failed to get user credits");
    }

    const {
      model,
      prompt,
      image_url, // 保留用于向后兼容
      image_urls, // 新增：支持1-2张图片数组（首帧、尾帧）
      source_image_ids, // 新增：来源图片ID数组（用于追踪"My Creations"选择）
      negative_prompt,
      aspect_ratio = "16:9",
      duration = "5",
      cfg_scale,
      resolution = "1080p",
      num_frames,
      frames_per_second = 16,
      seed,
      enable_safety_checker = true,
      generate_audio = false, // 新增：音频生成选项
      enable_prompt_enhancement = false, // 新增：prompt增强开关（默认关闭）
      effect_id, // 新增：特效ID
      captchaToken, // 新增：CAPTCHA token
      generationType, // 新增：视频生成类型（如 REFERENCE_2_VIDEO）
      ...otherParams
    } = await req.json();

    const { watermarkEnabled = false, ...additionalParams } =
      otherParams || {};

    // 验证必需参数
    if (!model || !prompt) {
      return respErr("model 和 prompt 参数是必需的");
    }

    // 4. 基于积分的CAPTCHA验证（与前端逻辑一致）
    if (userCredits.left_credits <= 12) {
      // 新用户（积分<=12）需要CAPTCHA验证，防止薅羊毛
      if (!captchaToken) {
        return respErr("CAPTCHA verification is required for new users");
      }

      const captchaValid = await verifyCaptcha(captchaToken, clientIP);
      if (!captchaValid) {
        console.warn(
          `CAPTCHA verification failed for new user: ${userInfo.uuid}, IP: ${clientIP}, credits: ${userCredits.left_credits}`
        );
        return respErr("CAPTCHA verification failed. Please try again.");
      }

      console.log(
        `CAPTCHA verification passed for new user: ${userInfo.uuid}, credits: ${userCredits.left_credits}`
      );
    }

    // 处理特效配置
    let finalPrompt = prompt;
    let finalModel = model;
    let effectCreditsOverride: number | null = null;

    if (effect_id) {
      const effectConfig = await getEffectConfigById(effect_id);

      if (effectConfig) {
        // 应用prompt模板
        if (effectConfig.prompt_template) {
          finalPrompt = effectConfig.prompt_template.replace(
            "{{USER_PROMPT}}",
            prompt
          );
        }

        // 使用默认模型 minimax-hailuo02-image-to-video 用于特效
        if (effectConfig) {
          finalModel = "minimax-hailuo02-image-to-video";
        }

        // 使用特效积分
        if (effectConfig.credits_required) {
          effectCreditsOverride = effectConfig.credits_required;
        }
      }
    }

    // 验证模型是否支持
    const modelConfig = getVideoModel(finalModel);
    if (!modelConfig) {
      return respErr(
        `不支持的模型: ${finalModel}。支持的模型: ${getSupportedModelIds().join(
          ", "
        )}`
      );
    }

    const baseWebUrl = process.env.NEXT_PUBLIC_WEB_URL;
    if (!baseWebUrl) {
      return respErr("NEXT_PUBLIC_WEB_URL is not configured");
    }
    if (
      useSignedVideoCallback(finalModel) &&
      !process.env.VIDEO_CALLBACK_SIGNING_SECRET?.trim()
    ) {
      return respErr("VIDEO_CALLBACK_SIGNING_SECRET is not configured");
    }

    // 自动设置 generationType（如果未提供但模型配置中有）
    let finalGenerationType = generationType;
    if (!finalGenerationType && modelConfig?.generationType) {
      finalGenerationType = modelConfig.generationType;
    }

    const durationInt = parseInt(duration);

    // 5. 计算所需积分并检查余额
    const requiredCredits =
      effectCreditsOverride ||
      calculateCredits(finalModel, durationInt, generate_audio, resolution);

    if (requiredCredits === 0) {
      return respErr(
        "Unable to calculate required credits, please check model configuration"
      );
    }

    if (userCredits.left_credits < requiredCredits) {
      return respErr(
        `积分不足，需要 ${requiredCredits} 积分，当前剩余 ${userCredits.left_credits} 积分`
      );
    }

    // 确定积分交易类型并验证时长
    let transType: CreditsTransType;

    // 根据时长确定交易类型（所有模型通用）
    if (durationInt === 4) {
      transType = CreditsTransType.VideoGeneration4s;
    } else if (durationInt === 5) {
      transType = CreditsTransType.VideoGeneration5s;
    } else if (durationInt === 6) {
      // MiniMax 模型的6秒使用5秒类型（积分计算已经按实际秒数计算）
      transType = CreditsTransType.VideoGeneration6s;
    } else if (durationInt === 8) {
      // VEO模型的8秒使用8秒类型
      transType = CreditsTransType.VideoGeneration8s;
    } else if (durationInt === 10) {
      transType = CreditsTransType.VideoGeneration10s;
    } else if (durationInt === 12) {
      transType = CreditsTransType.VideoGeneration12s;
    } else if (durationInt === 15) {
      // Sora 2/Pro 模型的15秒
      transType = CreditsTransType.VideoGeneration15s;
    } else if (durationInt === 25) {
      // Storyboard 模型的25秒
      transType = CreditsTransType.VideoGeneration25s;
    } else {
      return respErr(`不支持的时长: ${durationInt}秒`);
    }

    // 6. 扣除积分（在创建任务前扣除）
    let deductResult;
    try {
      deductResult = await decreaseCredits({
        user_uuid: userInfo.uuid,
        trans_type: transType,
        credits: requiredCredits,
      });
      console.log(
        `💰 Credits deducted: ${deductResult.totalDeducted} from ${deductResult.pools.length} pool(s) for user ${userInfo.uuid}`
      );
    } catch (error) {
      console.error("扣除积分失败:", error);
      return respErr("Failed to deduct credits, please try again later");
    }

    // 兼容性处理：统一转换为数组
    let finalImageUrls: string[] | undefined;
    if (image_urls && Array.isArray(image_urls) && image_urls.length > 0) {
      finalImageUrls = image_urls;
    } else if (image_url) {
      finalImageUrls = [image_url];
    }

    // 7. 在数据库中创建记录（根据是否启用prompt增强设置初始状态）
    const videoGeneration = await createVideoGeneration({
      user_id: userInfo.uuid,
      model_id: finalModel,
      prompt: effect_id ? prompt : finalPrompt, // 如果有特效，保存原始prompt
      input_image_url: image_url, // 保留用于向后兼容
      image_urls: finalImageUrls, // 新增：支持1-2张图片数组
      source_image_ids: source_image_ids, // 新增：保存来源图片ID（用于追踪"My Creations"选择）
      negative_prompt,
      aspect_ratio,
      duration_seconds: durationInt,
      cfg_scale,
      seed,
      has_audio: modelSupportsAudio(finalModel) && generate_audio,
      status: enable_prompt_enhancement ? "PROMPT_OPTIMIZING" : "IN_QUEUE",
      metadata: {
        // 保存积分扣费池信息，用于退款追溯
        credit_deduction: {
          pools: deductResult.pools,
          total_deducted: deductResult.totalDeducted,
          deducted_at: new Date().toISOString(),
        },
        // 保存用户请求的分辨率，用于4K升级判断
        requested_resolution: resolution,
      },
      effect_id: effect_id,
      model_name: modelConfig.modelName,
    });

    // 7.5. 优化提示词
    let enhancedPrompt = finalPrompt;
    if (enable_prompt_enhancement) {
      try {
        const optimizedPrompt = await optimizeVideoPromptWithTimeout(
          finalPrompt,
          finalModel,
          30000,
          image_url // 传递图片URL（如果有）
        );
        enhancedPrompt = optimizedPrompt;

        // 更新记录保存优化后的提示词
        await import("@/models/videoGeneration").then(
          ({ updateVideoGenerationById }) =>
            updateVideoGenerationById(videoGeneration.id, {
              optimized_prompt: optimizedPrompt,
            })
        );
      } catch (error) {
        console.error("提示词优化失败，使用原始提示词:", error);
        // 如果优化失败，继续使用原始提示词
      }
    }

    if (watermarkEnabled && isSeedanceModel(finalModel)) {
      const trimmed = enhancedPrompt.trim();
      if (!/--wm\s+true\b/i.test(trimmed)) {
        enhancedPrompt = `${trimmed} --wm true`.trim();
      }
    }

    // 构建请求输入（使用优化后的提示词）
    const input: any = {
      model: finalModel,
      prompt: enhancedPrompt,
    };

    // 通用参数
    if (aspect_ratio) {
      input.aspect_ratio = aspect_ratio;
    }

    if (seed) {
      input.seed = seed;
    }

    if (duration) {
      input.duration = duration;
    }

    if (resolution) {
      input.resolution = resolution;
    }

    // Storyboard 参数验证
    if (isStoryboardModel(finalModel)) {
      if (!finalImageUrls || finalImageUrls.length < 2 || finalImageUrls.length > 8) {
        return respErr(
          `Storyboard requires 2-8 images, but got ${finalImageUrls?.length || 0}`
        );
      }
      input.image_urls = finalImageUrls;
    }

    // 根据模型类型添加相应参数
    if (isImageToVideoModel(finalModel)) {
      if (!finalImageUrls || finalImageUrls.length === 0) {
        return respErr("Image-to-video models require at least one image");
      }

      // 验证 REFERENCE_2_VIDEO 特殊要求
      if (finalGenerationType === "REFERENCE_2_VIDEO") {
        const minImages = modelConfig?.imageCapabilities?.minImages || 1;
        const maxImages = modelConfig?.imageCapabilities?.maxImages || 3;

        if (finalImageUrls.length < minImages || finalImageUrls.length > maxImages) {
          return respErr(
            `REFERENCE_2_VIDEO requires ${minImages}-${maxImages} reference images, but got ${finalImageUrls.length}`
          );
        }
      }

      // 支持双图：优先使用 image_urls，向后兼容 image_url
      input.image_urls = finalImageUrls;
      // 向后兼容：同时设置 image_url（第一张图）
      input.image_url = finalImageUrls[0];
    }

    // 按模型提供商分类处理参数
    if (isKlingModel(finalModel)) {
      // Kling 模型特有参数
      if (duration) {
        input.duration = duration;
      }
      if (generate_audio !== undefined && modelConfig.supportsAudio) {
        input.generate_audio = generate_audio;
      }
      if (negative_prompt) {
        input.negative_prompt = negative_prompt;
      }
      if (cfg_scale !== undefined) {
        input.cfg_scale = cfg_scale;
      }
    } else if (isMinimaxModel(finalModel)) {
      // MiniMax 支持 prompt_optimizer（根据用户选择）
      input.prompt_optimizer = enable_prompt_enhancement;

      // 图片转视频模型支持分辨率选择
      if (finalModel === "minimax-hailuo02-image-to-video") {
        // MiniMax 仅支持 512P 和 768P（大写）
        if (resolution === "512p") {
          input.resolution = "512P";
        } else if (resolution === "768p") {
          input.resolution = "768P";
        } else {
          input.resolution = "768P"; // 默认使用 768P
        }
      }
      // Text-to-video 不需要设置 resolution，使用默认768p
    } else if (isVeo3ApicoreModel(finalModel)) {
      // Veo3 APICore 模型特有参数
      if (generate_audio !== undefined) {
        input.generate_audio = generate_audio;
      }
      // Veo3 APICore 支持图片输入，如果有图片则添加到输入中
      if (finalImageUrls && finalImageUrls.length > 0) {
        input.image_urls = finalImageUrls;
        input.image_url = finalImageUrls[0]; // 向后兼容
      }
    } else if (isVolcanoModel(finalModel)) {
      // Volcano 模型特有参数 (使用volcanoModel配置)
      if (modelConfig.volcanoModel) {
        input.model = modelConfig.volcanoModel;
      }
    } else if (isBytePlusModel(finalModel)) {
      // BytePlus 模型特有参数 (使用volcanoModel配置)
      if (modelConfig.volcanoModel) {
        input.model = modelConfig.volcanoModel;
      }

      if (generate_audio !== undefined && modelConfig.supportsAudio) {
        input.generate_audio = generate_audio;
      }
    } else if (isKieAiModel(finalModel)) {
      // Kie.ai 模型特有参数（支持双图）
      if (finalImageUrls && finalImageUrls.length > 0) {
        input.image_urls = finalImageUrls;
        input.image_url = finalImageUrls[0]; // 向后兼容
      }
      // Kie.ai 支持水印 - 传递前端的 watermarkEnabled 标记
      if (watermarkEnabled) {
        input.watermarkEnabled = true;
      }
      // Kie.ai 支持 generationType（如 REFERENCE_2_VIDEO）
      if (finalGenerationType) {
        input.generationType = finalGenerationType;
      }
      // Kie.ai Sora 模型不接受 resolution 参数
      if (isSora2Model(finalModel)) {
        delete input.resolution;
      }
    } else if (isAliModel(finalModel)) {
      // 阿里百炼模型特有参数
      if (finalImageUrls && finalImageUrls.length > 0) {
        input.image_urls = finalImageUrls;
        input.image_url = finalImageUrls[0]; // 向后兼容
      }
      // 阿里百炼使用 resolution 参数
      input.resolution = resolution;
    } else if (modelConfig.provider === VideoModelProvider.EVOLINK) {
      // 使用 providerModelId 覆盖 API 模型名
      if (modelConfig.providerModelId) {
        input.model = modelConfig.providerModelId;
      }
      // Evolink Sora 模型不接受 resolution 参数（固定 1080p）
      delete input.resolution;
    }

    try {
      // 8. 提交任务到队列，包含webhook URL
      const webhookUrl = useSignedVideoCallback(finalModel)
        ? buildSignedVideoCallbackUrl({
            baseUrl: baseWebUrl,
            provider: modelConfig.provider,
            videoId: videoGeneration.id,
          })
        : `${baseWebUrl}/api/video-generation/webhook`;
      // const webhookUrl = `https://d76d2707b239.ngrok-free.app/api/video-generation/webhook`;

      let submitResponse;
      let actualProvider: string | undefined; // 记录实际使用的 provider
      let usedModelName: string | undefined; // 降级时记录实际使用的 model_name

      // === Volcano 降级尝试（临时方案：优先使用便宜的 Volcano，失败后降级到 BytePlus）===
      const volcanoResponse = await tryVolcanoSubmit(finalModel, input, webhookUrl);
      if (volcanoResponse) {
        submitResponse = volcanoResponse;
        actualProvider = "volcano"; // 标记使用了 Volcano
        usedModelName = modelConfig.modelName; // AI 模型不变，显式记录
      }

      // 如果 Volcano 没有成功（未启用/不适用/失败），使用 VideoSubmitService（支持降级）
      let fallbackModelId: string | undefined; // 降级使用的模型配置 ID
      if (!submitResponse) {
        const submitResult = await VideoSubmitService.submit(
          finalModel,
          modelConfig,
          input,
          webhookUrl
        );
        submitResponse = submitResult.response;

        // 如果使用了降级模型，记录实际 provider、model_name 和降级模型 ID
        if (submitResult.usedModelId !== finalModel) {
          actualProvider = submitResult.usedModelConfig.provider;
          usedModelName = submitResult.usedModelConfig.modelName;
          fallbackModelId = submitResult.usedModelId;
        }
      }

      // 9. 更新数据库记录的请求ID
      const updateParams: any = {};

      // 根据提供商类型设置相应的专用字段
      if (modelConfig.provider === VideoModelProvider.VOLCANO) {
        updateParams.volcano_request_id = submitResponse.request_id;
      } else if (modelConfig.provider === VideoModelProvider.FAL) {
        updateParams.fal_request_id = submitResponse.request_id;
      } else if (
        modelConfig.provider === VideoModelProvider.APICORE ||
        (modelConfig.provider === VideoModelProvider.KIEAI &&
          isKieAiVeo3Model(finalModel))
      ) {
        // APICore and KieAI Veo3 models use the same veo3_request_id field
        updateParams.veo3_request_id = submitResponse.request_id;
      } else if (
        modelConfig.provider === VideoModelProvider.KIEAI &&
        isSora2Model(finalModel)
      ) {
        // Sora 2 使用专用的 sora_request_id 字段
        updateParams.sora_request_id = submitResponse.request_id;
      } else if (modelConfig.provider === VideoModelProvider.ALI) {
        updateParams.ali_request_id = submitResponse.request_id;
      } else if (modelConfig.provider === VideoModelProvider.BYTEPLUS) {
        // BytePlus 使用 volcano_request_id 字段（API 兼容）
        updateParams.volcano_request_id = submitResponse.request_id;
      } else if (modelConfig.provider === VideoModelProvider.EVOLINK) {
        // Evolink Sora 使用 sora_request_id 字段
        updateParams.sora_request_id = submitResponse.request_id;
      }
      // Always set generic provider_request_id for uniform access
      updateParams.provider_request_id = submitResponse.request_id;

      // 更新请求ID和状态为 IN_QUEUE
      updateParams.status = "IN_QUEUE";

      // === 保存 actual_provider 和 model_name（用于状态查询时选择正确的 Provider）===
      const finalActualProvider = actualProvider || modelConfig.provider;
      const finalModelName = usedModelName || modelConfig.modelName;
      updateParams.actual_provider = finalActualProvider;
      updateParams.model_name = finalModelName;
      updateParams.metadata = {
        ...videoGeneration.metadata,
        actual_provider: finalActualProvider,
        ...(fallbackModelId ? { fallback_model_id: fallbackModelId } : {}),
      };

      await import("@/models/videoGeneration").then(
        ({ updateVideoGenerationById }) =>
          updateVideoGenerationById(videoGeneration.id, updateParams)
      );

      // 获取扣除积分后的用户剩余积分
      const updatedUserCredits = await getUserCredits(userInfo.uuid);

      return respData({
        id: videoGeneration.id,
        requestId: submitResponse.request_id,
        model: model,
        modelConfig: {
          id: modelConfig.id,
          displayName: modelConfig.displayName,
          type: modelConfig.type,
          provider: modelConfig.provider,
        },
        status: "submitted",
        message: "视频生成任务已提交到队列",
        requiredCredits,
        userCredits: {
          remainingCredits: updatedUserCredits?.left_credits || 0,
          deductedCredits: requiredCredits,
        },
        metadata: {
          prompt,
          optimized_prompt: finalPrompt,
          image_url: image_url || null,
          image_urls: finalImageUrls || null,
          source_image_ids: source_image_ids || null,
          aspect_ratio,
          duration,
          resolution,
          generate_audio,
        },
      });
    } catch (providerError) {
      console.error("提交到provider失败:", providerError);

      // 如果提交失败，我们需要退还积分
      try {
        // 遍历所有扣费的池，按原扣费金额逐一退款
        const { increaseCredits } = await import("@/services/credit");

        for (const pool of deductResult.pools) {
          await increaseCredits({
            user_uuid: userInfo.uuid!,
            trans_type: CreditsTransType.RefundVideoGenerationFailed,
            credits: pool.deducted,
            order_no: pool.order_no,
            expired_at: pool.expired_at,
          });

          console.log(
            `💰 Credits refunded: ${pool.deducted} to pool ${pool.order_no} due to submission failure`
          );
        }

        console.log(
          `💰 Total refunded: ${deductResult.totalDeducted} credits across ${deductResult.pools.length} pool(s)`
        );
      } catch (refundError) {
        console.error("退还积分失败:", refundError);
      }

      // 更新数据库状态为FAILED
      try {
        await import("@/models/videoGeneration").then(
          ({ updateVideoGenerationById }) =>
            updateVideoGenerationById(videoGeneration.id, {
              status: "FAILED",
              error_message:
                providerError instanceof Error
                  ? providerError.message
                  : "Provider submission failed",
            })
        );
      } catch (updateError) {
        console.error("更新视频生成状态失败:", updateError);
      }

      throw providerError;
    }
  } catch (error) {
    console.error("提交视频生成任务失败:", error);
    let errorMessage = "提交视频生成任务失败";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return respErr(errorMessage);
  }
}
