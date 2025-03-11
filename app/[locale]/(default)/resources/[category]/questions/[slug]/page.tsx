import Question from "@/components/blocks/question";
import { getQuestionDetail } from "@/models/question";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: { locale: string; slug: string; category: string };
}) {
  const t = await getTranslations();

  const question = await getQuestionDetail(params.slug, params.locale);

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/resources/${params.category}/questions/${params.slug}`;

  if (params.locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${params.locale}/resources/${params.category}/questions/${params.slug}`;
  }

  return {
    title: question?.title,
    description: question?.content,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function QuestionDetailPage({
  params,
}: {
  params: { slug: string; category: string; locale: string };
}) {
  const { slug, category, locale } = params;
  const questionDetail = await getQuestionDetail(slug, locale);

  if (!questionDetail) {
    return <div>问题不存在</div>;
  }

  return <Question questionDetail={questionDetail} />;
}
