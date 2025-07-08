import { ReactNode } from "react";
import { Sidebar } from "@/components/blocks/home-layout/sidebar";
import { AIVideoHeader } from "@/components/blocks/home-layout/header";
import Footer from "@/components/blocks/footer";
import { getLandingPage } from "@/services/page";

interface HomeLayoutProps {
  children: ReactNode;
  params: {
    locale: string;
  };
}

export default async function HomeLayout({ children, params: { locale } }: HomeLayoutProps) {
  const page = await getLandingPage(locale);
  
  return (
    <div className="min-h-screen bg-gray-950">
      <Sidebar />

      <div className="md:ml-64">
        <AIVideoHeader />

        <main className="p-6 pt-20">{children}</main>
        {page.footer && <Footer footer={page.footer} />}
      </div>
    </div>
  );
}
