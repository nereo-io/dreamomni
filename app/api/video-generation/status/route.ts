import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import { getVideoGenerationById } from "@/models/videoGeneration";
import { VideoStatusService } from "@/services/videoStatusService";

export async function POST(req: Request) {
  try {
    // 用户认证检查
    const session = await auth();
    if (!session?.user?.uuid) {
      return respErr("User not authenticated");
    }

    const body = await req.json();
    const { id } = body;

    console.log("POST 状态查询请求参数:", { id });

    // 验证必需参数（id 是我们内部的生成记录ID）
    if (!id) {
      return respErr("id 参数是必需的");
    }

    console.log(`检查视频生成状态，生成ID: ${id}`);

    // 从数据库获取视频生成记录
    const videoGeneration = await getVideoGenerationById(
      id,
      session.user.uuid
    );
    if (!videoGeneration) {
      return respErr("Video generation record not found");
    }

    // 使用 VideoStatusService 获取最新状态
    const statusResult = await VideoStatusService.getVideoStatus(
      videoGeneration
    );

    return respData(statusResult);
  } catch (error) {
    console.error("状态查询失败:", error);

    let errorMessage = "状态查询失败";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return respErr(errorMessage);
  }
}
