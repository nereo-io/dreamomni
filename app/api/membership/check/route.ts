import { checkMembershipStatus } from "@/services/membership";
import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await checkMembershipStatus(session.user);
    return respData(result);
  } catch (error) {
    console.error("Check membership status failed:", error);
    return respErr("检查会员状态失败");
  }
} 