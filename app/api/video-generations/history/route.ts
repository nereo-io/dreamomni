import { auth } from "@/auth";
import { getUserInfo } from "@/services/user";
import { getUserVideoGenerations } from "@/models/videoGeneration";
import { respData, respErr } from "@/lib/resp";

export async function GET(req: Request) {
  try {
    // 1. 用户认证检查
    const session = await auth();
    if (!session?.user?.uuid) {
      return respErr("User not authenticated");
    }

    // 3. 获取查询参数
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "12");
    const status = url.searchParams.get("status");

    // 验证分页参数
    if (page < 1) {
      return respErr("Page number must be greater than 0");
    }
    if (limit < 1 || limit > 100) {
      return respErr("Limit must be between 1 and 100");
    }

    const offset = (page - 1) * limit;

    // 4. 获取用户的视频生成历史记录
    const { data: videoGenerations, total } = await getUserVideoGenerations(
      session?.user?.uuid,
      limit,
      offset
    );

    // 5. 计算分页信息
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // 6. 返回数据
    return respData({
      data: videoGenerations.map((video) => ({
        id: video.id,
        model_id: video.model_id,
        prompt: video.prompt,
        optimized_prompt: video.optimized_prompt, // ✅ 添加增强prompt字段
        input_image_url: video.input_image_url,
        negative_prompt: video.negative_prompt,
        aspect_ratio: video.aspect_ratio,
        duration_seconds: video.duration_seconds,
        status: video.status,
        video_url: video.video_url_r2 || video.video_url_fal,
        video_url_r2: video.video_url_r2,
        video_url_fal: video.video_url_fal,
        upsample_video_url_veo3: video.upsample_video_url_veo3,
        video_url_veo3: video.video_url_veo3,
        video_url_volcano: video.video_url_volcano,
        has_audio: video.has_audio,
        error_message: video.error_message,
        created_at: video.created_at,
        updated_at: video.updated_at,
        // 不返回敏感信息如logs和metrics的详细内容
        has_logs: !!(video.logs && Object.keys(video.logs).length > 0),
        has_metrics: !!(video.metrics && Object.keys(video.metrics).length > 0),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    });
  } catch (error) {
    console.error("Failed to get video generation history:", error);

    let errorMessage = "Failed to get video generation history";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return respErr(errorMessage);
  }
}
