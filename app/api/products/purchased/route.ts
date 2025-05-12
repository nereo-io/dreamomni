import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import { getUserUuid } from "@/services/user";
import { getUserPurchasedImages } from "@/models/purchase";

/**
 * 获取用户已购买的图片商品列表
 * @route GET /api/products/purchased
 */
export async function GET(req: NextRequest) {
  try {
    // 1. 验证用户身份
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("需要登录");
    }

    // 2. 获取分页参数
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    // 3. 验证参数
    if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1 || limit > 50) {
      return respErr("无效的分页参数");
    }

    // 4. 查询用户已购买的图片列表
    const purchasedImages = await getUserPurchasedImages(
      user_uuid,
      page,
      limit
    );

    // 5. 返回结果
    return respData(purchasedImages);
  } catch (error) {
    console.error(`获取已购买图片列表失败:`, error);
    return respErr("获取已购买图片列表失败");
  }
}
