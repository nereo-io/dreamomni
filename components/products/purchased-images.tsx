"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  UserPurchasedImagesResponse,
  PurchasedImageProduct,
} from "@/types/img-product";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";

interface PurchasedImagesProps {
  translations: {
    title?: string;
    noPurchases?: string;
    downloadOriginal?: string;
    downloading?: string;
    expiresOn?: string;
  };
}

export default function PurchasedImages({
  translations,
}: PurchasedImagesProps) {
  const [purchasedImages, setPurchasedImages] = useState<
    PurchasedImageProduct[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingIds, setDownloadingIds] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total_items: 0,
    total_pages: 0,
  });

  // 获取用户已购买的图片列表
  useEffect(() => {
    const fetchPurchasedImages = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/products/purchased?page=${pagination.page}&limit=${pagination.limit}`
        );
        const data = await response.json();

        if (data.code === 0) {
          const result = data.data as UserPurchasedImagesResponse;
          setPurchasedImages(result.data);
          setPagination(result.pagination);
        } else {
          console.error("获取已购买图片失败:", data.message);
        }
      } catch (error) {
        console.error("获取已购买图片时出错:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPurchasedImages();
  }, [pagination.page, pagination.limit]);

  // 处理下载操作
  const handleDownload = async (productId: string) => {
    setDownloadingIds((prev) => [...prev, productId]);

    try {
      // 使用fetch获取下载链接
      const response = await fetch(`/api/products/${productId}/download`);
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
        setDownloadingIds((prev) => prev.filter((id) => id !== productId));
      }, 100);
    } catch (error) {
      console.error("下载过程中出错:", error);
      alert("下载失败，请稍后再试");
      setDownloadingIds((prev) => prev.filter((id) => id !== productId));
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    if (!dateString) return "永久有效";

    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (purchasedImages.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">
          {translations.noPurchases || "您还没有购买任何图片"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">
        {translations.title || "我购买的图片"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {purchasedImages.map((item) => (
          <div
            key={item.id}
            className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {/* 图片预览 */}
            <div className="relative aspect-[3/2] w-full">
              {item.product?.preview_url ? (
                <>
                  <Image
                    src={item.product.preview_url}
                    alt={item.product?.name || "购买的图片"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    // 必须添加这个以支持外部URL
                    unoptimized={true}
                  />
                  {/* 添加加载失败的替代显示 */}
                  <div className="hidden error-loading absolute inset-0 bg-gray-200 flex items-center justify-center">
                    <p className="text-gray-500">图片加载失败</p>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                  <p className="text-gray-500">无预览图</p>
                </div>
              )}
            </div>

            {/* 图片信息 */}
            <div className="p-4">
              <h3 className="font-medium mb-2">
                {item.product?.name || "未命名图片"}
              </h3>

              <div className="text-sm text-gray-500 mb-4">
                <p>购买时间: {formatDate(item.purchase_time)}</p>
                {item.access_expires_at && (
                  <p>
                    {translations.expiresOn || "有效期至"}:{" "}
                    {formatDate(item.access_expires_at)}
                  </p>
                )}
              </div>

              {/* 下载按钮 */}
              <Button
                onClick={() => handleDownload(item.product_id)}
                disabled={downloadingIds.includes(item.product_id)}
                className="w-full"
                variant="outline"
              >
                {downloadingIds.includes(item.product_id) ? (
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
            </div>
          </div>
        ))}
      </div>

      {/* 分页控件 (如果有多页) */}
      {pagination.total_pages > 1 && (
        <div className="flex justify-center mt-8 space-x-2">
          {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map(
            (page) => (
              <button
                key={page}
                onClick={() => setPagination((prev) => ({ ...prev, page }))}
                className={`px-4 py-2 rounded ${
                  pagination.page === page
                    ? "bg-primary text-primary-foreground"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {page}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
