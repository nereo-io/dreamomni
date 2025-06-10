import { fal } from "@fal-ai/client";
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
  isVeoModel,
  calculateCredits,
  VideoModelProvider,
} from "@/config/video-models";

// 配置fal client
fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(req: Request) {
  try {
    // 1. 用户认证检查
    const session = await auth();
    if (!session?.user?.uuid) {
      return respErr("用户未登录");
    }

    // 2. 获取用户信息
    const userInfo = await getUserInfo();
    if (!userInfo?.uuid) {
      return respErr("用户信息获取失败");
    }

    // 3. 检查用户积分
    const userCredits = await getUserCredits(userInfo.uuid);
    if (!userCredits) {
      return respErr("获取用户积分失败");
    }

    const {
      model,
      prompt,
      image_url,
      negative_prompt,
      aspect_ratio = "16:9",
      duration = "5",
      cfg_scale,
      resolution = "720p",
      num_frames,
      frames_per_second = 16,
      seed,
      enable_safety_checker = true,
      generate_audio = false, // 新增：音频生成选项
      ...otherParams
    } = await req.json();

    // 验证必需参数
    if (!model || !prompt) {
      return respErr("model 和 prompt 参数是必需的");
    }

    // 验证模型是否支持
    const modelConfig = getVideoModel(model);
    if (!modelConfig) {
      return respErr(
        `不支持的模型: ${model}。支持的模型: ${getSupportedModelIds().join(
          ", "
        )}`
      );
    }

    // 4. 计算所需积分并检查余额
    const durationInt = parseInt(duration);
    const requiredCredits = calculateCredits(
      model,
      durationInt,
      generate_audio
    );

    if (requiredCredits === 0) {
      return respErr("无法计算所需积分，请检查模型配置");
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
    } else if (durationInt === 8) {
      // VEO模型的8秒使用5秒类型（积分计算已经按实际秒数计算）
      transType = CreditsTransType.VideoGeneration8s;
    } else if (durationInt === 10) {
      transType = CreditsTransType.VideoGeneration10s;
    } else {
      return respErr(`不支持的时长: ${durationInt}秒`);
    }

    // 检查API密钥
    if (!process.env.FAL_KEY) {
      return respErr("FAL_KEY 环境变量未配置");
    }

    // 构建请求输入
    const input: any = {
      prompt,
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

    // 根据模型类型添加相应参数
    if (isImageToVideoModel(model)) {
      if (!image_url) {
        return respErr("图片转视频模型需要提供 image_url 参数");
      }
      input.image_url = image_url;
    }

    // 按模型提供商分类处理参数
    if (isKlingModel(model)) {
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
    } else if (isVeo2Model(model)) {
      if (duration) {
        input.duration = `${duration}s`;
      }
    } else if (isVeo3Model(model)) {
      if (duration) {
        input.duration = `${duration}s`;
      }
      if (generate_audio !== undefined) {
        input.generate_audio = generate_audio;
      }
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
      return respErr("扣除积分失败，请稍后重试");
    }

    // 6. 在数据库中创建记录
    const videoGeneration = await createVideoGeneration({
      user_id: userInfo.uuid,
      model_id: model,
      prompt,
      input_image_url: image_url,
      negative_prompt,
      aspect_ratio,
      duration_seconds: parseInt(duration),
      cfg_scale,
      seed,
      has_audio: generate_audio, // 新增：记录是否包含音频
      status: "IN_QUEUE",
    });

    // 7. 提交任务到队列，包含webhook URL
    // const webhookUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/api/video-generation/webhook`;
    const webhookUrl = `https://1e7d-2604-a880-4-1d0-00-b1f6-d000.ngrok-free.app/api/video-generation/webhook`;

    const submitOptions: any = {
      input,
      webhookUrl,
    };

    const { request_id } = await fal.queue.submit(
      modelConfig.falEndpoint,
      submitOptions
    );

    // 8. 更新数据库记录的fal_request_id
    await import("@/models/videoGeneration").then(
      ({ updateVideoGenerationById }) =>
        updateVideoGenerationById(videoGeneration.id, {
          fal_request_id: request_id,
        })
    );

    return respData({
      id: videoGeneration.id,
      requestId: request_id,
      model: model,
      modelConfig: {
        id: modelConfig.id,
        displayName: modelConfig.displayName,
        type: modelConfig.type,
      },
      modelEndpoint: modelConfig.falEndpoint,
      status: "submitted",
      message: "视频生成任务已提交到队列",
      requiredCredits,
      metadata: {
        prompt,
        image_url: image_url || null,
        aspect_ratio,
        duration,
        generate_audio,
        webhook_url: webhookUrl,
      },
    });
  } catch (error) {
    console.error("提交视频生成任务失败:", error);
    let errorMessage = "提交视频生成任务失败";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return respErr(errorMessage);
  }
}
