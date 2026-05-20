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
import { defaultLocale, locales } from "@/i18n/locale";

export const revalidate = 3600;

const geminiOmniFaq = [
  {
    question: "What is the Gemini Omni AI Video Generator?",
    answer:
      "GeminiOmni is an independent online AI video generator inspired by Google Gemini Omni's multimodal video direction. It helps creators turn prompts and images into cinematic videos with a fast, browser-based workflow.",
  },
  {
    question: "What can I create with Gemini Omni-style video tools?",
    answer:
      "You can create social clips, product demos, cinematic scene concepts, educational explainers, avatar-style videos, and image-to-video animations from simple prompts and references.",
  },
  {
    question: "Can I start for free?",
    answer:
      "Yes. GeminiOmni offers a free starting path so you can try AI video generation before choosing a paid plan or larger credit package.",
  },
  {
    question: "Is GeminiOmni affiliated with Google?",
    answer:
      "No. GeminiOmni.tv is an independent product and is not affiliated with Google, Gemini, or Google DeepMind.",
  },
];

const heroHighlights = [
  "Text-to-video for cinematic prompt ideas",
  "Image-to-video for visual references",
  "History, playback, and download when outputs are ready",
];

const capabilityItems = [
  {
    icon: Layers3,
    title: "Any-input creative direction",
    description:
      "Gemini Omni's official direction centers on combining text, image, audio, and video inputs into one coherent video creation flow.",
  },
  {
    icon: Wand2,
    title: "Natural language video editing",
    description:
      "Describe the scene, then refine the action, camera, subjects, style, and effects conversationally instead of rebuilding the whole idea from scratch.",
  },
  {
    icon: Film,
    title: "Cinematic world-aware output",
    description:
      "Use prompts for realistic physics, historical context, product details, explainers, and camera language to create more structured videos.",
  },
];

const workflowSteps = [
  {
    icon: Sparkles,
    title: "Describe the scene",
    description:
      "Write the subject, setting, motion, camera angle, style, dialogue, and mood in one clear prompt.",
  },
  {
    icon: Images,
    title: "Add a reference image",
    description:
      "Guide identity, composition, product appearance, or style with an uploaded visual reference.",
  },
  {
    icon: Camera,
    title: "Tune generation settings",
    description:
      "Choose the available workflow, aspect ratio, duration, quality, and model options for your clip.",
  },
  {
    icon: Download,
    title: "Preview and download",
    description:
      "Keep finished outputs in your creation history, download the video, and iterate on the next cut.",
  },
];

const useCases = [
  "Short-form ads and UGC concepts",
  "Product demos and launch videos",
  "Image-to-video character moments",
  "Educational explainers",
  "Music video storyboards",
  "Reels, Shorts, and TikTok clips",
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
    title: "Free Gemini Omni AI Video Generator",
    description:
      "Create cinematic AI videos with GeminiOmni. Turn text prompts and images into videos online with a free Gemini Omni-style AI video generator.",
    keywords:
      "Gemini Omni, Gemini Omni AI video generator, free AI video generator, Google Gemini Omni, text to video AI, image to video AI, multimodal video generator",
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
                Free Gemini Omni AI Video Generator
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
                Create cinematic AI videos from text prompts and images.
                GeminiOmni turns Gemini Omni-style multimodal creation into a
                fast online generator for creators, marketers, educators, and
                storytellers.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-[52px] rounded-md bg-cyan-300 px-7 text-base font-semibold text-slate-950 shadow-[0_0_32px_rgba(103,232,249,0.28)] hover:bg-cyan-200"
                >
                  <Link href={textToVideoHref}>
                    Generate AI Video Free
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
                    Image to Video
                    <Images className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="mt-10 grid gap-3 text-sm text-slate-200">
                {heroHighlights.map((item) => (
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
                    alt="GeminiOmni AI video generator visual"
                    className="h-full w-full object-cover object-right"
                    loading="eager"
                    decoding="async"
                  />
                </div>
                <div className="mt-5 grid gap-3">
                  {[
                    ["Prompt", "A cinematic reveal of a glass AI filmmaker shaping light into video"],
                    ["Reference", "Image, camera direction, scene mood"],
                    ["Output", "Playable AI video ready for download"],
                  ].map(([label, value]) => (
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
                A new model direction for multimodal AI video creation.
              </h2>
            </div>
            <p className="text-base leading-8 text-slate-300">
              Google describes Gemini Omni as a model that can create from many
              input types, starting with video. The headline capabilities are
              natural-language editing, references from images, text, audio, and
              video, and scene generation grounded in world knowledge. GeminiOmni
              turns that direction into an approachable generator workflow for
              people who want to create videos now.
            </p>
          </div>
        </section>

        <section className="px-5 pb-20 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-4 md:grid-cols-3">
              {capabilityItems.map((item) => {
                const Icon = item.icon;
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

        <section className="bg-[#eaf7ff] px-5 py-20 text-slate-950 sm:px-8">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
            <div>
              <h2 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                Create AI videos online in four simple steps.
              </h2>
              <p className="mt-5 leading-8 text-slate-700">
                No filming equipment, editing timeline, or production team is
                required. Start from a prompt or a reference image, generate a
                video, and keep iterating until the scene feels right.
              </p>
              <Button
                asChild
                className="mt-7 rounded-md bg-slate-950 text-white hover:bg-slate-800"
              >
                <Link href={textToVideoHref}>
                  Start Creating
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {workflowSteps.map((item, index) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="rounded-md border border-cyan-950/10 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <Icon className="h-6 w-6 text-cyan-700" />
                      <span className="text-sm font-semibold text-slate-400">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-2 leading-7 text-slate-700">
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
                One generator for campaigns, explainers, concepts, and social clips.
              </h2>
              <p className="mt-5 leading-8 text-slate-300">
                Use GeminiOmni to move quickly from an idea to a polished AI
                video draft. It is built for creators who need output, not a
                passive news page.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {useCases.map((item) => (
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
              Gemini Omni AI video generator questions.
            </h2>
            <div className="mt-8 divide-y divide-white/10 rounded-md border border-white/10 bg-white/[0.03]">
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
            <p className="mt-8 text-sm leading-6 text-slate-500">
              GeminiOmni.tv is an independent product and is not affiliated with
              Google, Gemini, or Google DeepMind.
            </p>
          </div>
        </section>
      </main>

      <StructuredData type="faq" data={{ questions: geminiOmniFaq }} />
    </>
  );
}
