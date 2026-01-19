import { respData, respErr } from "@/lib/resp";
import {
  getVideoGenerationByVeo3RequestId,
  updateVideoGenerationByVeo3RequestId,
} from "@/models/videoGeneration";
import { newStorage } from "@/lib/storage";
import { VIDEO_CACHE_CONTROL } from "@/lib/cache-control";
import { increaseCredits, CreditsTransType } from "@/services/credit";
import { calculateCredits } from "@/config/video-models";

export async function POST(req: Request) {
  try {
    const webhookData = await req.json();

    console.log(
      "收到 4K webhook 回调:",
      JSON.stringify(webhookData, null, 2)
    );

    // 验证回调数据格式
    if (webhookData.code === undefined || !webhookData.data?.taskId) {
      return respErr("无效的 4K webhook 数据格式");
    }

    const taskId = webhookData.data.taskId;

    // 查找对应的视频生成记录
    const videoGeneration = await getVideoGenerationByVeo3RequestId(taskId);

    if (!videoGeneration) {
      console.warn(`未找到对应的视频生成记录 (4K webhook): ${taskId}`);
      return respData({
        message: "记录未找到，但webhook已处理",
        taskId,
      });
    }

    const metadata = videoGeneration.metadata || {};

    // 处理4K升级结果
    if (webhookData.code === 200) {
      // 4K升级成功
      const video4kUrl = webhookData.data.info?.resultUrls?.[0];

      if (!video4kUrl) {
        console.error(`4K webhook成功但没有视频URL: ${taskId}`);

        // 使用基础视频作为最终视频
        await updateVideoGenerationByVeo3RequestId(taskId, {
          status: "SAVED_TO_R2",
          video_url_r2: metadata.base_video_url_r2 || undefined,
          metadata: {
            ...metadata,
            upscale_4k_status: "failed",
            upscale_4k_error: "4K video URL not found in callback",
          },
        });

        // 退还4K升级部分费用
        await refund4KUpgradeCost(videoGeneration);

        return respData({
          message: "4K升级完成但缺少视频URL，使用基础视频",
          taskId,
        });
      }

      // 上传4K视频到R2
      let r2Video4kUrl = null;
      const maxRetries = 3;
      const retryDelay = 2000;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const storage = newStorage();
          const fileName = `videos/${videoGeneration.id}-4k-${Date.now()}.mp4`;

          const uploadResult = await storage.downloadAndUpload({
            url: video4kUrl,
            key: fileName,
            contentType: "video/mp4",
            cacheControl: VIDEO_CACHE_CONTROL,
          });

          r2Video4kUrl = uploadResult.url;
          console.log(
            `4K视频已上传到R2: ${r2Video4kUrl} (第${attempt}次尝试)`
          );
          break;
        } catch (uploadError) {
          console.error(
            `4K视频R2上传失败 (第${attempt}/${maxRetries}次尝试):`,
            uploadError
          );

          if (attempt === maxRetries) {
            console.error("4K视频R2上传达到最大重试次数");
          } else {
            console.log(`${retryDelay}ms后进行第${attempt + 1}次重试...`);
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
          }
        }
      }

      // 4K成功：设置4K视频为主视频
      await updateVideoGenerationByVeo3RequestId(taskId, {
        status: "SAVED_TO_R2",
        video_url_r2: r2Video4kUrl || video4kUrl, // 4K视频作为主视频
        metadata: {
          ...metadata,
          upscale_4k_status: "completed",
          video_url_4k: video4kUrl,
          video_url_4k_r2: r2Video4kUrl || undefined,
        },
      });

      console.log(`✅ 4K升级完成: ${taskId}`);

      return respData({
        message: "4K升级完成并已保存",
        taskId,
        video_url_4k: r2Video4kUrl || video4kUrl,
        r2_uploaded: !!r2Video4kUrl,
      });
    } else {
      // 4K升级失败
      const errorMessage =
        webhookData.msg || "The 4K version of this video is unavailable";

      console.warn(`4K升级失败: ${taskId}, 错误: ${errorMessage}`);

      // 4K失败：使用基础视频作为最终视频
      await updateVideoGenerationByVeo3RequestId(taskId, {
        status: "SAVED_TO_R2",
        video_url_r2: metadata.base_video_url_r2 || undefined, // 使用基础视频
        metadata: {
          ...metadata,
          upscale_4k_status: "failed",
          upscale_4k_error: errorMessage,
        },
      });

      // 退还4K升级部分费用
      await refund4KUpgradeCost(videoGeneration);

      return respData({
        message: "4K升级失败，已退还升级费用，使用基础视频",
        taskId,
        error: errorMessage,
      });
    }
  } catch (error) {
    console.error("处理 4K webhook 失败:", error);

    let errorMessage = "处理 4K webhook 失败";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return respErr(errorMessage);
  }
}

/**
 * 退还4K升级部分费用
 * 定价: 720p=12积分, 1080p=16积分, 4K=36积分
 * 4K退款 = 4K费用 - 720p基础费用 = 36 - 12 = 24积分
 */
async function refund4KUpgradeCost(videoGeneration: any): Promise<void> {
  try {
    const metadata = videoGeneration.metadata || {};
    const creditDeduction = metadata.credit_deduction;

    // 跳过预扣费的 agent 任务
    if (creditDeduction?.skipped) {
      console.log(
        `ℹ️ Skip 4K refund: agent precharged for video generation ${videoGeneration.id}`
      );
      return;
    }

    // 检查是否有扣费记录
    if (!creditDeduction || !creditDeduction.pools || creditDeduction.pools.length === 0) {
      console.error(`❌ Missing credit_deduction metadata for 4K refund: ${videoGeneration.id}`);
      return;
    }

    const duration = videoGeneration.duration_seconds || 8;
    const hasAudio = videoGeneration.has_audio || false;

    // 计算4K费用和720p基础费用
    const cost4K = calculateCredits(videoGeneration.model_id, duration, hasAudio, "4k");
    const costBase = calculateCredits(videoGeneration.model_id, duration, hasAudio, "720p");

    // 退还4K升级部分费用 (36-12=24积分)
    const refundAmount = cost4K - costBase;

    console.log(
      `💰 计算4K退款: 总扣费=${creditDeduction.total_deducted}, 4K费用=${cost4K}, 基础费用=${costBase}, 退款=${refundAmount}`
    );

    // 从第一个池退款（简化处理）
    const firstPool = creditDeduction.pools[0];
    await increaseCredits({
      user_uuid: videoGeneration.user_id,
      trans_type: CreditsTransType.RefundVideoGenerationFailed,
      credits: refundAmount,
      order_no: firstPool.order_no,
      expired_at: firstPool.expired_at,
    });

    console.log(
      `✅ 4K升级费用已退还: ${refundAmount} credits for video ${videoGeneration.id}`
    );
  } catch (refundError) {
    console.error("退还4K升级费用失败:", refundError);
    // 退款失败不影响主流程
  }
}

// 支持 GET 请求用于验证 webhook 端点
export async function GET() {
  return respData({
    message: "4K Webhook 端点正常运行",
    endpoint: "/api/video-generation/webhook/veo3-4k",
    supported_methods: ["POST"],
    description: "处理来自 Kie.ai 的 4K 视频升级回调",
    expected_codes: {
      200: "4K升级成功",
      500: "4K升级失败，退还升级费用",
    },
  });
}
