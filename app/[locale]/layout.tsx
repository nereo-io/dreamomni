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
import YandexMetrica from "@/components/analytics/yandex-metrica";
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

  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://www.seedance.tv";
  const title =
    t("metadata.title") ||
    "AI Video Generator - Create 1080p Videos | Seedance";
  const description =
    t("metadata.description") ||
    "Create stunning 1080p videos with AI. Multi-shot storytelling, cinematic quality, diverse styles. Start free today with professional video generation.";

  return {
    title: {
      template: `%s | Seedance`,
      default: title,
    },
    description: description,
    keywords: t("metadata.keywords") || "",
    openGraph: {
      title: title,
      description: description,
      url: locale === "en" ? baseUrl : `${baseUrl}/${locale}`,
      siteName: "Seedance",
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: "Seedance AI Video Generator",
        },
      ],
      locale: locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      site: "@seedance_ai",
      creator: "@seedance_ai",
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

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <StructuredData
          type="organization"
          data={{
            description:
              "Professional AI Video Generator - Create stunning 1080p videos with advanced AI technology",
          }}
        />
        <StructuredData
          type="website"
          data={{
            description:
              "Create stunning 1080p videos with advanced AI technology. Multi-shot storytelling, cinematic quality, and diverse artistic styles.",
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
        <NextIntlClientProvider messages={messages}>
          <NextAuthSessionProvider>
            <AppContextProvider>
              <ThemeProvider attribute="class" disableTransitionOnChange>
                <SignupTracker />
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
