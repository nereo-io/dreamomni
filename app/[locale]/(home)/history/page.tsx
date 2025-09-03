import MyCreationsPage from "@/components/blocks/my-creations-page";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Loader2 } from "lucide-react";

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
  };
}

export default function MyCreationsHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        </div>
      }
    >
      <MyCreationsPage />
    </Suspense>
  );
}
