import Link from "next/link";
import {
  ArrowRight,
  AudioLines,
  BadgeCheck,
  Camera,
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
  {
    icon: Images,
    title: "Prompt with images",
    description: "Use visual references to guide characters, products, style, and composition.",
  },
  {
    icon: AudioLines,
    title: "Plan scenes with sound",
    description: "Write dialogue, ambience, music direction, and beat-driven motion into the prompt.",
  },
  {
    icon: MessageSquareText,
    title: "Edit by describing changes",
    description: "Refine camera motion, actions, lighting, and story details in plain language.",
  },
  {
    icon: Download,
    title: "Generate and download",
    description: "Create videos online, review your history, and download finished results.",
  },
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
    title: "Describe the video",
    description:
      "Start with a prompt that covers subject, setting, motion, camera angle, style, dialogue, and mood.",
  },
  {
    icon: Images,
    title: "Add a reference",
    description:
      "Upload an image when you need stronger control over identity, layout, product appearance, or visual style.",
  },
  {
    icon: Camera,
    title: "Choose generation settings",
    description:
      "Pick a video workflow, aspect ratio, duration, quality, and model options available in the generator.",
  },
  {
    icon: Download,
    title: "Download the result",
    description:
      "Preview the output, keep it in your creation history, download the video, and iterate on the next version.",
  },
];

const useCases = [
  "Short-form ads and UGC concepts",
  "Product demos and launch videos",
  "Image-to-video character moments",
  "Educational and training explainers",
  "Music video and storyboards",
  "Social clips for Reels, Shorts, and TikTok",
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
          <div className="absolute inset-0 bg-black/55 lg:hidden" />
          <div className="absolute inset-y-0 left-0 hidden w-2/3 bg-black/80 lg:block" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#07090f] to-transparent" />

          <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-5 py-24 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100">
                <BadgeCheck className="h-4 w-4" />
                Free online AI video generator
              </div>
              <h1 className="max-w-4xl text-5xl font-semibold leading-tight tracking-normal text-white sm:text-6xl lg:text-7xl">
                Free Gemini Omni AI Video Generator
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
                Create cinematic AI videos from text prompts and images.
                GeminiOmni brings the Gemini Omni-style multimodal creation
                experience into a fast online generator for creators, marketers,
                educators, and storytellers.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-md bg-cyan-300 px-6 text-base font-semibold text-slate-950 hover:bg-cyan-200"
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
                  className="h-12 rounded-md border-white/25 bg-white/10 px-6 text-base font-semibold text-white hover:bg-white/15 hover:text-white"
                >
                  <Link href={imageToVideoHref}>
                    Image to Video
                    <Images className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid gap-3 text-sm text-slate-100">
              {heroHighlights.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="rounded-md border border-white/15 bg-white/10 p-4 backdrop-blur"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-cyan-200" />
                      <h2 className="text-base font-semibold text-white">
                        {item.title}
                      </h2>
                    </div>
                    <p className="mt-2 leading-6 text-slate-200">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-slate-950 px-5 py-14 sm:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold uppercase text-cyan-200">
                Gemini Omni model
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
                A new model direction for multimodal AI video creation.
              </h2>
            </div>
            <p className="text-base leading-8 text-slate-300">
              Google describes Gemini Omni as a model that can create from many
              input types, starting with video. The headline capabilities are
              natural-language editing, references from images, text, audio, and
              video, and scene generation grounded in world knowledge. GeminiOmni
              turns that intent into an approachable generator workflow for
              people who want to create videos now.
            </p>
          </div>
        </section>

        <section className="px-5 py-20 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase text-cyan-200">
                What you can make
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
                Build Gemini Omni-style videos from prompt to final clip.
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
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase text-cyan-700">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
                Create AI videos online in four simple steps.
              </h2>
              <p className="mt-5 leading-8 text-slate-700">
                No filming equipment, editing timeline, or production team is
                required. Start from a prompt or a reference image, generate a
                video, and keep iterating until the scene feels right.
              </p>
              <Button
                asChild
                className="mt-6 rounded-md bg-slate-950 text-white hover:bg-slate-800"
              >
                <Link href={textToVideoHref}>
                  Start Creating
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {workflowSteps.map((item, index) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="rounded-md border border-slate-200 bg-slate-50 p-5"
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
              <p className="text-sm font-semibold uppercase text-cyan-200">
                Creator workflows
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
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
            <p className="text-sm font-semibold uppercase text-cyan-200">FAQ</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
              Gemini Omni AI video generator questions.
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
