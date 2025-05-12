import { Metadata } from "next";
import { getProductsPage } from "@/services/page";
import PurchasedImages from "@/components/products/purchased-images";
import { notFound } from "next/navigation";

interface PurchasedImagesPageProps {
  params: {
    locale: string;
  };
}

export async function generateMetadata({
  params,
}: PurchasedImagesPageProps): Promise<Metadata> {
  try {
    const translations = await getProductsPage(params.locale);
    return {
      title: translations.myPurchasedImages || "我购买的图片",
      description:
        translations.myPurchasedImagesDescription ||
        "查看和下载您购买的无水印原图",
    };
  } catch (error) {
    console.error(
      "Error generating metadata for purchased images page:",
      error
    );
    return {
      title: "My Purchased Images",
      description:
        "View and download your purchased watermark-free original images",
    };
  }
}

export default async function PurchasedImagesPage({
  params,
}: PurchasedImagesPageProps) {
  // 获取翻译
  let translations;
  try {
    translations = await getProductsPage(params.locale);
  } catch (error) {
    console.error("Failed to load translations:", error);
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <PurchasedImages
        translations={{
          title: translations.myPurchasedImages,
          noPurchases: translations.noPurchasedImages,
          downloadOriginal: translations.downloadOriginal,
          downloading: translations.downloading,
          expiresOn: translations.expiresOn,
        }}
      />
    </main>
  );
}
