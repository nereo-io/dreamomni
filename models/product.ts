import { getSupabaseClient } from "@/models/db";
import { ImageProduct } from "@/types/img-product";

/**
 * 获取所有图片商品列表
 * @returns 图片商品列表
 */
export async function getProductsList(locale: string): Promise<ImageProduct[]> {
  try {
    const supabase = getSupabaseClient();
    if (!(locale === "zh" || locale === "en")) {
      locale = "en";
    }

    const { data, error } = await supabase
      .from("image_products")
      .select("*")
      .eq("status", "active")
      .eq("locale", locale)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("获取图片商品列表失败:", error);
      throw error;
    }

    // 构建预览URL
    const products = data.map((product: ImageProduct) => {
      if (!product.watermarked_image_storage_path) {
        return product;
      }

      const preview_url = supabase.storage
        .from("product-watermarked")
        .getPublicUrl(product.watermarked_image_storage_path).data.publicUrl;

      return {
        ...product,
        preview_url,
      };
    });

    return products;
  } catch (error) {
    console.error("获取图片商品列表时出错:", error);
    throw error;
  }
}

/**
 * 根据ID获取图片商品详情
 * @param productId 图片商品ID
 * @returns 图片商品详情
 */
export async function getProductDetailsById(
  productId: string
): Promise<ImageProduct> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("image_products")
      .select("*")
      .eq("id", productId)
      .eq("status", "active")
      .single();

    if (error) {
      console.error(`获取图片商品 ${productId} 详情失败:`, error);
      throw error;
    }

    if (!data) {
      throw new Error("图片商品不存在");
    }

    // 构建水印大图URL
    const preview_url = supabase.storage
      .from("product-watermarked")
      .getPublicUrl(data.watermarked_image_storage_path).data.publicUrl;

    return {
      ...data,
      preview_url,
    };
  } catch (error) {
    console.error(`获取图片商品 ${productId} 详情时出错:`, error);
    throw error;
  }
}

/**
 * 根据商品ID获取原图路径
 * @param productId 图片商品ID
 * @returns 原图存储路径
 */
export async function getProductOriginalPath(
  productId: string
): Promise<string> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("image_products")
      .select("image_storage_path")
      .eq("id", productId)
      .single();

    if (error) {
      console.error(`获取图片商品 ${productId} 原图路径失败:`, error);
      throw error;
    }

    if (!data || !data.image_storage_path) {
      throw new Error("图片原文件路径不存在");
    }

    return data.image_storage_path;
  } catch (error) {
    console.error(`获取图片商品 ${productId} 原图路径时出错:`, error);
    throw error;
  }
}

/**
 * 根据Slug获取图片商品详情
 * @param slug 图片商品Slug
 * @returns 图片商品详情
 */
export async function getProductDetailsBySlug(
  slug: string
): Promise<ImageProduct> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("image_products")
      .select("*")
      .eq("slug", slug)
      .eq("status", "active")
      .single();

    if (error) {
      console.error(`获取图片商品 slug: ${slug} 详情失败:`, error);
      throw error;
    }

    if (!data) {
      throw new Error("图片商品不存在");
    }

    // 构建水印大图URL
    const preview_url = supabase.storage
      .from("product-watermarked")
      .getPublicUrl(data.watermarked_image_storage_path).data.publicUrl;

    return {
      ...data,
      preview_url,
    };
  } catch (error) {
    console.error(`获取图片商品 slug: ${slug} 详情时出错:`, error);
    throw error;
  }
}
