import "@/app/globals.css";
import "./legal.css";

import { MdOutlineHome } from "react-icons/md";
import { Metadata } from "next";
import React from "react";
import { getTranslations } from "next-intl/server";
import localFont from "next/font/local";
import { Fraunces } from "next/font/google";
import { cn } from "@/lib/utils";

const fontSans = localFont({
  src: [
    {
      path: "../../public/fonts/outfit/Outfit-Regular.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/outfit/Outfit-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/outfit/Outfit-Regular.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/outfit/Outfit-Regular.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/outfit/Outfit-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/outfit/Outfit-Bold.ttf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
  preload: true,
  fallback: ["Inter", "Helvetica", "Arial", "sans-serif"],
});

const fontSerif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

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
    <html lang="en" className="dark">
      <body
        className={cn(
          "min-h-screen bg-gray-950 font-sans antialiased overflow-x-hidden",
          fontSans.variable,
          fontSerif.variable
        )}
      >
        <div>
          <a
            className="text-base-content cursor-pointer hover:opacity-80 transition-opacity"
            href="/"
          >
            <MdOutlineHome className="text-2xl mx-8 my-8" />
            {/* <img className="w-10 h-10 mx-4 my-4" src="/logo.png" /> */}
          </a>
          <div className="legal-markdown max-w-3xl mx-auto pt-4 pb-8 px-8">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
