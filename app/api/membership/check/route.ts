import { checkMembershipStatus } from "@/services/membership";
import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await checkMembershipStatus(session.user);
    
    // 添加缓存控制头，减少重复查询
    const response = respData(result);
    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=600',
        // 缓存5分钟，过期后10分钟内仍可使用旧数据
      },
    });
  } catch (error) {
    console.error("Check membership status failed:", error);
    return respErr("检查会员状态失败");
  }
} 