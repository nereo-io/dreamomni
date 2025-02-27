import Hero from "@/components/blocks/hero";
import QuestionSelector from "@/components/blocks/question-selector";
import { getLandingPage, getReaderPage } from "@/services/page";
import { getTranslations } from "next-intl/server";
import { SidebarTrigger } from "@/components/ui/sidebar";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/chat`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/chat`;
  }

  return {
    title: t("chat.title"),
    description: t("chat.description"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function ChatPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const page = await getLandingPage(locale);
  const readerPage = await getReaderPage(locale);

  return (
    <>
      <SidebarTrigger />

      {page.hero && <Hero hero={page.hero} />}
      {page.questionForm && (
        <QuestionSelector
          formMessages={readerPage}
          questionSelector={page.questionForm.questionSelector}
        />
      )}
    </>
  );
}
