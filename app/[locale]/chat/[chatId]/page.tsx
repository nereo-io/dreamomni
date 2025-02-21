import ChatInterface from "@/components/readers/ChatInterface";
import { getAiReaderInfo } from "@/services/readers/aiReaderInfo";
import { getChatPage } from "@/services/page";

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
  params: { locale: string };
}) {
  const { locale } = params;

  const [aiReader, messages] = await Promise.all([
    getAiReaderInfo("destiny", locale),
    getChatPage(locale),
  ]);

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#f8f9fa] to-white">
      <ChatInterface
        aiReader={aiReader}
        lomessages={messages}
        locale={locale}
      />
    </div>
  );
}
