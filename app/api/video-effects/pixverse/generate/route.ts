import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import { getUserInfo } from "@/services/user";
import {
  createVideoGeneration,
  updateVideoGenerationById,
} from "@/models/videoGeneration";
import {
  decreaseCredits,
  increaseCredits,
  CreditsTransType,
  getUserCredits,
} from "@/services/credit";
import { getEffectConfigById } from "@/models/effectConfig";

// PixVerse API 配置
const PIXVERSE_API_BASE = "https://app-api.pixverse.ai/openapi/v2";
const PIXVERSE_API_KEY = process.env.PIXVERSE_API_KEY;

interface PixVerseGenerateResponse {
  ErrCode: number;
  ErrMsg: string;
  Resp?: {
    video_id: number;
  };
}

/**
 * 视频生成端点 - 使用已上传的图片生成视频
 * 需要提供之前上传获得的 imgId
 */
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

    // 3. 检查用户积分
    const userCredits = await getUserCredits(userInfo.uuid);
    if (!userCredits) {
      return respErr("Failed to get user credits");
    }

    // 4. 解析 JSON 请求
    const body = await req.json();
    const {
      effectId,
      imgIds, // 支持单个或多个图片 ID
      prompt,
      duration = 5,
      quality = "540p",
      model = "v4.5",
      imageUrl // 添加原始图片URL参数
    } = body;

    // 处理 imgIds - 支持单个数字或数组
    let imageIds: number[] = [];
    if (Array.isArray(imgIds)) {
      imageIds = imgIds;
    } else if (typeof imgIds === 'number') {
      imageIds = [imgIds];
    } else if (typeof imgIds === 'string') {
      imageIds = [parseInt(imgIds)];
    }

    // 验证必需参数
    if (!effectId || !prompt || imageIds.length === 0) {
      return respErr("effectId, prompt 和至少一个 imgIds 是必需的");
    }

    // 5. 获取特效配置
    const effectConfig = await getEffectConfigById(effectId);
    if (!effectConfig) {
      return respErr("Special effect configuration not found");
    }

    if (effectConfig.effect_type !== "pixverse_template") {
      return respErr("This effect is not a PixVerse template type");
    }

    if (!effectConfig.pixverse_template_id) {
      return respErr("PixVerse template ID not configured");
    }

    // 验证图片数量
    const maxImages = effectConfig.max_images || 1;
    if (imageIds.length > maxImages) {
      return respErr(`This effect supports at most ${maxImages} image(s)`);
    }

    // 6. 计算所需积分并检查余额
    const durationInt = parseInt(duration.toString());
    const requiredCredits = effectConfig.credits_required || 10;

    if (userCredits.left_credits < requiredCredits) {
      return respErr(
        `Insufficient credits. Required: ${requiredCredits}, Available: ${userCredits.left_credits}`
      );
    }

    // 7. 扣除积分
    let transType: CreditsTransType;
    if (durationInt === 5) {
      transType = CreditsTransType.VideoGeneration5s;
    } else if (durationInt === 8) {
      transType = CreditsTransType.VideoGeneration8s;
    } else {
      return respErr(`Unsupported duration: ${durationInt} seconds`);
    }

    try {
      await decreaseCredits({
        user_uuid: userInfo.uuid,
        trans_type: transType,
        credits: requiredCredits,
      });
    } catch (error) {
      console.error("Failed to deduct credits:", error);
      return respErr("Failed to deduct credits, please try again later");
    }

    // 8. 在数据库中创建记录
    const videoGeneration = await createVideoGeneration({
      user_id: userInfo.uuid,
      model_id: "pixverse-" + effectConfig.pixverse_template_id,
      prompt: prompt,
      aspect_ratio: "16:9",
      duration_seconds: durationInt,
      has_audio: false,
      status: "IN_QUEUE",
      effect_id: effectId,
      input_image_url: imageUrl || null, // 保存原始图片URL
    });

    try {
      // 9. 构建 PixVerse API 请求
      const generatePayload: any = {
        duration: durationInt,
        model: model,
        motion_mode: "normal",
        template_id: Number(effectConfig.pixverse_template_id),
        prompt: prompt,
        quality: quality,
      };
      
      // 根据图片数量选择正确的参数名
      if (imageIds.length === 1) {
        generatePayload.img_id = imageIds[0];
      } else {
        generatePayload.img_ids = imageIds;
      }

      console.log("PixVerse generate payload:", generatePayload);

      // 10. 调用 PixVerse 生成 API
      const generateResponse = await fetch(
        `${PIXVERSE_API_BASE}/video/img/generate`,
        {
          method: "POST",
          headers: {
            "API-KEY": PIXVERSE_API_KEY!,
            "Ai-trace-id": `veo3-gen-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(generatePayload),
        }
      );

      const responseText = await generateResponse.text();
      console.log("PixVerse generate response:", responseText);

      if (!generateResponse.ok) {
        throw new Error(
          `Video generation failed: ${generateResponse.status} ${generateResponse.statusText}. Response: ${responseText}`
        );
      }

      const generateResult: PixVerseGenerateResponse = JSON.parse(responseText);

      if (generateResult.ErrCode !== 0 || !generateResult.Resp?.video_id) {
        throw new Error(
          `Video generation failed: ${generateResult.ErrMsg || "Unknown error"}`
        );
      }

      // 11. 更新数据库记录
      await updateVideoGenerationById(videoGeneration.id, {
        pixverse_request_id: generateResult.Resp.video_id.toString(),
        status: "IN_PROGRESS",
      });

      // 12. 获取扣除积分后的用户剩余积分
      const updatedUserCredits = await getUserCredits(userInfo.uuid);

      return respData({
        id: videoGeneration.id,
        requestId: generateResult.Resp.video_id.toString(),
        effectId: effectId,
        status: "submitted",
        message: "Video generation task submitted successfully",
        requiredCredits,
        userCredits: {
          remainingCredits: updatedUserCredits?.left_credits || 0,
          deductedCredits: requiredCredits,
        },
        metadata: {
          prompt,
          effect_name: effectConfig.title,
          template_id: effectConfig.pixverse_template_id,
          duration: durationInt,
          quality,
          model,
          img_ids: imageIds,
          image_url: imageUrl || null, // 添加原始图片URL到metadata
        },
      });

    } catch (pixverseError) {
      console.error("PixVerse API call failed:", pixverseError);

      // 退还积分
      try {
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
        const expiredAt = oneMonthFromNow.toISOString();

        await increaseCredits({
          user_uuid: userInfo.uuid!,
          trans_type: transType,
          credits: requiredCredits,
          expired_at: expiredAt,
        });
        console.log("Credits refunded successfully");
      } catch (refundError) {
        console.error("Failed to refund credits:", refundError);
      }

      // 更新数据库状态
      try {
        await updateVideoGenerationById(videoGeneration.id, {
          status: "FAILED",
          error_message:
            pixverseError instanceof Error
              ? pixverseError.message
              : "PixVerse API call failed",
        });
      } catch (updateError) {
        console.error("Failed to update video generation status:", updateError);
      }

      throw pixverseError;
    }

  } catch (error) {
    console.error("Video generation failed:", error);
    let errorMessage = "Video generation failed";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return respErr(errorMessage);
  }
}