// import "@/lib/proxy";
import "@/app/globals.css";

import { getMessages, getTranslations } from "next-intl/server";

import { AppContextProvider } from "@/contexts/app";
import { Inter as FontSans } from "next/font/google";
import { Source_Serif_4 as FontSerif } from "next/font/google";
import { Metadata } from "next";
import { NextAuthSessionProvider } from "@/auth/session";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "@/providers/theme";
import { cn } from "@/lib/utils";
import StructuredData from "@/components/seo/structured-data";
import { SignupTracker } from "@/components/analytics/signup-tracker";
import AttributionTracker from "@/components/analytics/attribution-tracker";
import YandexMetrica from "@/components/analytics/yandex-metrica";
import BingUET from "@/components/analytics/bing-uet";
import GoogleAnalytics from "@/components/analytics/google-analytics";
import Plausible from "@/components/analytics/plausible";
import TikTokPixel from "@/components/analytics/tiktok-pixel";
import FirstPromoterTracker from "@/components/analytics/first-promoter-tracker";
import {
  prepareDreamOmniClientMessages,
  sanitizeDreamOmniString,
} from "@/config/dreamomni-messages";
// import { SpeedInsights } from '@vercel/speed-insights/next';
// import { Analytics } from "@vercel/analytics/react";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = FontSerif({
  subsets: ["latin"],
  variable: "--font-serif",
});

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations();

  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://dreamomni.ai";
  const title = sanitizeDreamOmniString(
    t("metadata.title") ||
      "Free Gemini Omni AI Video Generator"
  );
  const description = sanitizeDreamOmniString(
    t("metadata.description") ||
      "Create cinematic AI videos online with DreamOmni. Turn text prompts and images into videos with a free Gemini Omni-style AI video generator."
  );

  return {
    title: {
      template: `%s | DreamOmni`,
      default: title,
    },
    description: description,
    keywords: sanitizeDreamOmniString(t("metadata.keywords") || ""),
    icons: {
      icon: [
        {
          url: "/favicon.ico?v=dreamomni-20260521",
          type: "image/png",
        },
      ],
      shortcut: "/favicon.ico?v=dreamomni-20260521",
      apple: "/favicon.ico?v=dreamomni-20260521",
    },
    alternates: {
      canonical: locale === "en" ? baseUrl : `${baseUrl}/${locale}`,
      languages: {
        "x-default": baseUrl,
        en: baseUrl,
        ru: `${baseUrl}/ru`,
        ja: `${baseUrl}/ja`,
        ko: `${baseUrl}/ko`,
        de: `${baseUrl}/de`,
        fr: `${baseUrl}/fr`,
        es: `${baseUrl}/es`,
        pt: `${baseUrl}/pt`,
      },
    },
    openGraph: {
      title: title,
      description: description,
      url: locale === "en" ? baseUrl : `${baseUrl}/${locale}`,
      siteName: "DreamOmni",
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: "DreamOmni AI Video Generator",
        },
      ],
      locale: locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: [`${baseUrl}/og-image.png`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function RootLayout({
  children,
  params: { locale },
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const messages = await getMessages();
  const clientMessages = prepareDreamOmniClientMessages(messages);

  return (
    <html lang={locale} suppressHydrationWarning className="dark">
      <head>
        <StructuredData
          type="organization"
          data={{
            description:
              "DreamOmni is an independent AI video generator for creating cinematic videos from prompts and images.",
          }}
        />
        <StructuredData
          type="website"
          data={{
            description:
              "Create cinematic AI videos online with DreamOmni's free AI video generator.",
          }}
        />
      </head>
      <body
        className={cn(
          "min-h-screen bg-gray-950 font-sans antialiased overflow-x-hidden",
          fontSans.variable
        )}
      >
        <YandexMetrica />
        <FirstPromoterTracker />
        <GoogleAnalytics />
        <Plausible />
        <BingUET />
        <TikTokPixel />
        <NextIntlClientProvider messages={clientMessages}>
          <NextAuthSessionProvider>
            <AppContextProvider>
              <ThemeProvider attribute="class" disableTransitionOnChange>
                <SignupTracker />
                <AttributionTracker />
                {children}
              </ThemeProvider>
            </AppContextProvider>
          </NextAuthSessionProvider>
        </NextIntlClientProvider>
        {/* <SpeedInsights /> */}
        {/* <Analytics /> */}
      </body>
    </html>
  );
}
