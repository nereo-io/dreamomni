import { checkMembershipStatus } from "@/services/membership";
import { respData, respErr } from "@/lib/resp";

export async function GET() {
  try {
    const result = await checkMembershipStatus();
    return respData(result);
  } catch (error) {
    console.error("Check membership status failed:", error);
    return respErr("检查会员状态失败");
  }
} 