import FAQ from "@/components/blocks/faq";
import Hero from "@/components/blocks/hero";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ImageToVideoShowcase } from "@/components/blocks/image-to-video-showcase";
import { AIModelsHero } from "@/components/blocks/ai-models-hero";
import { AIVideoShowcase } from "@/components/blocks/ai-video-showcase";
import CTA from "@/components/blocks/cta";
import { getLandingPage } from "@/services/page";

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

export default async function LandingPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  // 在服务器端检查认证状态
  const session = await auth();

  // 如果已登录，直接重定向到/image-to-video
  if (session) {
    const query = new URLSearchParams();
    Object.entries(searchParams ?? {}).forEach(([key, value]) => {
      if (typeof value === "string") {
        query.set(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item) query.append(key, item);
        });
      }
    });
    const redirectUrl = query.toString()
      ? `/image-to-video?${query.toString()}`
      : "/image-to-video";
    redirect(redirectUrl);
  }

  const page = await getLandingPage(locale);

  return (
    <>
      {page.hero && <Hero hero={page.hero} />}
      {/* <VideoFeatureShowcase data={videoFeatureShowcase} /> */}

      {page.aiModelsHero && <AIModelsHero data={page.aiModelsHero} />}
      {page.imageToVideoShowcase && (
        <ImageToVideoShowcase data={page.imageToVideoShowcase} />
      )}
      {page.aiVideoShowcase && <AIVideoShowcase data={page.aiVideoShowcase} />}
      {page.faq && <FAQ section={page.faq} />}
      {page.cta && <CTA section={page.cta} />}
      <div className="max-w-7xl mx-auto px-8 py-3">
        <p className="text-sm text-muted-foreground text-center font-medium">
          This platform is an independent product and is not affiliated with
          Google.
        </p>
      </div>
    </>
  );
}
