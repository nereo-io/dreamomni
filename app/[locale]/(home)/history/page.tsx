import MyCreationsPage from "@/components/blocks/my-creations-page";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/history`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/history`;
  }

  return {
    title: t("myCreations.title"),
    description: t("myCreations.description"),
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function MyCreationsHistoryPage() {
  return <MyCreationsPage />;
}
