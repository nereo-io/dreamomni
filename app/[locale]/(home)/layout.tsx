"use client";

import { ReactNode } from "react";
import { Sidebar } from "@/components/blocks/home-layout/sidebar";
import { AIVideoHeader } from "@/components/blocks/home-layout/header";
import { SidebarProvider, useSidebar } from "@/contexts/sidebar";

interface HomeLayoutProps {
  children: ReactNode;
  params: {
    locale: string;
  };
}

function HomeLayoutContent({ children }: { children: ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-gray-950">
      <Sidebar />

      <div
        className={`transition-all duration-300 ${
          isCollapsed ? "md:ml-16" : "md:ml-64"
        }`}
      >
        <AIVideoHeader />

        <main className="p-6 pt-[81px]">{children}</main>
      </div>
    </div>
  );
}

export default function HomeLayout({
  children,
  params: { locale },
}: HomeLayoutProps) {
  return (
    <SidebarProvider>
      <HomeLayoutContent>{children}</HomeLayoutContent>
    </SidebarProvider>
  );
}
