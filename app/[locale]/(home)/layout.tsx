import { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Sidebar } from "@/components/blocks/home-layout/sidebar";
import { AIVideoHeader } from "@/components/blocks/home-layout/header";
import Footer from "@/components/blocks/footer";

interface HomeLayoutProps {
  children: ReactNode;
}

export default function HomeLayout({ children }: HomeLayoutProps) {
  const t = useTranslations('layout')
  
  return (
    <div className="min-h-screen bg-gray-950">
      <Sidebar />

      <div className="md:ml-64">
        <AIVideoHeader />

        <main className="p-6 pt-20">{children}</main>
        <Footer
          footer={{
            copyright: t('copyright'),
          }}
        />
      </div>
    </div>
  );
}
