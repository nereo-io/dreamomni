import VideoHistoryPageClient from "@/components/blocks/video-history-page";
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
    title: t("history.title"),
    description: t("history.description"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default function VideoHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        </div>
      }
    >
      <VideoHistoryPageClient />
    </Suspense>
  );
}
