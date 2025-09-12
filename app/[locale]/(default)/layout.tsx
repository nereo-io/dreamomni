import Footer from "@/components/blocks/footer";
import Header from "@/components/blocks/header";
import { ReactNode } from "react";
import { getLandingPage } from "@/services/page";
import { getHotEffectConfigs } from "@/models/effectConfig";
import { getTranslations } from "next-intl/server";

export default async function DefaultLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const page = await getLandingPage(locale);
  const t = await getTranslations();
  
  // Fetch hot effects for footer
  const hotEffects = await getHotEffectConfigs(locale, 5);
  
  // Add effects to footer if footer exists
  if (page.footer) {
    page.footer.effects = {
      title: t("footer.popularEffects"),
      items: hotEffects.map(effect => ({
        title: effect.title,
        slug: effect.slug
      })),
      moreText: t("footer.moreEffects"),
      moreUrl: "/video-effects"
    };
  }

  return (
    <>
      {page.header && <Header header={page.header} />}
      <main className="overflow-x-hidden">{children}</main>
      {page.footer && <Footer footer={page.footer} />}
    </>
  );
}
