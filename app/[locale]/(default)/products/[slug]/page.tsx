import { notFound } from "next/navigation";
import { getProductsPage } from "@/services/page";
import { getProductDetailsBySlug } from "@/models/product";
import { ImageProduct } from "@/types/img-product";
import ProductDetail from "@/components/products/product-detail";
import { getTranslations } from "next-intl/server";

// 格式化价格
function formatPrice(price: number, currency: string) {
  // 价格单位转换，DB存储为分
  const actualPrice = price / 100;

  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: currency || "CNY",
    minimumFractionDigits: 0,
  }).format(actualPrice);
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const product = await getProductDetailsBySlug(params.slug);

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/products/${params.slug}`;

  if (params.locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${params.locale}/products/${params.slug}`;
  }

  return {
    title: product?.name,
    description: product?.description,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string; locale: string };
}) {
  const translations = await getProductsPage(params.locale);
  const product = await getProductDetailsBySlug(params.slug);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} translations={translations} />;
}
