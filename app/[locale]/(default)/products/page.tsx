import { getProductsPage } from "@/services/page";
import { getProductsList } from "@/models/product";
import { ImageProduct } from "@/types/img-product";
import ProductsPageComponent from "@/components/products/products-page";
import { getTranslations } from "next-intl/server";
// 从产品数据中提取所有唯一标签
function getAllTags(products: ImageProduct[]) {
  const tagsSet = new Set<string>();

  products.forEach((product) => {
    if (product.tags && Array.isArray(product.tags)) {
      product.tags.forEach((tag: string) => {
        tagsSet.add(tag);
      });
    }
  });

  return Array.from(tagsSet);
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/products`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/products`;
  }

  return {
    title: t("products.title"),
    description: t("products.description"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function ProductsPage({
  params,
}: {
  params: { locale: string };
}) {
  const translations = await getProductsPage(params.locale);
  const products = await getProductsList(params.locale);
  const allTags = getAllTags(products);

  return (
    <ProductsPageComponent
      products={products}
      allTags={allTags}
      translations={translations}
    />
  );
}
