import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import { getUserInfo } from "@/services/user";
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
  isVeoModel,
  isVolcanoModel,
  isAliModel,
  isMinimaxModel,
  calculateCredits,
  VideoModelProvider,
} from "@/config/video-models";
import { ProviderFactory } from "@/services/providers";
import { optimizePromptWithTimeout } from "@/services/promptOptimization";
import { getEffectConfigById } from "@/models/effectConfig";

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

    // 3. 检查用户积分
    const userCredits = await getUserCredits(userInfo.uuid);
    if (!userCredits) {
      return respErr("Failed to get user credits");
    }

    const {
      model,
      prompt,
      image_url,
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
      enable_prompt_enhancement = true, // 新增：prompt增强开关
      effect_id, // 新增：特效ID
      ...otherParams
    } = await req.json();

    // 验证必需参数
    if (!model || !prompt) {
      return respErr("model 和 prompt 参数是必需的");
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
          finalPrompt = effectConfig.prompt_template.replace('{{USER_PROMPT}}', prompt);
        }
        
        // 使用默认模型 minimax-hailuo02-image-to-video 用于特效
        if (effectConfig) {
          finalModel = 'minimax-hailuo02-image-to-video';
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

    // 4. 计算所需积分并检查余额
    const durationInt = parseInt(duration);
    const requiredCredits = effectCreditsOverride || calculateCredits(
      finalModel,
      durationInt,
      generate_audio,
      resolution
    );

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

    // 验证模型支持的时长
    if (!modelConfig?.supportedDurations?.includes(durationInt)) {
      return respErr(
        `${model} 模型不支持 ${durationInt} 秒时长，支持的时长: ${modelConfig?.supportedDurations?.join(
          ", "
        )} 秒`
      );
    }

    // 根据时长确定交易类型（所有模型通用）
    if (durationInt === 5) {
      transType = CreditsTransType.VideoGeneration5s;
    } else if (durationInt === 6) {
      // MiniMax 模型的6秒使用5秒类型（积分计算已经按实际秒数计算）
      transType = CreditsTransType.VideoGeneration6s;
    } else if (durationInt === 8) {
      // VEO模型的8秒使用8秒类型
      transType = CreditsTransType.VideoGeneration8s;
    } else if (durationInt === 10) {
      transType = CreditsTransType.VideoGeneration10s;
    } else {
      return respErr(`不支持的时长: ${durationInt}秒`);
    }

    // 5. 扣除积分（在创建任务前扣除）
    try {
      await decreaseCredits({
        user_uuid: userInfo.uuid,
        trans_type: transType,
        credits: requiredCredits,
      });
    } catch (error) {
      console.error("扣除积分失败:", error);
      return respErr("Failed to deduct credits, please try again later");
    }

    // 6. 在数据库中创建记录（根据是否启用prompt增强设置初始状态）
    const videoGeneration = await createVideoGeneration({
      user_id: userInfo.uuid,
      model_id: finalModel,
      prompt: effect_id ? prompt : finalPrompt, // 如果有特效，保存原始prompt
      input_image_url: image_url,
      negative_prompt,
      aspect_ratio,
      duration_seconds: parseInt(duration),
      cfg_scale,
      seed,
      has_audio: generate_audio, // 新增：记录是否包含音频
      status: enable_prompt_enhancement ? "PROMPT_OPTIMIZING" : "IN_QUEUE",
      effect_id: effect_id,
    });

    // 6.5. 优化提示词
    let enhancedPrompt = finalPrompt;
    if (enable_prompt_enhancement) {
      try {
        const optimizedPrompt = await optimizePromptWithTimeout(
          finalPrompt,
          finalModel,
          30000
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

    // 根据模型类型添加相应参数
    if (isImageToVideoModel(finalModel)) {
      if (!image_url) {
        return respErr("Image-to-video models require an image_url parameter");
      }
      input.image_url = image_url;
    }

    // 按模型提供商分类处理参数
    if (isKlingModel(finalModel)) {
      // Kling 模型特有参数
      if (duration) {
        input.duration = duration;
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
      if (image_url) {
        input.image_url = image_url;
      }
    } else if (isVolcanoModel(finalModel)) {
      // Volcano 模型特有参数 (使用volcanoModel配置)
      if (modelConfig.volcanoModel) {
        input.model = modelConfig.volcanoModel;
      }
    } else if (isKieAiModel(finalModel)) {
      // Kie.ai 模型特有参数
      if (image_url) {
        input.image_url = image_url;
      }
      // Kie.ai 支持水印
      if (otherParams.watermark) {
        input.watermark = otherParams.watermark;
      }
    } else if (isAliModel(finalModel)) {
      // 阿里百炼模型特有参数
      if (image_url) {
        input.image_url = image_url;
      }
      // 阿里百炼使用 resolution 参数
      input.resolution = resolution;
    }

    // 7. 提交任务到队列，包含webhook URL
    const webhookUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/api/video-generation/webhook`;
    // const webhookUrl = `https://b3b0385f848b.ngrok-free.app/api/video-generation/webhook`;

    try {
      // 使用Provider Factory获取合适的provider
      const provider = ProviderFactory.getProvider(finalModel);
      // 重试机制：针对连接超时错误重试3次
      let submitResponse;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          submitResponse = await provider.submit(finalModel, input, webhookUrl);
          break;
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          console.error(`视频生成提交失败 (${attempt}/3):`, errorMsg);

          // 检查是否是连接超时错误
          const isTimeoutError =
            errorMsg.includes("fetch failed") ||
            errorMsg.includes("Connect Timeout Error") ||
            errorMsg.includes("timeout") ||
            errorMsg.includes("ETIMEDOUT");

          // 如果不是超时错误，或者是最后一次重试，直接抛出错误
          if (!isTimeoutError || attempt === 3) {
            throw error;
          }

          // 等待后重试：第1次等1秒，第2次等2秒
          const delay = attempt * 1000;
          console.log(`连接超时，等待 ${delay}ms 后重试...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      if (!submitResponse) {
        throw new Error("视频生成提交失败");
      }

      // 8. 更新数据库记录的请求ID
      const updateParams: any = {};

      // 根据提供商类型设置相应的专用字段
      if (modelConfig.provider === VideoModelProvider.VOLCANO) {
        updateParams.volcano_request_id = submitResponse.request_id;
      } else if (modelConfig.provider === VideoModelProvider.FAL) {
        updateParams.fal_request_id = submitResponse.request_id;
      } else if (
        modelConfig.provider === VideoModelProvider.APICORE ||
        modelConfig.provider === VideoModelProvider.KIEAI
      ) {
        // Both APICore and KieAI use the same veo3_request_id field
        updateParams.veo3_request_id = submitResponse.request_id;
      } else if (modelConfig.provider === VideoModelProvider.ALI) {
        updateParams.ali_request_id = submitResponse.request_id;
      }

      // 更新请求ID和状态为 IN_QUEUE
      updateParams.status = "IN_QUEUE";

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
          aspect_ratio,
          duration,
          generate_audio,
          webhook_url: webhookUrl,
        },
      });
    } catch (providerError) {
      console.error("提交到provider失败:", providerError);

      // 如果提交失败，我们需要退还积分
      try {
        // 为退还的积分设置一个合理的过期时间（1个月后）
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
        const expiredAt = oneMonthFromNow.toISOString();

        await import("@/services/credit").then(({ increaseCredits }) =>
          increaseCredits({
            user_uuid: userInfo.uuid!,
            trans_type: transType,
            credits: requiredCredits,
            expired_at: expiredAt,
          })
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
