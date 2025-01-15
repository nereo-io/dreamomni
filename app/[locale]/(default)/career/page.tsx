import Feature from "@/components/blocks/feature";
import Feature3 from "@/components/blocks/feature3";
import QuestionSelector from "@/components/blocks/question-selector";
import { getCareerPage } from "@/services/page";

export default async function CareerPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const page = await getCareerPage(locale);

  const handleSubmit = async (question: string) => {
    'use server';
    // TODO: 处理问题提交
    console.log("Submitted question:", question);
  };

  return (
    <main>
      <QuestionSelector {...page.questionSelector} onSubmit={handleSubmit} />
      {page.valueProps && <Feature section={page.valueProps} />}
      {page.howItWorks && <Feature3 section={page.howItWorks} />}
    </main>
  );
}