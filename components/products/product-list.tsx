"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductsPageTranslation } from "@/types/pages/products-page";
import { ImageProduct } from "@/types/img-product";

interface ProductListProps {
  products: ImageProduct[];
  allTags: string[];
  translations: ProductsPageTranslation;
}

export default function ProductList({
  products,
  allTags,
  translations,
}: ProductListProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filteredProducts, setFilteredProducts] =
    useState<ImageProduct[]>(products);

  // 当选中的标签变化时，过滤产品
  useEffect(() => {
    if (selectedTags.length === 0) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        (product) =>
          product.tags &&
          Array.isArray(product.tags) &&
          selectedTags.some((tag) => product.tags!.includes(tag))
      );
      setFilteredProducts(filtered);
    }
  }, [selectedTags, products]);

  // 切换标签选中状态
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // 获取价格显示
  const formatPrice = (price: number, currency: string) => {
    // 价格单位转换，DB存储为分
    const actualPrice = price / 100;

    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: currency || "CNY",
      minimumFractionDigits: 0,
    }).format(actualPrice);
  };

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* 标签筛选 */}
      <div className="w-full overflow-x-auto pb-2">
        <div className="flex space-x-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                selectedTags.includes(tag)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 商品网格 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {filteredProducts.map((product) => (
          <Link
            href={`/products/${product.slug}`}
            key={product.id}
            className="group flex flex-col"
          >
            <div className="relative aspect-[9/16] w-full overflow-hidden rounded-lg bg-gray-100">
              <Image
                src={product.preview_url || "/placeholder-image.jpg"}
                alt={product.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
            </div>
            <div className="mt-2">
              <h3 className="text-sm font-medium line-clamp-2">
                {product.name}
              </h3>
              <p className="mt-1 text-sm font-semibold text-primary">
                {formatPrice(product.price, product.currency)}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* 无结果提示 */}
      {filteredProducts.length === 0 && (
        <div className="w-full py-10 text-center text-gray-500">
          {translations.noProductsFound}
        </div>
      )}
    </div>
  );
}
