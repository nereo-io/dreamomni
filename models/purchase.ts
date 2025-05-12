import { getSupabaseClient } from "@/models/db";
import { PurchasedImageProduct } from "@/types/img-product";

/**
 * 创建图片商品购买记录
 * @param purchaseData 购买记录数据
 * @returns 创建的购买记录
 */
export async function createProductPurchaseRecord(
  purchaseData: Partial<PurchasedImageProduct>
): Promise<PurchasedImageProduct | null> {
  try {
    if (
      !purchaseData.product_id ||
      !purchaseData.user_uuid ||
      !purchaseData.order_id
    ) {
      console.error("创建购买记录失败: 缺少必要字段");
      return null;
    }

    const supabase = getSupabaseClient();

    // 检查是否已存在购买记录（防止重复处理）
    const { data: existingRecord, error: checkError } = await supabase
      .from("user_purchased_images")
      .select("id")
      .eq("product_id", purchaseData.product_id)
      .eq("user_uuid", purchaseData.user_uuid)
      .eq("order_id", purchaseData.order_id)
      .maybeSingle();

    if (checkError) {
      console.error("检查图片购买记录时出错:", checkError);
      throw checkError;
    }

    // 如果已存在购买记录，则返回该记录ID
    if (existingRecord) {
      console.log("图片购买记录已存在，跳过创建:", existingRecord.id);
      return existingRecord as PurchasedImageProduct;
    }

    // 创建新的购买记录
    const { data, error } = await supabase
      .from("user_purchased_images")
      .insert(purchaseData)
      .select()
      .single();

    if (error) {
      console.error("创建图片购买记录失败:", error);
      throw error;
    }

    console.log("图片购买记录创建成功:", data);
    return data;
  } catch (error) {
    console.error("处理图片商品购买时出错:", error);
    throw error;
  }
}

/**
 * 验证用户是否已购买指定图片商品
 * @param user_uuid 用户UUID
 * @param productId 图片商品ID
 * @returns 布尔值，表示用户是否已购买该商品
 */
export async function verifyUserProductPurchase(
  user_uuid: string,
  productId: string
): Promise<boolean> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("user_purchased_images")
      .select("id")
      .eq("user_uuid", user_uuid)
      .eq("product_id", productId)
      .maybeSingle();

    if (error) {
      console.error(`验证用户 ${user_uuid} 购买商品 ${productId} 失败:`, error);
      throw error;
    }

    return !!data; // 如果找到记录，则返回true，否则返回false
  } catch (error) {
    console.error(`验证用户购买时出错:`, error);
    throw error;
  }
}

/**
 * 记录用户下载图片
 * @param purchaseId 购买记录ID
 * @returns 更新后的购买记录
 */
export async function recordProductDownload(
  purchaseId: string
): Promise<PurchasedImageProduct> {
  try {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("user_purchased_images")
      .update({
        download_count: supabase.rpc("increment_download_count", {
          row_id: purchaseId,
        }),
        last_download_time: now,
      })
      .eq("id", purchaseId)
      .select()
      .single();

    if (error) {
      console.error(`更新下载记录 ${purchaseId} 失败:`, error);
      throw error;
    }

    return data as PurchasedImageProduct;
  } catch (error) {
    console.error(`记录下载统计时出错:`, error);
    throw error;
  }
}

/**
 * 获取用户已购买的图片商品列表
 * @param user_uuid 用户UUID
 * @param page 页码，默认为1
 * @param limit 每页条数，默认为10
 * @returns 已购买图片列表及分页信息
 */
export async function getUserPurchasedImages(
  user_uuid: string,
  page: number = 1,
  limit: number = 10
): Promise<{
  data: PurchasedImageProduct[];
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  };
}> {
  try {
    const supabase = getSupabaseClient();
    const offset = (page - 1) * limit;

    // 获取总记录数
    const { count, error: countError } = await supabase
      .from("user_purchased_images")
      .select("*", { count: "exact", head: true })
      .eq("user_uuid", user_uuid);

    if (countError) {
      console.error(`获取用户 ${user_uuid} 已购图片总数失败:`, countError);
      throw countError;
    }

    // 获取分页数据，并关联产品信息
    const { data, error } = await supabase
      .from("user_purchased_images")
      .select(
        `
        *,
        product:product_id (
          id,
          name,
          description,
          price,
          currency,
          type,
          watermarked_image_storage_path,
          tags,
          slug,
          status
        )
      `
      )
      .eq("user_uuid", user_uuid)
      .order("purchase_time", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error(`获取用户 ${user_uuid} 已购图片列表失败:`, error);
      throw error;
    }

    // 处理产品预览URL
    const purchasedImages = data.map((item: any) => {
      // 如果product存在且有水印图路径
      if (item.product && item.product.watermarked_image_storage_path) {
        // 使用Supabase的getPublicUrl方法获取URL，而不是直接拼接
        const preview_url = supabase.storage
          .from("product-watermarked")
          .getPublicUrl(item.product.watermarked_image_storage_path)
          .data.publicUrl;

        item.product.preview_url = preview_url;

        // 添加调试日志
        console.log("构建预览URL:", {
          path: item.product.watermarked_image_storage_path,
          url: preview_url,
        });
      }

      return item as PurchasedImageProduct;
    });

    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: purchasedImages,
      pagination: {
        page,
        limit,
        total_items: totalItems,
        total_pages: totalPages,
      },
    };
  } catch (error) {
    console.error(`获取用户已购图片列表时出错:`, error);
    throw error;
  }
}
