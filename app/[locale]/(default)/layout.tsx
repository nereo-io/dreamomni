import Footer from "@/components/blocks/footer";
import Header from "@/components/blocks/header";
import { ReactNode } from "react";
import { getLandingPage } from "@/services/page";
import { getHotEffectConfigs } from "@/models/effectConfig";
import { unstable_cache } from "next/cache";
import { getTranslations } from "next-intl/server";
import { buildGeminiOmniFooter } from "@/config/geminiomni-footer";

const getCachedHotEffectConfigs = unstable_cache(
  async (locale: string) => {
    try {
      return await getHotEffectConfigs(locale, 5);
    } catch (error) {
      console.warn("Failed to load hot effect configs:", error);
      return [];
    }
  },
  ["default-layout-hot-effects"],
  { revalidate: 3600 }
);

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
  const hotEffects = await getCachedHotEffectConfigs(locale);
  
  // Add effects to footer if footer exists
  if (page.footer) {
    page.footer = buildGeminiOmniFooter(page.footer);
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
