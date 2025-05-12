"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageProduct } from "@/types/img-product";
import { ProductsPageTranslation } from "@/types/pages/products-page";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Loader2, Download, Check } from "lucide-react";

interface ProductDetailProps {
  product: ImageProduct;
  translations: ProductsPageTranslation;
}

// 格式化价格
function formatPrice(price: number, currency: string) {
  // 价格单位转换，DB存储为分
  const actualPrice = price / 100;

  return new Intl.NumberFormat(currency === "CNY" ? "zh-CN" : "en-US", {
    style: "currency",
    currency: currency || "CNY",
    minimumFractionDigits: 0,
  }).format(actualPrice);
}

export default function ProductDetail({
  product,
  translations,
}: ProductDetailProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentCurrency, setPaymentCurrency] = useState<"USD" | "CNY">("USD");
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isCheckingPurchase, setIsCheckingPurchase] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);

  // 计算RMB价格 - 实际应用中可能会有专门的汇率转换或直接从后端获取
  const cnyPrice = Math.round(product.price * 7); // 假设汇率为7

  // 检查用户是否已购买此商品
  useEffect(() => {
    const checkPurchaseStatus = async () => {
      try {
        setIsCheckingPurchase(true);
        const response = await fetch(
          `/api/products/${product.id}/purchase-status`
        );
        const data = await response.json();

        if (data.code === 0 && data.data.purchased) {
          setHasPurchased(true);
        }
      } catch (error) {
        console.error("检查购买状态失败:", error);
      } finally {
        setIsCheckingPurchase(false);
      }
    };

    checkPurchaseStatus();
  }, [product.id]);

  // 处理购买操作
  const handleBuyNow = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: product.id,
          product_name: product.name,
          product_type: "image", // 指定产品类型为图片
          product_slug: product.slug,
          currency: paymentCurrency.toLowerCase(),
          amount: paymentCurrency === "CNY" ? cnyPrice : product.price,
          interval: "one-time", // 一次性付款
          credits: 1, // 购买此商品获得1次下载权限
          valid_months: 12, // 下载权限有效期12个月
          cancel_url: `${process.env.NEXT_PUBLIC_WEB_URL}/products/${product.slug}`,
        }),
      });

      const data = await response.json();
      if (data.code !== 0) {
        throw new Error(data.message || "支付创建失败");
      }

      // 跳转到Stripe支付页面
      const stripe = (window as any).Stripe(data.data.public_key);
      await stripe.redirectToCheckout({
        sessionId: data.data.session_id,
      });
    } catch (error) {
      console.error("支付过程中出错:", error);
      alert("支付失败，请稍后再试");
    } finally {
      setIsLoading(false);
    }
  };

  // 处理下载操作
  const handleDownload = async () => {
    setDownloadLoading(true);
    try {
      // 使用fetch获取下载链接
      const response = await fetch(`/api/products/${product.id}/download`);
      const data = await response.json();

      if (data.code !== 0 || !data.data.download_url) {
        throw new Error(data.message || "获取下载链接失败");
      }

      // 使用更可靠的方法：先获取文件内容，再创建下载
      const fileResponse = await fetch(data.data.download_url);
      if (!fileResponse.ok) {
        throw new Error(
          `下载失败: ${fileResponse.status} ${fileResponse.statusText}`
        );
      }

      // 获取文件内容为Blob
      const blob = await fileResponse.blob();

      // 创建一个blob URL
      const blobUrl = window.URL.createObjectURL(blob);

      // 创建一个隐藏的a标签并点击它来下载文件
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = data.data.file_name || "download.png"; // 使用API返回的文件名
      link.style.display = "none"; // 确保链接不可见
      document.body.appendChild(link);
      link.click();

      // 清理
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl); // 释放blob URL
        setDownloadLoading(false);
      }, 100);
    } catch (error) {
      console.error("下载过程中出错:", error);
      alert("下载失败，请稍后再试");
      setDownloadLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4 flex justify-between items-center">
        <Link href="/products" className="text-primary hover:underline">
          ← {translations.backToProducts}
        </Link>
        <Link
          href="/products/purchased"
          className="text-primary hover:underline flex items-center"
        >
          <Download className="h-4 w-4 mr-1" />
          {translations.myPurchasedImages}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 左侧图片 */}
        <div className="relative aspect-[9/16] w-full md:aspect-auto md:h-[70vh] overflow-hidden rounded-lg bg-gray-100">
          <Image
            src={product.preview_url || "/placeholder-image.jpg"}
            alt={product.name}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10 pointer-events-none"></div>
        </div>

        {/* 右侧信息 */}
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>

          {/* 价格显示和货币切换 */}
          {!hasPurchased && (
            <div className="mt-6 flex items-center">
              <p className="text-2xl font-bold text-primary">
                {formatPrice(
                  paymentCurrency === "CNY" ? cnyPrice : product.price,
                  paymentCurrency
                )}
              </p>

              {/* 货币切换 */}
              <div className="ml-4 flex items-center space-x-2">
                <button
                  onClick={() => setPaymentCurrency("USD")}
                  className={`px-2 py-1 rounded text-xs ${
                    paymentCurrency === "USD"
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  USD
                </button>
                <button
                  onClick={() => setPaymentCurrency("CNY")}
                  className={`px-2 py-1 rounded text-xs ${
                    paymentCurrency === "CNY"
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  CNY
                </button>
              </div>
            </div>
          )}

          <div className="mt-6">
            <p className="text-gray-600">
              {product.description || translations.noDescription}
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {isCheckingPurchase ? (
              // 检查购买状态中
              <Button disabled className="w-full">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {translations.checkingPurchase || "正在检查..."}
              </Button>
            ) : hasPurchased ? (
              // 已购买，显示下载按钮
              <Button
                onClick={handleDownload}
                disabled={downloadLoading}
                className="w-full"
              >
                {downloadLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {translations.downloading || "正在下载..."}
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    {translations.downloadOriginal || "下载原图"}
                  </>
                )}
              </Button>
            ) : (
              // 未购买，显示购买按钮
              <Button
                onClick={handleBuyNow}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {translations.processing}
                  </>
                ) : (
                  translations.buyNow
                )}
              </Button>
            )}
          </div>

          {hasPurchased ? (
            // 已购买状态信息
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center">
              <Check className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-green-700 text-sm">
                {translations.alreadyPurchased ||
                  "您已购买此商品，可随时下载无水印原图"}
              </p>
            </div>
          ) : (
            // 未购买状态提示
            <div className="mt-8 text-sm text-gray-500">
              <p>{translations.watermarkNotice}</p>
              <p className="mt-2">{translations.purchaseNotice}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stripe.js脚本 */}
      <script async src="https://js.stripe.com/v3/"></script>
    </div>
  );
}
