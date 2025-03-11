import React from "react";
import * as Ri from "react-icons/ri";

// 命理类别枚举 - 只包含简单的常量值
export enum CategoryEnum {
  LOVE = "love",
  CAREER = "career",
  HEALTH = "health",
  CHINESE_ZODIAC = "chinese-zodiac",
  ZODIAC_FORECAST = "2025-forecast",
}

// 图标映射，提供图标组件引用
export const CategoryIcons = {
  [CategoryEnum.LOVE]: Ri.RiHeartLine,
  [CategoryEnum.CAREER]: Ri.RiBriefcaseLine,
  [CategoryEnum.HEALTH]: Ri.RiHeartPulseLine,
  [CategoryEnum.CHINESE_ZODIAC]: Ri.RiStarLine,
  [CategoryEnum.ZODIAC_FORECAST]: Ri.RiCalendarLine,
};

// 类别的元数据类型
export type CategoryMetadata = {
  name: string;
  key: CategoryEnum;
};

// 获取类别元数据
export const getCategoryMetadata = (
  category: CategoryEnum
): CategoryMetadata => {
  switch (category) {
    case CategoryEnum.LOVE:
      return {
        name: "Love",
        key: CategoryEnum.LOVE,
      };
    case CategoryEnum.CAREER:
      return {
        name: "Career",
        key: CategoryEnum.CAREER,
      };
    case CategoryEnum.HEALTH:
      return {
        name: "Health",
        key: CategoryEnum.HEALTH,
      };
    case CategoryEnum.ZODIAC_FORECAST:
      return {
        name: "2025",
        key: CategoryEnum.ZODIAC_FORECAST,
      };
    case CategoryEnum.CHINESE_ZODIAC:
      return {
        name: "Zodiac",
        key: CategoryEnum.CHINESE_ZODIAC,
      };
    default:
      throw new Error(`未知的类别: ${category}`);
  }
};

// 获取所有类别元数据
export const getAllCategoriesMetadata = (): CategoryMetadata[] => {
  return Object.values(CategoryEnum).map((category) =>
    getCategoryMetadata(category as CategoryEnum)
  );
};
