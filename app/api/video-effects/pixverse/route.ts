import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import { getUserInfo } from "@/services/user";
import { createVideoGeneration, updateVideoGenerationById } from "@/models/videoGeneration";
import {
  decreaseCredits,
  CreditsTransType,
  getUserCredits,
} from "@/services/credit";
import { getEffectConfigById } from "@/models/effectConfig";

// PixVerse API 配置
const PIXVERSE_API_BASE = "https://app-api.pixverse.ai/openapi/v2";
const PIXVERSE_API_KEY = process.env.PIXVERSE_API_KEY;

interface PixVerseUploadResponse {
  ErrCode: number;
  ErrMsg: string;
  Resp?: {
    img_id: number;
    img_url: string;
  };
}

interface PixVerseGenerateResponse {
  ErrCode: number;
  ErrMsg: string;
  Resp?: {
    video_id: number;
  };
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

    // 3. 检查用户积分
    const userCredits = await getUserCredits(userInfo.uuid);
    if (!userCredits) {
      return respErr("Failed to get user credits");
    }

    // 4. 解析表单数据（支持多图上传）
    const formData = await req.formData();
    const effect_id = formData.get("effect_id") as string;
    const prompt = formData.get("prompt") as string;
    const duration = formData.get("duration") as string || "5";
    const quality = formData.get("quality") as string || "540p";
    const model = formData.get("model") as string || "v4.5";

    // 获取上传的图片
    const images: File[] = [];
    const image1 = formData.get("image1") as File;
    const image2 = formData.get("image2") as File;
    
    if (image1) images.push(image1);
    if (image2) images.push(image2);

    // 验证必需参数
    if (!effect_id || !prompt || images.length === 0) {
      return respErr("effect_id, prompt 和至少一张图片是必需的");
    }

    // 5. 获取特效配置并验证类型
    const effectConfig = await getEffectConfigById(effect_id);
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
    if (images.length > (effectConfig.max_images || 1)) {
      return respErr(`This effect supports at most ${effectConfig.max_images || 1} images`);
    }

    // 6. 计算所需积分并检查余额
    const durationInt = parseInt(duration);
    const requiredCredits = effectConfig.credits_required || 10; // 默认10积分

    if (userCredits.left_credits < requiredCredits) {
      return respErr(
        `积分不足，需要 ${requiredCredits} 积分，当前剩余 ${userCredits.left_credits} 积分`
      );
    }

    // 7. 扣除积分
    let transType: CreditsTransType;
    if (durationInt === 5) {
      transType = CreditsTransType.VideoGeneration5s;
    } else if (durationInt === 8) {
      transType = CreditsTransType.VideoGeneration8s;
    } else {
      return respErr(`不支持的时长: ${durationInt}秒`);
    }

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

    // 8. 在数据库中创建记录
    const videoGeneration = await createVideoGeneration({
      user_id: userInfo.uuid,
      model_id: "pixverse-" + effectConfig.pixverse_template_id,
      prompt: prompt,
      aspect_ratio: "16:9", // PixVerse 默认比例
      duration_seconds: durationInt,
      has_audio: false,
      status: "IN_QUEUE",
      effect_id: effect_id,
    });

    // 9. 上传图片到 PixVerse
    const imgIds: number[] = [];
    
    try {
      for (const image of images) {
        const uploadFormData = new FormData();
        uploadFormData.append("image", image);

        const uploadResponse = await fetch(`${PIXVERSE_API_BASE}/image/upload`, {
          method: "POST",
          headers: {
            "API-KEY": PIXVERSE_API_KEY!,
            "Ai-trace-id": `veo3-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
          body: uploadFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Image upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }

        const uploadResult: PixVerseUploadResponse = await uploadResponse.json();
        
        if (uploadResult.ErrCode !== 0 || !uploadResult.Resp?.img_id) {
          throw new Error(`Image upload failed: ${uploadResult.ErrMsg || "Unknown error"}`);
        }

        imgIds.push(uploadResult.Resp.img_id);
      }

      // 10. 调用 PixVerse 生成 API
      const generatePayload = {
        duration: durationInt,
        img_ids: imgIds,
        model: model,
        motion_mode: "normal",
        template_id: effectConfig.pixverse_template_id,
        prompt: prompt,
        quality: quality,
      };

      const generateResponse = await fetch(`${PIXVERSE_API_BASE}/video/img/generate`, {
        method: "POST",
        headers: {
          "API-KEY": PIXVERSE_API_KEY!,
          "Ai-trace-id": `veo3-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(generatePayload),
      });

      if (!generateResponse.ok) {
        throw new Error(`Video generation failed: ${generateResponse.status} ${generateResponse.statusText}`);
      }

      const generateResult: PixVerseGenerateResponse = await generateResponse.json();
      
      if (generateResult.ErrCode !== 0 || !generateResult.Resp?.video_id) {
        throw new Error(`Video generation failed: ${generateResult.ErrMsg || "Unknown error"}`);
      }

      // 11. 更新数据库记录的 pixverse_request_id
      await updateVideoGenerationById(videoGeneration.id, {
        pixverse_request_id: generateResult.Resp.video_id.toString(),
        status: "IN_PROGRESS",
      });

      // 12. 获取扣除积分后的用户剩余积分
      const updatedUserCredits = await getUserCredits(userInfo.uuid);

      return respData({
        id: videoGeneration.id,
        requestId: generateResult.Resp.video_id.toString(),
        effectId: effect_id,
        status: "submitted",
        message: "PixVerse 特效视频生成任务已提交",
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
          images_count: imgIds.length,
          img_ids: imgIds,
        },
      });

    } catch (pixverseError) {
      console.error("PixVerse API 调用失败:", pixverseError);

      // 如果 PixVerse 调用失败，退还积分
      try {
        const oneMonthFromNow = new Date();
        oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
        const expiredAt = oneMonthFromNow.toISOString();

        const { increaseCredits } = await import("@/services/credit");
        await increaseCredits({
          user_uuid: userInfo.uuid!,
          trans_type: transType,
          credits: requiredCredits,
          expired_at: expiredAt,
        });
      } catch (refundError) {
        console.error("退还积分失败:", refundError);
      }

      // 更新数据库状态为FAILED
      try {
        await updateVideoGenerationById(videoGeneration.id, {
          status: "FAILED",
          error_message:
            pixverseError instanceof Error
              ? pixverseError.message
              : "PixVerse API call failed",
        });
      } catch (updateError) {
        console.error("更新视频生成状态失败:", updateError);
      }

      throw pixverseError;
    }

  } catch (error) {
    console.error("PixVerse 特效生成失败:", error);
    let errorMessage = "PixVerse 特效生成失败";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return respErr(errorMessage);
  }
}