import Footer from "@/components/blocks/footer";
import Header from "@/components/blocks/header";
import { ReactNode } from "react";
import { getLandingPage } from "@/services/page";
import {
  buildDreamOmniFooter,
  buildDreamOmniHeader,
} from "@/config/dreamomni-footer";

export default async function DefaultLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const page = await getLandingPage(locale);

  if (page.footer) {
    page.footer = buildDreamOmniFooter(page.footer, locale);
  }

  return (
    <>
      {page.header && <Header header={buildDreamOmniHeader(page.header)} />}
      <main className="overflow-x-hidden">{children}</main>
      {page.footer && <Footer footer={page.footer} />}
    </>
  );
}
