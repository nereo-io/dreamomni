import Pricing from "@/components/blocks/pricing";
import { getPricingBlock } from "@/services/page";
import { getTranslations } from "next-intl/server";
import Crumb from "@/components/blocks/crumb";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/pricing`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/pricing`;
  }

  return {
    title: t("pricing.title"),
    description: t("pricing.description"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function PricingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const pricing = await getPricingBlock(locale);

  return (
    <>
      <div className="container mx-auto px-4">
        <Crumb
          items={[
            { title: "home", url: "/" },
            { title: "pricing", url: `/pricing` },
          ]}
        />
      </div>
      {pricing && <Pricing pricing={pricing} />}
    </>
  );
}
