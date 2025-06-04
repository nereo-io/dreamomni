import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getUserStatistics,
  getVideoGenerationStatistics,
  getOrderStatistics,
  getMembershipDetailedStatistics,
  getTargetMetrics,
  getVideoGenerationByModel,
} from "@/models/statistics";

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const dataType = searchParams.get("type");

    // 根据类型返回不同的统计数据
    switch (dataType) {
      case "users":
        const userStats = await getUserStatistics();
        return NextResponse.json(userStats);

      case "videos":
        const videoStats = await getVideoGenerationStatistics();
        return NextResponse.json(videoStats);

      case "orders":
        const orderStats = await getOrderStatistics();
        return NextResponse.json(orderStats);

      case "memberships":
        const membershipStats = await getMembershipDetailedStatistics();
        return NextResponse.json(membershipStats);

      case "targets":
        const targetMetrics = await getTargetMetrics();
        return NextResponse.json(targetMetrics);

      case "models":
        const modelStats = await getVideoGenerationByModel();
        return NextResponse.json(modelStats);

      case "all":
      default:
        // 返回所有统计数据
        const [
          allUserStats,
          allVideoStats,
          allModelStats,
          allOrderStats,
          allMembershipStats,
          allTargetMetrics,
        ] = await Promise.all([
          getUserStatistics(),
          getVideoGenerationStatistics(),
          getVideoGenerationByModel(),
          getOrderStatistics(),
          getMembershipDetailedStatistics(),
          getTargetMetrics(),
        ]);

        return NextResponse.json({
          users: allUserStats,
          videos: allVideoStats,
          orders: allOrderStats,
          memberships: allMembershipStats,
          targets: allTargetMetrics,
          models: allModelStats,
          updatedAt: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error("获取统计数据失败:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
