import ChatInterface from "@/components/readers/ChatInterface";
import { getAiReaderInfo } from "@/services/readers/aiReaderInfo";
import { getChatPage } from "@/services/page";
import SurveyBanner from "@/components/blocks/survey-banner";
export const runtime = "edge";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}`;
  }

  return {
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function CustomerChat({
  params,
}: {
  params: { locale: string; chatId: string };
}) {
  const { locale, chatId } = params;

  const [aiReader, messages] = await Promise.all([
    getAiReaderInfo("destiny", locale),
    getChatPage(locale),
  ]);

  return (
    <div className="bg-gradient-to-b from-[#f8f9fa] to-white">
      <ChatInterface
        aiReader={aiReader}
        lomessages={messages}
        locale={locale}
        chatId={chatId}
      />
      <SurveyBanner />
    </div>
  );
}
