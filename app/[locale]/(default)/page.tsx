import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  Camera,
  Check,
  Download,
  Film,
  Images,
  Layers3,
  MessageSquareText,
  PlayCircle,
  Sparkles,
  Wand2,
} from "lucide-react";
import AuthRedirect from "@/components/auth/auth-redirect";
import StructuredData from "@/components/seo/structured-data";
import { Button } from "@/components/ui/button";
import { getGeminiOmniLandingCopy } from "@/config/geminiomni-landing";
import { defaultLocale, locales } from "@/i18n/locale";

export const revalidate = 3600;

const capabilityIcons = [Layers3, Wand2, Film];
const workflowIcons = [Sparkles, Images, Camera, Download];

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
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://geminiomni.tv";
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
  const textToVideoHref = getLocalizedPath(locale, "/text-to-video");
  const imageToVideoHref = getLocalizedPath(locale, "/image-to-video");
  const copy = getGeminiOmniLandingCopy(locale);

  return (
    <>
      <AuthRedirect preserveSearchParams />
      <main className="min-h-screen bg-[#020712] text-white">
        <section
          className="relative isolate min-h-[84vh] overflow-hidden bg-cover bg-center"
          style={{ backgroundImage: "url('/geminiomni-hero.jpg')" }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#020712_0%,rgba(2,7,18,0.96)_31%,rgba(2,7,18,0.58)_62%,rgba(2,7,18,0.25)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#020712] to-transparent" />

          <div className="relative mx-auto grid min-h-[84vh] w-full max-w-7xl items-center gap-12 px-5 pb-16 pt-24 sm:px-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-semibold leading-[1.02] tracking-normal text-white sm:text-6xl lg:text-7xl">
                {copy.hero.title}
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
                {copy.hero.description}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-[52px] rounded-md bg-cyan-300 px-7 text-base font-semibold text-slate-950 shadow-[0_0_32px_rgba(103,232,249,0.28)] hover:bg-cyan-200"
                >
                  <Link href={textToVideoHref}>
                    {copy.hero.primaryCta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-[52px] rounded-md border-white/25 bg-white/10 px-7 text-base font-semibold text-white backdrop-blur hover:bg-white/15 hover:text-white"
                >
                  <Link href={imageToVideoHref}>
                    {copy.hero.secondaryCta}
                    <Images className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="mt-10 grid gap-3 text-sm text-slate-200">
                {copy.hero.highlights.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-300 text-slate-950">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:flex lg:justify-end">
              <div className="w-full max-w-md rounded-md border border-white/15 bg-slate-950/55 p-5 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
                <div className="aspect-video overflow-hidden rounded-md border border-white/10 bg-black/40">
                  <img
                    src="/geminiomni-hero.jpg"
                    alt={copy.hero.imageAlt}
                    className="h-full w-full object-cover object-right"
                    loading="eager"
                    decoding="async"
                  />
                </div>
                <div className="mt-5 grid gap-3">
                  {copy.hero.preview.map(({ label, value }) => (
                    <div
                      key={label}
                      className="grid grid-cols-[88px_1fr] gap-4 rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm"
                    >
                      <span className="font-medium text-cyan-200">{label}</span>
                      <span className="text-slate-200">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
            <div>
              <h2 className="text-3xl font-semibold tracking-normal text-white sm:text-4xl">
                {copy.model.title}
              </h2>
            </div>
            <p className="text-base leading-8 text-slate-300">
              {copy.model.description}
            </p>
          </div>
        </section>

        <section className="px-5 pb-20 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-4 md:grid-cols-3">
              {copy.capabilities.map((item, index) => {
                const Icon = capabilityIcons[index] || Sparkles;
                return (
                  <article
                    key={item.title}
                    className="rounded-md border border-white/10 bg-white/[0.045] p-6 shadow-lg shadow-black/10"
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
          </div>
        </section>

        <section className="border-y border-white/10 bg-slate-950 px-5 py-20 text-white sm:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
            <div>
              <h2 className="text-3xl font-semibold tracking-normal text-white sm:text-4xl">
                {copy.workflow.title}
              </h2>
              <p className="mt-5 leading-8 text-slate-300">
                {copy.workflow.description}
              </p>
              <Button
                asChild
                className="mt-7 rounded-md bg-cyan-300 text-slate-950 shadow-[0_0_28px_rgba(103,232,249,0.22)] hover:bg-cyan-200"
              >
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
                    className="rounded-md border border-white/10 bg-white/[0.045] p-5 shadow-lg shadow-black/10"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <Icon className="h-6 w-6 text-cyan-200" />
                      <span className="text-sm font-semibold text-slate-500">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 leading-7 text-slate-300">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h2 className="text-3xl font-semibold tracking-normal text-white sm:text-4xl">
                {copy.useCases.title}
              </h2>
              <p className="mt-5 leading-8 text-slate-300">
                {copy.useCases.description}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {copy.useCases.items.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] p-4"
                >
                  <PlayCircle className="h-5 w-5 text-cyan-200" />
                  <span className="text-slate-100">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-semibold tracking-normal text-white sm:text-4xl">
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
