import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  Film,
  Layers3,
  Radio,
  Sparkles,
  Wand2,
} from "lucide-react";
import AuthRedirect from "@/components/auth/auth-redirect";
import StructuredData from "@/components/seo/structured-data";
import { Button } from "@/components/ui/button";
import { defaultLocale, locales } from "@/i18n/locale";

export const revalidate = 3600;

const geminiOmniFaq = [
  {
    question: "Is Gemini Omni available through KIE right now?",
    answer:
      "No. Gemini Omni is not currently listed in KIE public docs or market pages. GeminiOmni.tv is monitoring provider availability.",
  },
  {
    question: "Can I generate AI videos on GeminiOmni.tv today?",
    answer:
      "Yes. The first release offers available AI video generation paths while native Gemini Omni support is monitored.",
  },
  {
    question: "Is GeminiOmni.tv affiliated with Google?",
    answer:
      "No. GeminiOmni.tv is an independent product and is not affiliated with Google, Gemini, or Google DeepMind.",
  },
];

const capabilityItems = [
  {
    icon: Layers3,
    title: "Any-input video creation",
    description:
      "Gemini Omni was introduced for combining text, image, audio, and video inputs into grounded video outputs.",
  },
  {
    icon: Wand2,
    title: "Conversational editing",
    description:
      "Google positions Omni around natural-language video edits that build on the same scene across turns.",
  },
  {
    icon: Film,
    title: "Cinematic creator workflows",
    description:
      "The first public rollout starts with video creation and editing in Gemini, Flow, and YouTube Shorts.",
  },
];

const useCases = [
  "Short-form campaign concepts",
  "Creator B-roll and scene variants",
  "Product explainers and visual demos",
  "Prompt research for multimodal video",
];

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

  return {
    title: "Gemini Omni AI Video Generator and Model Tracker",
    description:
      "Track Google Gemini Omni availability and create AI videos today with available video models while native Gemini Omni API support is monitored.",
    keywords:
      "Gemini Omni, Gemini Omni Flash, Google Gemini Omni, AI video generator, multimodal video model, Gemini video AI",
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
  const primaryCtaHref = getLocalizedPath(locale, "/text-to-video");
  const secondaryCtaHref = "#gemini-omni-updates";
  const omniStatus = "Gemini Omni API status: monitoring";
  const unsupportedNotice =
    "Gemini Omni is not currently listed in KIE public docs or market pages. GeminiOmni.tv will add native Gemini Omni support only after a real provider endpoint is available.";
  const independentNotice =
    "GeminiOmni.tv is an independent product and is not affiliated with Google, Gemini, or Google DeepMind.";

  return (
    <>
      <AuthRedirect preserveSearchParams />
      <main className="min-h-screen bg-[#07090f] text-white">
        <section
          className="relative flex min-h-[88vh] items-center overflow-hidden bg-cover bg-center"
          style={{ backgroundImage: "url('/video-intro-poster.jpg')" }}
        >
          <div className="absolute inset-0 bg-black/60 lg:hidden" />
          <div className="absolute inset-y-0 left-0 hidden w-2/3 bg-black/80 lg:block" />

          <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-5 py-24 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100">
                <Radio className="h-4 w-4" />
                {omniStatus}
              </div>
              <h1 className="max-w-4xl text-5xl font-semibold leading-tight tracking-normal text-white sm:text-6xl lg:text-7xl">
                Gemini Omni AI Video Generator
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
                Follow Google's new Gemini Omni video model and create AI videos
                today with available generation models while native Gemini Omni
                API access is monitored.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-md bg-cyan-300 px-6 text-base font-semibold text-slate-950 hover:bg-cyan-200"
                >
                  <Link href={primaryCtaHref}>
                    Try AI Video Generator
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-12 rounded-md border-white/25 bg-white/10 px-6 text-base font-semibold text-white hover:bg-white/15 hover:text-white"
                >
                  <a href={secondaryCtaHref}>
                    Get Gemini Omni Updates
                    <Bell className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 text-sm text-slate-100">
              {[
                "Google I/O 2026 announcement",
                "Omni Flash rollout tracking",
                "KIE provider status monitoring",
                "Available AI video generation today",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-md border border-white/15 bg-white/10 p-4 backdrop-blur"
                >
                  <CheckCircle2 className="h-5 w-5 text-cyan-200" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-slate-950 px-5 py-14 sm:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold uppercase text-cyan-200">
                Gemini Omni news
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
                Google's new multimodal video model is the trend to watch.
              </h2>
            </div>
            <p className="text-base leading-8 text-slate-300">
              Google introduced Gemini Omni Flash as the first model in the
              Gemini Omni family on May 19, 2026. The announcement focuses on
              creating and editing video from combinations of text, images,
              audio, and video. GeminiOmni.tv tracks this rollout and turns the
              demand into a practical video creation entry point.
            </p>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase text-cyan-200">
                What Omni changes
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
                Built around multimodal video creation and editing.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {capabilityItems.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="rounded-md border border-white/10 bg-white/[0.04] p-6"
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

        <section className="bg-white px-5 py-20 text-slate-950 sm:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase text-cyan-700">
                Current model support
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
                Gemini Omni support will wait for a real provider endpoint.
              </h2>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-6">
              <p className="leading-8 text-slate-700">{unsupportedNotice}</p>
              <Button
                asChild
                className="mt-6 rounded-md bg-slate-950 text-white hover:bg-slate-800"
              >
                <Link href={primaryCtaHref}>
                  Create with available video models
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="gemini-omni-updates" className="px-5 py-20 sm:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold uppercase text-cyan-200">
                Creator workflows
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
                Use the hype window for real video output now.
              </h2>
              <p className="mt-5 leading-8 text-slate-300">
                Start with available text-to-video and image-to-video tools,
                then switch to native Gemini Omni generation after provider
                access becomes reliable.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {useCases.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] p-4"
                >
                  <Sparkles className="h-5 w-5 text-cyan-200" />
                  <span className="text-slate-100">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-4xl">
            <p className="text-sm font-semibold uppercase text-cyan-200">FAQ</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
              Gemini Omni availability questions.
            </h2>
            <div className="mt-8 divide-y divide-white/10 rounded-md border border-white/10">
              {geminiOmniFaq.map((item) => (
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
          </div>
        </section>

        <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-slate-400 sm:px-8">
          {independentNotice}
        </footer>
      </main>

      <StructuredData type="faq" data={{ questions: geminiOmniFaq }} />
    </>
  );
}
