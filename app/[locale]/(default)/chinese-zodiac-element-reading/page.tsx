import { getChineseZodiacPage, getReaderPage } from "@/services/page";
import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import Branding from "@/components/blocks/branding";
import CTA from "@/components/blocks/cta";
import FAQ from "@/components/blocks/faq";
import Feature from "@/components/blocks/feature";
import Feature1 from "@/components/blocks/feature1";
import Feature2 from "@/components/blocks/feature2";
import Feature3 from "@/components/blocks/feature3";
import Hero from "@/components/blocks/hero";
import Pricing from "@/components/blocks/pricing";
import Showcase from "@/components/blocks/showcase";
import Stats from "@/components/blocks/stats";
import Testimonial from "@/components/blocks/testimonial";
import QuestionSelector from "@/components/blocks/question-selector";
import { Blog as BlogType } from "@/types/blocks/blog";
import { getPostsByLocale } from "@/models/post";
import BlogBlock from "@/components/blocks/blog-block";
export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations();
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/chinese-zodiac-element-calculator`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/chinese-zodiac-element-calculator`;
  }

  return {
    title: {
      absolute: t("chinese_zodiac_element_calculator.metadata.title"),
    },
    description: t("chinese_zodiac_element_calculator.metadata.description"),
    keywords: t("chinese_zodiac_element_calculator.metadata.keywords"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function ChineseZodiacPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const page = await getChineseZodiacPage(locale);
  const readerPage = await getReaderPage(locale);

  const t = await getTranslations();
  const posts = await getPostsByLocale(locale);

  const blog: BlogType = {
    title: t("blog.title"),
    description: t("blog.description"),
    items: posts,
    read_more_text: t("blog.read_more_text"),
  };
  return (
    <>
      {page.hero && <Hero hero={page.hero} />}
      {page.questionForm && (
        <QuestionSelector
          formMessages={readerPage}
          questionSelector={page.questionForm.questionSelector}
        />
      )}
      <BlogBlock blog={blog} />

      {/* {page.branding && <Branding section={page.branding} />}
      {page.introduce && <Feature1 section={page.introduce} />}
      {page.feature && <Feature section={page.feature} />} */}
      {/* {page.showcase && <Showcase section={page.showcase} />} */}
      {/* {page.benefit && <Feature2 section={page.benefit} />}
      {page.usage && <Feature3 section={page.usage} />}
      {page.stats && <Stats section={page.stats} />} */}
      {page.pricing && <Pricing pricing={page.pricing} />}
      {/* {page.testimonial && <Testimonial section={page.testimonial} />} */}
      {page.faq && <FAQ section={page.faq} />}
      {page.cta && <CTA section={page.cta} />}
    </>
  );
}
