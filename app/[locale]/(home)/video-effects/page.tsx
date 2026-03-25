import { getTranslations } from "next-intl/server";
import { getAllEffectConfigs } from "@/models/effectConfig";
import { getPostsByLocale } from "@/models/post";
import { VideoEffectsGrid } from "@/components/blocks/video-effects-grid";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();

  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/video-effects`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/video-effects`;
  }

  return {
    title: t("pages.videoEffects.title"),
    description: t("pages.videoEffects.description"),
    keywords: t("pages.videoEffects.keywords"),
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function Page({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const effects = await getAllEffectConfigs(locale);
  const recentPosts = await getPostsByLocale(locale, 1, 3);

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-[1920px] mx-auto px-4">
        <VideoEffectsGrid effects={effects} />
      </div>

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
    </div>
  );
}
