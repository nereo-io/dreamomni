"use client";

import { Pricing as PricingType } from "@/types/blocks/pricing";
import EnhancedPricing from "./enhanced-pricing";

export default function Pricing({ pricing }: { pricing: PricingType }) {
  // 使用新的增强版定价组件，支持多支付方式
  return <EnhancedPricing pricing={pricing} />;
}
