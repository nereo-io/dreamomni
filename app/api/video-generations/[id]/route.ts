import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserInfo } from "@/services/user";
import { softDeleteVideoGeneration } from "@/models/videoGeneration";
import { respErr, respData } from "@/lib/resp";

export async function DELETE(request: NextRequest) {
  try {
    // 验证用户身份
    const session = await auth();
    if (!session?.user?.uuid) {
      return NextResponse.json(respErr("Unauthorized"), { status: 401 });
    }

    // 获取用户信息
    const userInfo = await getUserInfo();
    if (!userInfo?.uuid) {
      return NextResponse.json(respErr("Failed to get user information"), { status: 401 });
    }

    // 解析请求体
    const body = await request.json();
    const { videoId } = body;

    if (!videoId) {
      return NextResponse.json(respErr("Video ID is required"), { status: 400 });
    }

    // 验证 videoId 格式 (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(videoId)) {
      return NextResponse.json(respErr("Invalid video ID format"), { status: 400 });
    }

    console.log(`🗑️ Attempting to delete video: ${videoId} for user: ${userInfo.uuid}`);

    // 执行软删除
    const deleteSuccess = await softDeleteVideoGeneration(videoId, userInfo.uuid);

    if (!deleteSuccess) {
      // 检查控制台输出以获取更详细的错误信息
      console.error(`❌ Failed to delete video: ${videoId} for user: ${userInfo.uuid}`);
      return NextResponse.json({
        code: -1,
        message: "Failed to delete video. Please check if: 1) Video exists 2) You own this video 3) Database has is_delete field"
      }, { status: 404 });
    }

    console.log(`✅ Successfully deleted video: ${videoId}`);

    return NextResponse.json({
      code: 0,
      message: "ok",
      data: {
        success: true,
        videoId: videoId,
        message: "Video deleted successfully"
      }
    });

  } catch (error) {
    console.error("Error deleting video:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json({
      code: -1,
      message: `Failed to delete video: ${errorMessage}`
    }, { status: 500 });
  }
}
