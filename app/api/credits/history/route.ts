import { getCreditsByUserUuid } from "@/models/credit";
import { respData, respJson } from "@/lib/resp";
import { getUserUuid } from "@/services/user";

export async function GET(request: Request) {
  try {
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respJson(-1, "no auth");
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");

    const credits = await getCreditsByUserUuid(user_uuid, 1, limit);

    return respData({ credits: credits || [] });
  } catch (error) {
    console.error("Failed to get credit history:", error);
    return respJson(-1, "Internal server error");
  }
}
