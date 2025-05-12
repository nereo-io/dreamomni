import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import { getProductOriginalPath } from "@/models/product";
import {
  verifyUserProductPurchase,
  recordProductDownload,
} from "@/models/purchase";
import { getSupabaseClient } from "@/models/db";
import { getUserUuid } from "@/services/user";
import { locale } from "moment";

/**
 * 获取图片商品下载链接
 * @route GET /api/products/[productId]/download
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    // 1. 验证用户身份
    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("需要登录");
    }

    // 2. 验证productId
    const { productId } = params;
    if (!productId) {
      return respErr("商品ID不能为空");
    }

    console.log(`处理下载请求: 商品ID=${productId}`);

    // 3. 验证用户是否已购买该商品
    const hasPurchased = await verifyUserProductPurchase(user_uuid, productId);
    if (!hasPurchased) {
      return respErr("您尚未购买此商品或下载权限已过期");
    }

    // 4. 获取商品原图路径
    const imagePath = await getProductOriginalPath(productId);
    if (!imagePath) {
      return respErr("商品不存在或已被删除");
    }

    // 5. 生成签名URL
    const supabase = getSupabaseClient();
    const expiresIn = 3600; // 链接有效期，单位：秒
    const { data, error } = await supabase.storage
      .from("product-originals")
      .createSignedUrl(imagePath, expiresIn);

    if (error || !data) {
      console.error(`[调试] 生成下载链接失败 error:`, error);
      return respErr("生成下载链接失败");
    }

    // 返回下载链接，而不是重定向
    return respData({
      download_url: data.signedUrl,
      file_name: imagePath.split("/").pop() || "download.png",
      expires_in: expiresIn,
    });
  } catch (error) {
    console.error(`获取图片下载链接失败:`, error);
    return respErr("获取下载链接失败");
  }
}
