"use client";

import { ReactNode, useEffect, useState } from "react";
import { Sidebar } from "@/components/blocks/home-layout/sidebar";
import { AIVideoHeader } from "@/components/blocks/home-layout/header";
import { SidebarProvider, useSidebar } from "@/contexts/sidebar";
import Footer from "@/components/blocks/footer";
import { LandingPage } from "@/types/pages/landing";
import { useSession } from "next-auth/react";
import { buildGeminiOmniFooter } from "@/config/geminiomni-footer";

interface HomeLayoutProps {
  children: ReactNode;
  params: {
    locale: string;
  };
}

function HomeLayoutContent({
  children,
  footer
}: {
  children: ReactNode;
  footer?: LandingPage['footer'];
}) {
  const { isCollapsed } = useSidebar();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-950">
      <Sidebar />

      <div
        className={`transition-all duration-300 ${
          isCollapsed ? "md:ml-16" : "md:ml-56"
        }`}
      >
        <AIVideoHeader />

        <main className={`px-2 pt-[78px] ${session ? 'pb-0' : 'py-6'}`}>
          {children}
        </main>

        {footer && !session && <Footer footer={footer} />}
      </div>
    </div>
  );
}

export default function HomeLayout({
  children,
  params: { locale },
}: HomeLayoutProps) {
  const [footer, setFooter] = useState<LandingPage['footer']>();

  useEffect(() => {
    async function loadFooter() {
      try {
        const { getLandingPage } = await import("@/services/page");
        const page = await getLandingPage(locale);
        setFooter(page.footer ? buildGeminiOmniFooter(page.footer, locale) : undefined);
      } catch (error) {
        console.error("Failed to load footer:", error);
      }
    }
    loadFooter();
  }, [locale]);

  return (
    <SidebarProvider>
      <HomeLayoutContent footer={footer}>{children}</HomeLayoutContent>
    </SidebarProvider>
  );
}
