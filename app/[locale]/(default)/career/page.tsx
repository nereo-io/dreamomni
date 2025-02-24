import Feature3 from "@/components/blocks/feature3";
import QuestionSelector from "@/components/blocks/question-selector";
import { getCareerPage, getReaderPage } from "@/services/page";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations();
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/career`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/career`;
  }

  return {
    title: {
      absolute: t("career.metadata.title"),
    },
    description: t("career.metadata.description"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function CareerPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const [pageData, messages] = await Promise.all([
    getCareerPage(locale),
    getReaderPage(locale),
  ]);

  return (
    <main>
      {/* <QuestionForm 
        messages={messages} 
        questionSelector={pageData.questionSelector} 
      /> */}
      <QuestionSelector
        formMessages={messages}
        questionSelector={pageData.questionSelector}
      />
      {pageData.howItWorks && <Feature3 section={pageData.howItWorks} />}
    </main>
  );
}
