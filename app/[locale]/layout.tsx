// import "@/lib/proxy";
import "@/app/globals.css";

import { getMessages, getTranslations } from "next-intl/server";

import { AppContextProvider } from "@/contexts/app";
import localFont from "next/font/local";
import { Metadata } from "next";
import { NextAuthSessionProvider } from "@/auth/session";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "@/providers/theme";
import { cn } from "@/lib/utils";
import { SignupTracker } from "@/components/analytics/signup-tracker";
import YandexMetrica from "@/components/analytics/yandex-metrica";
// import { SpeedInsights } from '@vercel/speed-insights/next';
// import { Analytics } from "@vercel/analytics/react";

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

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: {
      template: `%s`,
      default: t("metadata.title") || "",
    },
    description: t("metadata.description") || "",
    keywords: t("metadata.keywords") || "",
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
    <html lang={locale} suppressHydrationWarning className="dark">
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
