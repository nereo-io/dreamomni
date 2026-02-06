import { NextRequest, NextResponse } from "next/server";
import { CreditDistributionService } from "@/services/creditDistributionService";

export const runtime = "nodejs";
export const maxDuration = 300; // 5分钟

/**
 * Vercel Cron Job: 每天执行积分发放
 *
 * 调用方式：
 * - Vercel Cron: 自动调用（需要配置 vercel.json）
 * - 手动测试: GET /api/cron/distribute-credits?secret=YOUR_CRON_SECRET
 */
export async function GET(request: NextRequest) {
  try {
    // 验证 Cron Secret（防止未授权访问）
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret) {
      const expectedAuth = `Bearer ${cronSecret}`;
      if (authHeader !== expectedAuth) {
        console.error("❌ Unauthorized cron request");
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    console.log("🚀 Starting credit distribution cron job...");

    // 执行积分发放
    const result = await CreditDistributionService.processAllPendingDistributions();

    console.log(`✅ Credit distribution completed:`, result);

    return NextResponse.json({
      success: true,
      message: "Credit distribution completed",
      result,
    });

  } catch (error: any) {
    console.error("❌ Cron job failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
