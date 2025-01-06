import "@/app/globals.css";

import { MdOutlineHome } from "react-icons/md";
import { Metadata } from "next";
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

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div>
          <a className="text-base-content cursor-pointer" href="/">
            <MdOutlineHome className="text-2xl mx-8 my-8" />
            {/* <img className="w-10 h-10 mx-4 my-4" src="/logo.png" /> */}
          </a>
          <div className="max-w-3xl mx-auto leading-loose pt-4 pb-8 px-8">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
