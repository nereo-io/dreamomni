import { getUserLeftCredits } from "@/models/credit";
import { respData, respErr, respJson } from "@/lib/resp";
import { getUserUuid } from "@/services/user";

export async function GET() {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-1, "no auth");
    }

    // Get user left credits
    const credits = await getUserLeftCredits(user_uuid);
    // console.log("credits", credits);

    // 直接返回积分值
    return respData({ credits });
  } catch (error) {
    console.error("Failed to get user credits:", error);
    return respErr("Internal server error");
  }
}
