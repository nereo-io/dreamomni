import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  getAllEffectConfigs,
  getHotEffectConfigs,
} from "@/models/effectConfig";
import { VideoEffectsGrid } from "@/components/blocks/video-effects-grid";

interface VideoEffectsPageProps {
  params: {
    locale: string;
  };
  searchParams?: {
    category?: string;
  };
}

export async function generateMetadata({
  params: { locale },
}: VideoEffectsPageProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "pages.videoEffects" });

  const title = t("title") || "AI Video Effects - Transform Your Videos";
  const description =
    t("description") ||
    "Create stunning video effects with AI. Choose from dozens of templates and transform your videos instantly.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}/video-effects`,
    },
  };
}

export default async function VideoEffectsPage({
  params: { locale },
  searchParams,
}: VideoEffectsPageProps) {
  const t = await getTranslations({ locale, namespace: "pages.videoEffects" });

  // Fetch all effects for the current locale
  const [allEffects, hotEffects] = await Promise.all([
    getAllEffectConfigs(locale),
    getHotEffectConfigs(locale, 8),
  ]);

  console.log("Fetched effects:", {
    locale,
    allCount: allEffects.length,
    hotCount: hotEffects.length,
    firstAffect: allEffects[0],
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-transparent to-transparent pb-12 pt-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              {t("effectsTitle") || "AI Video Effects"}
            </h1>
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
              {t("heroDescription") ||
                "Transform your videos with stunning AI-powered effects"}
            </p>

            {/* Stats */}
            <div className="flex justify-center gap-8 pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {allEffects.length}+
                </div>
                <div className="text-sm text-muted-foreground">Effects</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">5</div>
                <div className="text-sm text-muted-foreground">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">HD</div>
                <div className="text-sm text-muted-foreground">Quality</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hot Effects Section */}
      {hotEffects.length > 0 && (
        <section className="border-b py-12">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h2 className="text-2xl font-bold sm:text-3xl">
                🔥 Trending Effects
              </h2>
              <p className="mt-2 text-muted-foreground">
                Most popular effects chosen by our community
              </p>
            </div>
            <VideoEffectsGrid effects={hotEffects} />
          </div>
        </section>
      )}

      {/* All Effects Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-2xl font-bold sm:text-3xl">All Effects</h2>
            <p className="mt-2 text-muted-foreground">
              Browse our complete collection of video effects
            </p>
          </div>
          <VideoEffectsGrid effects={allEffects} />
        </div>
      </section>
    </div>
  );
}
