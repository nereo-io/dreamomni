"use client";

import Link from "next/link";
import { ArrowUpRight, BadgeDollarSign } from "lucide-react";
import { useTranslations } from "next-intl";

export function AffiliateButton() {
  const t = useTranslations("header");

  return (
    <Link
      href="/affiliate"
      target="_blank"
      rel="noopener noreferrer"
      className="group flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-base text-white/90 transition-colors hover:bg-gray-800 hover:text-white"
    >
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="aff-icon-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b7df8" />
            <stop offset="100%" stopColor="#9333ea" />
          </linearGradient>
        </defs>
      </svg>
      <BadgeDollarSign
        className="h-[18px] w-[18px]"
        style={{ stroke: "url(#aff-icon-gradient)" }}
      />
      <span className="hidden whitespace-nowrap font-medium sm:block">
        {t("affiliate")}
      </span>
      <span className="shrink-0 whitespace-nowrap rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-primary-foreground">
        {t("affiliate_badge")}
      </span>
      <ArrowUpRight className="h-3.5 w-3.5 text-white/40 transition-colors group-hover:text-white/80" />
    </Link>
  );
}
