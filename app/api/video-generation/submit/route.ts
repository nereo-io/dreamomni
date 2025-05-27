import { fal } from "@fal-ai/client";
import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import { getUserInfo } from "@/services/user";
import { createVideoGeneration } from "@/models/videoGeneration";

// 配置fal client
fal.config({
  credentials: process.env.FAL_KEY,
});

// 支持的视频模型配置
const VIDEO_MODELS = {
  // 文本转视频模型
  "minimax-text-to-video": "fal-ai/minimax/video-01",
  "haiper-text-to-video": "fal-ai/haiper-video-2/text-to-video",
  "hunyuan-text-to-video": "fal-ai/hunyuan-video",
  "mochi-text-to-video": "fal-ai/mochi-v1",
  "kling-1-6-text-to-video": "fal-ai/kling-video/v1.6/standard/text-to-video",

  // 图片转视频模型
  "minimax-image-to-video": "fal-ai/minimax/video-01/image-to-video",
  "luma-dream-machine": "fal-ai/luma-dream-machine/image-to-video",
  "kling-2-0-master": "fal-ai/kling-video/v2/master/image-to-video",
  "kling-1-6": "fal-ai/kling-video/v1.6/standard/image-to-video",
  pixverse: "fal-ai/pixverse/image-to-video",
  "veo-2": "fal-ai/veo2/image-to-video",
  "wan-image-to-video": "fal-ai/wan-i2v",
  framepack: "fal-ai/framepack",
};

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
      ...otherParams
    } = await req.json();

    // 验证必需参数
    if (!model || !prompt) {
      return respErr("model 和 prompt 参数是必需的");
    }

    // 验证模型是否支持
    const modelEndpoint = VIDEO_MODELS[model as keyof typeof VIDEO_MODELS];
    if (!modelEndpoint) {
      return respErr(
        `不支持的模型: ${model}。支持的模型: ${Object.keys(VIDEO_MODELS).join(
          ", "
        )}`
      );
    }

    // 检查API密钥
    if (!process.env.FAL_KEY) {
      return respErr("FAL_KEY 环境变量未配置");
    }

    // 构建请求输入
    const input: any = {
      prompt,
      ...otherParams,
    };

    // 根据模型类型添加相应参数
    const isImageToVideo =
      model.includes("image-to-video") ||
      [
        "luma-dream-machine",
        "kling-2-0-master",
        "kling-1-6",
        "pixverse",
        "veo-2",
        "wan-image-to-video",
        "framepack",
      ].includes(model);

    if (isImageToVideo && !image_url) {
      return respErr("图片转视频模型需要提供 image_url 参数");
    }

    if (image_url) {
      input.image_url = image_url;
    }

    if (negative_prompt) {
      input.negative_prompt = negative_prompt;
    }

    if (aspect_ratio) {
      input.aspect_ratio = aspect_ratio;
    }

    // Kling 模型特有参数
    if (model === "kling-1-6" || model === "kling-2-0-master") {
      if (duration) {
        input.duration = duration;
      }
      if (cfg_scale !== undefined) {
        input.cfg_scale = cfg_scale;
      }
    } else {
      // 其他模型的参数
      if (resolution) {
        input.resolution = resolution;
      }
      if (num_frames) {
        input.num_frames = num_frames;
      }
      if (frames_per_second) {
        input.frames_per_second = frames_per_second;
      }
      if (enable_safety_checker !== undefined) {
        input.enable_safety_checker = enable_safety_checker;
      }
    }

    if (seed) {
      input.seed = seed;
    }

    // 3. 在数据库中创建记录
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
      status: "IN_QUEUE",
    });

    // 4. 提交任务到队列，包含webhook URL
    const webhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/video-generation/webhook`;

    // const webhookUrl =
    //   "https://cbff-2400-9ce0-516e-a043-6fe5-72bf-12ad-67c1.ngrok-free.app/api/video-generation/webhook";

    const submitOptions: any = {
      input,
      webhookUrl,
    };

    const { request_id } = await fal.queue.submit(modelEndpoint, submitOptions);

    // 5. 更新数据库记录的fal_request_id
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
      modelEndpoint: modelEndpoint,
      status: "submitted",
      message: "视频生成任务已提交到队列",
      metadata: {
        prompt,
        image_url: image_url || null,
        aspect_ratio,
        resolution,
        num_frames,
        frames_per_second,
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
