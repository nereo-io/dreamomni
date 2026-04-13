import "@/app/(legal)/legal.css";

import { Metadata } from "next";
import { MdOutlineHome } from "react-icons/md";
import React from "react";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: {
      template: `%s | ${t("metadata.title")}`,
      default: t("metadata.title"),
    },
    description: t("metadata.description"),
    keywords: t("metadata.keywords"),
  };
}

export default function LocalizedLegalLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const homeHref = locale === "en" ? "/" : `/${locale}`;

  return (
    <div>
      <a
        className="text-base-content cursor-pointer hover:opacity-80 transition-opacity"
        href={homeHref}
      >
        <MdOutlineHome className="text-2xl mx-8 my-8" />
      </a>
      <div className="legal-markdown max-w-3xl mx-auto pt-4 pb-8 px-8">
        {children}
      </div>
    </div>
  );
}
