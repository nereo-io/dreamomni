import { Metadata } from "next";
import FeedbackForm from "@/components/blocks/feedback-form";
import { getFeedbackFormBlock } from "@/services/page";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/feedback`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/feedback`;
  }

  return {
    title: t("feedback.title") || "用户反馈 - BaziAI",
    description:
      t("feedback.description") ||
      "提交您对 BaziAI 的反馈、建议或问题，帮助我们改进产品和服务。",
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function FeedbackPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  // 获取反馈表单国际化翻译
  const feedbackFormTranslations = await getFeedbackFormBlock(locale);

  // 设置紧急联系邮箱
  const urgentEmail = "jasper@bazi-ai.com";

  return (
    <main className="container mx-auto py-8">
      <FeedbackForm
        translations={feedbackFormTranslations}
        urgentEmail={urgentEmail}
      />
    </main>
  );
}
