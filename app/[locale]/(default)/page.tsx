import Link from 'next/link';
import type React from 'react';
import {
  ArrowRight,
  Camera,
  Download,
  Film,
  ImageIcon,
  Images,
  Layers3,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Wand2,
} from 'lucide-react';
import Hero from '@/components/blocks/hero';
import AuthRedirect from '@/components/auth/auth-redirect';
import StructuredData from '@/components/seo/structured-data';
import { Button } from '@/components/ui/button';
import {
  getGeminiOmniIntentLinks,
  getGeminiOmniLandingCopy,
} from '@/config/geminiomni-landing';
import { defaultLocale, locales } from '@/i18n/locale';

export const revalidate = 3600;

const exampleVideos = [
  'https://r2.seedance.tv/showcase/gemini-omni/hero.webm',
  'https://r2.seedance.tv/showcase/gemini-omni/fern-harp.webm',
  'https://r2.seedance.tv/showcase/gemini-omni/puppet-transform.webm',
  'https://r2.seedance.tv/showcase/gemini-omni/marble-physics.webm',
];

const featureVideos = [
  {
    title: 'Text prompts become cinematic scenes',
    description:
      'Describe the subject, action, camera move, lighting, and mood. GeminiOmni helps turn that creative brief into a watchable AI video draft.',
    src: 'https://r2.seedance.tv/showcase/gemini-omni/zoom-action.webm',
  },
  {
    title: 'Images guide identity and style',
    description:
      'Use a product shot, character image, artwork, or reference frame to help the generated video preserve the visual direction you care about.',
    src: 'https://r2.seedance.tv/showcase/gemini-omni/protein-folding.webm',
  },
  {
    title: 'Natural language keeps iteration simple',
    description:
      'Adjust the action, scene, tone, object, or camera language in words, then regenerate until the clip fits the story you want to tell.',
    src: 'https://r2.seedance.tv/showcase/gemini-omni/alphabet-sync.webm',
  },
  {
    title: 'Outputs fit creator workflows',
    description:
      'Preview finished clips, keep generation history, download usable outputs, and turn the best results into ads, demos, explainers, or social videos.',
    src: 'https://r2.seedance.tv/showcase/gemini-omni/text-sync.webm',
  },
];

const productUseCases = [
  {
    title: 'Product and launch videos',
    description:
      'Turn product images, campaign concepts, or launch ideas into short video drafts for ads, websites, and social posts.',
    src: 'https://r2.seedance.tv/showcase/gemini-omni/sailor-combine.webm',
  },
  {
    title: 'Visual learning and explainers',
    description:
      'Convert a lesson, workflow, or abstract concept into a short visual sequence that is easier to understand and share.',
    src: 'https://r2.seedance.tv/showcase/gemini-omni/crystal-rose.webm',
  },
  {
    title: 'Character moments from images',
    description:
      'Start from a still image and create expressive motion, scene atmosphere, and a clearer character-led video moment.',
    src: 'https://r2.seedance.tv/showcase/gemini-omni/anime-swap.webm',
  },
  {
    title: 'Storyboard and music-video ideas',
    description:
      'Write a shot-by-shot prompt, preserve the important details, and create quick video drafts before investing in production.',
    src: 'https://r2.seedance.tv/showcase/gemini-omni/fish-drawing.webm',
  },
];

const promptTips = [
  {
    label: '01',
    title: 'Start with the main video elements',
    description:
      'Name the subject, setting, action, framing, camera movement, style, lighting, and mood before adding advanced effects.',
  },
  {
    label: '02',
    title: 'Use references with a clear purpose',
    description:
      'When uploading an image, say whether it should control character identity, product appearance, composition, color, or overall art direction.',
  },
  {
    label: '03',
    title: 'Write camera direction clearly',
    description:
      'Use phrases like wide shot, close-up, locked camera, handheld motion, push-in, tilt-up, or continuous shot to shape the final clip.',
  },
  {
    label: '04',
    title: 'Add consistency rules',
    description:
      'For explainers, storyboards, and product videos, specify what must stay consistent and how the idea should unfold over time.',
  },
];

const platformReasons = [
  {
    title: 'Free starting path',
    description:
      'Try Gemini Omni-style video generation online before deciding whether you need a larger credit package or paid plan.',
  },
  {
    title: 'Built for creators',
    description:
      'The homepage leads users to real text-to-video and image-to-video workflows before anything else.',
  },
  {
    title: 'Clear model overview',
    description:
      'GeminiOmni explains what the model direction means, then gives search visitors examples, use cases, prompt advice, and creation routes.',
  },
];

const capabilityIcons = [Layers3, Images, Wand2];
const workflowIcons = [Sparkles, ImageIcon, Camera, Download];

function getLocalizedPath(locale: string, path: string) {
  return locale === defaultLocale ? path : `/${locale}${path}`;
}

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://geminiomni.tv';
  const canonicalUrl = locale === defaultLocale ? baseUrl : `${baseUrl}/${locale}`;
  const copy = getGeminiOmniLandingCopy(locale);

  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
    keywords: copy.metadata.keywords,
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function LandingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const textToVideoHref = getLocalizedPath(locale, '/text-to-video');
  const copy = getGeminiOmniLandingCopy(locale);
  const intentLinks = getGeminiOmniIntentLinks(locale);
  const relatedIntentLinks = intentLinks.filter(
    (item) => !item.href.includes('api')
  );

  const heroData = {
    name: 'hero',
    title: copy.hero.title,
    highlight_text: 'Gemini Omni',
    description: copy.hero.description,
  };

  return (
    <>
      <AuthRedirect preserveSearchParams />
      <Hero hero={heroData} />
      <main className="bg-slate-950 text-white">
        <section className="bg-white px-5 py-16 text-slate-950 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                  Gemini Omni video examples
                </h2>
                <p className="mt-4 max-w-2xl leading-7 text-slate-600">
                  Explore sample clips, then create your own.
                </p>
              </div>
              <Button asChild className="rounded-md bg-blue-600 text-white hover:bg-blue-700">
                <Link href={textToVideoHref}>
                  Start creating
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {exampleVideos.map((src, index) => (
                <video
                  key={src}
                  className="aspect-[9/16] w-full rounded-md border border-slate-200 bg-black object-cover shadow-lg shadow-slate-200"
                  src={src}
                  controls
                  muted
                  playsInline
                  preload="metadata"
                  aria-label={`Gemini Omni sample video ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        <ArticleSection
          title={copy.model.title}
          description={copy.model.description}
          className="bg-slate-950 text-white"
        >
          <div className="grid gap-4 md:grid-cols-3">
            {copy.capabilities.map((item, index) => {
              const Icon = capabilityIcons[index] || Film;
              return (
                <article
                  key={item.title}
                  className="rounded-md border border-white/10 bg-white/[0.045] p-6"
                >
                  <Icon className="h-6 w-6 text-cyan-200" />
                  <h3 className="mt-5 text-xl font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 leading-7 text-slate-300">
                    {item.description}
                  </p>
                </article>
              );
            })}
          </div>
        </ArticleSection>

        <ArticleSection
          title="Key features of the Gemini Omni AI video generator"
          description="The page now borrows the SEO depth of model overview pages while staying focused on creators: prompts, images, natural-language iteration, examples, history, and downloads."
          className="bg-slate-900 text-white"
        >
          <div className="grid gap-5 md:grid-cols-2">
            {featureVideos.map((item) => (
              <VideoFeatureCard key={item.title} item={item} />
            ))}
          </div>
        </ArticleSection>

        <section className="bg-slate-100 px-5 py-16 text-slate-950 sm:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.82fr_1.18fr]">
            <div>
              <h2 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                {copy.workflow.title}
              </h2>
              <p className="mt-5 leading-8 text-slate-600">
                {copy.workflow.description}
              </p>
              <Button asChild className="mt-7 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                <Link href={textToVideoHref}>
                  {copy.workflow.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {copy.workflow.steps.map((item, index) => {
                const Icon = workflowIcons[index] || Sparkles;
                return (
                  <article
                    key={item.title}
                    className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <Icon className="h-6 w-6 text-blue-600" />
                      <span className="text-sm font-semibold text-slate-400">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-2 leading-7 text-slate-600">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <ArticleSection
          title={copy.useCases.title}
          description={copy.useCases.description}
          className="bg-white text-slate-950"
        >
          <div className="grid gap-5 md:grid-cols-2">
            {productUseCases.map((item) => (
              <VideoFeatureCard key={item.title} item={item} />
            ))}
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {copy.useCases.items.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-4"
              >
                <PlayCircle className="h-5 w-5 text-blue-600" />
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </ArticleSection>

        <section className="bg-slate-950 px-5 py-16 text-white sm:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-3xl font-semibold tracking-normal sm:text-4xl">
              How to create better video results with Gemini Omni
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {promptTips.map((item) => (
                <article
                  key={item.title}
                  className="rounded-md border border-white/10 bg-white/[0.045] p-5"
                >
                  <span className="text-sm font-semibold text-cyan-200">
                    {item.label}
                  </span>
                  <h3 className="mt-3 text-xl font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-3 leading-7 text-slate-300">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <ArticleSection
          title="Why choose GeminiOmni for Gemini Omni-style video creation"
          description="GeminiOmni keeps the product promise simple: free starting access, creator-friendly workflows, and enough SEO content to answer search intent without changing the site into a developer platform."
          className="bg-slate-100 text-slate-950"
        >
          <div className="grid gap-4 md:grid-cols-3">
            {platformReasons.map((item) => (
              <article
                key={item.title}
                className="rounded-md border border-slate-200 bg-white p-6 shadow-sm"
              >
                <ShieldCheck className="h-6 w-6 text-blue-600" />
                <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {relatedIntentLinks.map((item) => (
              <Link
                key={item.href}
                href={getLocalizedPath(locale, item.href)}
                className="group rounded-md border border-blue-200 bg-blue-50 p-5 transition hover:border-blue-400 hover:bg-blue-100"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-base font-semibold text-slate-950">
                    {item.title}
                  </h3>
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 transition group-hover:translate-x-0.5" />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
              </Link>
            ))}
          </div>
        </ArticleSection>

        <section className="border-t border-white/10 bg-slate-950 px-5 py-16 text-white sm:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-semibold tracking-normal sm:text-4xl">
              {copy.faq.title}
            </h2>
            <div className="mt-8 divide-y divide-white/10 rounded-md border border-white/10 bg-white/[0.03]">
              {copy.faq.items.map((item) => (
                <div key={item.question} className="p-6">
                  <h3 className="text-lg font-semibold text-white">
                    {item.question}
                  </h3>
                  <p className="mt-3 leading-7 text-slate-300">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm leading-6 text-slate-500">
              {copy.faq.independentNotice}
            </p>
          </div>
        </section>
      </main>

      <StructuredData type="faq" data={{ questions: copy.faq.items }} />
    </>
  );
}

function ArticleSection({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description: string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`px-5 py-16 sm:px-8 ${className}`}>
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-semibold tracking-normal sm:text-4xl">
            {title}
          </h2>
          <p className="mt-5 leading-8 opacity-80">{description}</p>
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

function VideoFeatureCard({
  item,
}: {
  item: {
    title: string;
    description: string;
    src: string;
  };
}) {
  return (
    <article className="overflow-hidden rounded-md border border-slate-200 bg-white text-slate-950 shadow-sm">
      <video
        className="aspect-video w-full bg-black object-cover"
        src={item.src}
        controls
        muted
        playsInline
        preload="metadata"
      />
      <div className="p-5">
        <Film className="h-5 w-5 text-blue-600" />
        <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
        <p className="mt-3 leading-7 text-slate-600">{item.description}</p>
      </div>
    </article>
  );
}
