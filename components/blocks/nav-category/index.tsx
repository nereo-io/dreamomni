import React from "react";
import Link from "next/link";
import {
  getAllCategoriesMetadata,
  CategoryMetadata,
  CategoryIcons,
} from "@/types/category-enum";

export const NavCategory = () => {
  return (
    <div className="relative mb-12 max-w-3xl mx-auto overflow-hidden">
      <div className="flex overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
        <div className="flex justify-between px-4 min-w-full">
          {getAllCategoriesMetadata().map((category: CategoryMetadata) => {
            // 获取对应的图标组件
            const IconComponent = CategoryIcons[category.key];

            return (
              <Link
                href={`/resources/${category.key}`}
                key={category.name}
                className="flex-shrink-0 snap-center"
              >
                <div className="flex flex-col items-center w-16 ">
                  <div className="bg-card hover:bg-muted rounded-full p-2 mb-2 w-12 h-12 flex items-center justify-center text-gray-700 dark:text-gray-200">
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 text-center whitespace-nowrap">
                    {category.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
