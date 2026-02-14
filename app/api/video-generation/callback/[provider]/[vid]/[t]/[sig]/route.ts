import { respData, respErr } from "@/lib/resp";
import { newStorage } from "@/lib/storage";
import { VIDEO_CACHE_CONTROL } from "@/lib/cache-control";
import {
  getVideoGenerationById,
  markVideoGenerationFailedIfActive,
  updateVideoGenerationById,
} from "@/models/videoGeneration";
import { increaseCredits, CreditsTransType } from "@/services/credit";
import { parseVideoWebhookPayload } from "@/services/videoWebhookParser";
import { verifyVideoCallbackSignature } from "@/services/videoCallbackSignature";
import { getVideoModel, shouldUseSignedVideoCallback } from "@/config/video-models";

async function uploadToR2WithRetry(
  videoGenerationId: string,
  videoUrl: string
): Promise<string | null> {
  const maxRetries = 3;
  const retryDelayMs = 2000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const storage = newStorage();
      const fileName = `videos/${videoGenerationId}-${Date.now()}.mp4`;
      const uploadResult = await storage.downloadAndUpload({
        url: videoUrl,
        key: fileName,
        contentType: "video/mp4",
        cacheControl: VIDEO_CACHE_CONTROL,
      });
      console.log(`视频已上传到R2: ${uploadResult.url} (第${attempt}次尝试)`);
      return uploadResult.url ?? null;
    } catch (error) {
      console.error(
        `R2上传失败 (第${attempt}/${maxRetries}次尝试):`,
        error
      );
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  return null;
}

async function refundCreditsForFailedGeneration(videoGeneration: any) {
  const creditDeduction = videoGeneration.metadata?.credit_deduction;

  if (creditDeduction?.skipped) {
    console.log(
      `ℹ️ Skip refund: agent precharged for video generation ${videoGeneration.id}`
    );
    return;
  }

  if (
    !creditDeduction ||
    !creditDeduction.pools ||
    creditDeduction.pools.length === 0
  ) {
    console.error(
      `❌ Missing credit_deduction metadata for video generation: ${videoGeneration.id}`
    );
    return;
  }

  for (const pool of creditDeduction.pools) {
    await increaseCredits({
      user_uuid: videoGeneration.user_id,
      trans_type: CreditsTransType.RefundVideoGenerationFailed,
      credits: pool.deducted,
      order_no: pool.order_no,
      expired_at: pool.expired_at,
    });
  }

  console.log(
    `✅ Total refunded: ${creditDeduction.totalDeducted} credits across ${creditDeduction.pools.length} pool(s) for video generation ${videoGeneration.id}`
  );
}

async function markFailedAndRefundIfNeeded(params: {
  videoGeneration: any;
  baseUpdateParams: any;
  errorMessage: string;
}) {
  const { videoGeneration, baseUpdateParams, errorMessage } = params;
  const updated = await markVideoGenerationFailedIfActive(videoGeneration.id, {
    ...baseUpdateParams,
    error_message: errorMessage,
  });

  // 并发场景下，若任务已被其他回调置为终态，则跳过退款避免重复退回。
  if (!updated) {
    console.log(
      `ℹ️ Skip refund: video generation ${videoGeneration.id} is already in final status`
    );
    return false;
  }

  await refundCreditsForFailedGeneration(videoGeneration);
  return true;
}

export async function POST(
  req: Request,
  {
    params,
  }: {
    params: { provider: string; vid: string; t: string; sig: string };
  }
) {
  try {
    const { provider, vid, t, sig } = params;
    const normalizedProvider = provider.toLowerCase();
    const verification = verifyVideoCallbackSignature({
      provider: normalizedProvider,
      videoId: vid,
      timestamp: t,
      signature: sig,
    });
    if (!verification.valid) {
      return respErr(`Invalid callback signature: ${verification.reason}`);
    }

    const videoGeneration = await getVideoGenerationById(vid);
    if (!videoGeneration) {
      return respData({
        message: "记录未找到，回调已忽略",
        video_id: vid,
      });
    }

    if (["COMPLETED", "SAVED_TO_R2", "FAILED"].includes(videoGeneration.status)) {
      return respData({
        message: `任务已是终态(${videoGeneration.status})，回调已忽略`,
        video_id: vid,
        status: videoGeneration.status,
      });
    }

    const modelConfig = getVideoModel(videoGeneration.model_id);
    if (!modelConfig) {
      return respErr(`Unknown video model: ${videoGeneration.model_id}`);
    }

    if (!shouldUseSignedVideoCallback(videoGeneration.model_id)) {
      return respErr(
        `Model ${videoGeneration.model_id} does not use signed callback route`
      );
    }

    const expectedProvider =
      (
        videoGeneration.actual_provider ||
        modelConfig.provider ||
        ""
      ).toString().toLowerCase();
    if (expectedProvider !== normalizedProvider) {
      return respErr(
        `Provider mismatch: expected ${expectedProvider}, got ${normalizedProvider}`
      );
    }

    const webhookData = await req.json();
    console.log(
      "收到签名视频回调:",
      JSON.stringify(
        {
          provider: normalizedProvider,
          video_id: vid,
          timestamp: t,
          webhookData,
        },
        null,
        2
      )
    );

    let parsed;
    try {
      parsed = parseVideoWebhookPayload(webhookData);
    } catch (parseError) {
      return respErr(
        parseError instanceof Error ? parseError.message : "无效的 webhook 数据格式"
      );
    }

    const requestId = parsed.request_id;
    if (
      videoGeneration.provider_request_id &&
      videoGeneration.provider_request_id !== requestId
    ) {
      return respErr(
        `provider_request_id mismatch: expected ${videoGeneration.provider_request_id}, got ${requestId}`
      );
    }

    const baseUpdateParams: any = {
      provider_request_id: requestId,
      logs: parsed.logs || [],
      metrics: parsed.metrics || {},
    };

    switch (parsed.status) {
      case "OK": {
        const videoUrl = parsed.payload?.video?.url;
        if (!videoUrl) {
          try {
            await markFailedAndRefundIfNeeded({
              videoGeneration,
              baseUpdateParams,
              errorMessage: "响应中没有视频URL",
            });
          } catch (refundError) {
            console.error("返还积分失败:", refundError);
          }
          return respErr("响应中没有视频URL");
        }

        const r2VideoUrl = await uploadToR2WithRetry(videoGeneration.id, videoUrl);
        await updateVideoGenerationById(videoGeneration.id, {
          ...baseUpdateParams,
          status: r2VideoUrl ? "SAVED_TO_R2" : "COMPLETED",
          video_url_provider: videoUrl,
          ...(r2VideoUrl ? { video_url_r2: r2VideoUrl } : {}),
        });

        return respData({
          message: "视频生成完成并已处理",
          request_id: requestId,
          video_url: r2VideoUrl || videoUrl,
          r2_uploaded: !!r2VideoUrl,
        });
      }

      case "ERROR": {
        try {
          await markFailedAndRefundIfNeeded({
            videoGeneration,
            baseUpdateParams,
            errorMessage: parsed.error || "未知错误",
          });
        } catch (refundError) {
          console.error("返还积分失败:", refundError);
        }

        return respData({
          message: "视频生成失败",
          request_id: requestId,
          error: parsed.error || "未知错误",
        });
      }

      case "IN_QUEUE": {
        await updateVideoGenerationById(videoGeneration.id, {
          ...baseUpdateParams,
          status: "IN_QUEUE",
        });
        return respData({
          message: "任务在队列中等待",
          request_id: requestId,
        });
      }

      case "IN_PROGRESS": {
        await updateVideoGenerationById(videoGeneration.id, {
          ...baseUpdateParams,
          status: "IN_PROGRESS",
        });
        return respData({
          message: "视频生成进行中",
          request_id: requestId,
        });
      }

      default: {
        await updateVideoGenerationById(videoGeneration.id, baseUpdateParams);
        return respData({
          message: "收到状态更新",
          request_id: requestId,
          status: parsed.status,
        });
      }
    }
  } catch (error) {
    console.error("处理签名回调失败:", error);
    return respErr(error instanceof Error ? error.message : "处理签名回调失败");
  }
}

export async function GET() {
  return respData({
    message: "Signed callback 端点正常运行",
    endpoint: "/api/video-generation/callback/[provider]/[vid]/[t]/[sig]",
    supported_methods: ["POST"],
  });
}
