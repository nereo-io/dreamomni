import { VideoGenerationTool } from "@/components/blocks/ai-video-generation-tool";
import { AIVideoShowcase } from "@/components/blocks/ai-video-showcase";
import { AIModelsHero } from "@/components/blocks/ai-models-hero";
import { CreatorShowcase } from "@/components/blocks/creator-showcase";
import { FAQSection } from "@/components/blocks/faq-section";
import CTA from "@/components/blocks/cta";
import { getPostsByLocale } from "@/models/post";
import { getTextToVideoPage } from "@/services/page";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/text-to-video`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/text-to-video`;
  }

  return {
    title: t("pages.textToVideo.title"),
    description: t("pages.textToVideo.description"),
    keywords: t("pages.textToVideo.keywords"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function TextToVideoPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await auth();
  const pageData = await getTextToVideoPage(locale);
  const recentPosts = await getPostsByLocale(locale, 1, 3);

  return (
    <>
      {/* Video Generation Tool */}
      <VideoGenerationTool mode="text-to-video" />

      {!session && (
        <>
          {/* AI Models Hero */}
          <AIModelsHero data={pageData.aiModelsHero} />

          {/* AI Video Showcase */}
          <AIVideoShowcase data={pageData.aiVideoShowcase} />

          {/* Creator Showcase */}
          <CreatorShowcase data={pageData.creatorShowcase} />

          {/* FAQ Section */}
          <FAQSection
            title={pageData.faq.title}
            description={pageData.faq.description}
            faqItems={pageData.faq.items}
          />

          {/* Related Blog Articles */}
          {recentPosts.length > 0 && (
            <section className="bg-gray-950 py-16">
              <div className="mx-auto max-w-7xl px-8">
                <h2 className="mb-8 text-2xl font-bold text-white">
                  Learn More About AI Video
                </h2>
                <div className="grid gap-6 md:grid-cols-3">
                  {recentPosts.map((post) => (
                    <a
                      key={post.uuid || post.slug}
                      href={
                        locale === "en"
                          ? `/blog/${post.slug}`
                          : `/${locale}/blog/${post.slug}`
                      }
                      className="group overflow-hidden rounded-2xl border border-border/70 bg-card/40 transition-colors hover:border-primary/40 hover:bg-card"
                    >
                      {post.cover_url && (
                        <img
                          src={post.cover_url}
                          alt={post.title || ""}
                          className="aspect-[16/9] w-full object-cover"
                          loading="lazy"
                          decoding="async"
                          width={640}
                          height={360}
                        />
                      )}
                      <div className="p-5">
                        <h3 className="line-clamp-2 text-lg font-semibold text-foreground">
                          {post.title}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {post.description}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* CTA Section */}
          <CTA
            section={{
              title: pageData.cta.title,
              buttons: [
                {
                  title: pageData.cta.buttonText,
                  url: "/text-to-video",
                },
              ],
            }}
          />
        </>
      )}
    </>
  );
}
