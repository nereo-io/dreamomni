import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import { verifyUserProductPurchase } from "@/models/purchase";
import { getUserUuid } from "@/services/user";

/**
 * 检查用户是否已购买特定商品
 * @route GET /api/products/[productId]/purchase-status
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    // 1. 验证用户身份
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      // 未登录用户直接返回未购买状态
      return respData({ purchased: false });
    }

    // 2. 获取商品ID
    const { productId } = params;
    if (!productId) {
      return respErr("商品ID不能为空");
    }

    console.log(`检查购买状态: 商品ID=${productId}`);

    // 3. 验证用户是否已购买该商品
    const hasPurchased = await verifyUserProductPurchase(user_uuid, productId);

    // 4. 返回购买状态
    return respData({
      purchased: hasPurchased,
    });
  } catch (error) {
    console.error(`检查购买状态失败:`, error);
    return respErr("检查购买状态失败");
  }
}
