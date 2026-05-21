import Footer from "@/components/blocks/footer";
import Header from "@/components/blocks/header";
import { ReactNode } from "react";
import { getLandingPage } from "@/services/page";
import {
  buildGeminiOmniFooter,
  buildGeminiOmniHeader,
} from "@/config/geminiomni-footer";

export default async function DefaultLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const page = await getLandingPage(locale);

  if (page.footer) {
    page.footer = buildGeminiOmniFooter(page.footer, locale);
  }

  return (
    <>
      {page.header && <Header header={buildGeminiOmniHeader(page.header)} />}
      <main className="overflow-x-hidden">{children}</main>
      {page.footer && <Footer footer={page.footer} />}
    </>
  );
}
