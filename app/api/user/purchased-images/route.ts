import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import { getUserPurchasedImages } from "@/models/purchase";
import { getUserUuid } from "@/services/user";

/**
 * 获取用户已购买的图片列表
 * @route GET /api/user/purchased-images
 */
export async function GET(req: NextRequest) {
  try {
    // 1. 验证用户身份
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("需要登录");
    }

    // 2. 获取查询参数
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // 验证分页参数
    if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1 || limit > 50) {
      return respErr("无效的分页参数");
    }

    // 3. 查询用户已购买的图片列表
    const purchasedImages = await getUserPurchasedImages(
      user_uuid,
      page,
      limit
    );

    // 4. 返回数据
    return respData(purchasedImages);
  } catch (error) {
    console.error(`获取用户已购买图片列表失败:`, error);
    return respErr("获取已购图片列表失败");
  }
}
