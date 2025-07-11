import { Button } from "@/components/ui/button";
import HeroBg from "./bg";
import { Hero as HeroType } from "@/types/blocks/hero";
import Icon from "@/components/icon";
import Link from "next/link";

export default function Hero({ hero }: { hero: HeroType }) {
  if (hero.disabled) {
    return null;
  }

  const highlightText = hero.highlight_text;
  let texts = null;
  if (highlightText) {
    texts = hero.title?.split(highlightText, 2);
  }

  return (
    <>
      <HeroBg />
      <section
        id={hero.name}
        className="relative min-h-screen flex items-end pb-40"
      >
        <div className="container">
          <div className="text-center text-white">
            {texts && texts.length > 1 ? (
              <h1 className="mx-auto mb-8 max-w-4xl text-balance text-4xl font-bold lg:text-7xl leading-tight">
                {texts[0]}
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent">
                  {highlightText}
                </span>
                {texts[1]}
              </h1>
            ) : (
              <h1 className="mx-auto mb-8 max-w-4xl text-balance text-4xl font-bold lg:text-7xl leading-tight">
                {hero.title}
              </h1>
            )}

            <p className="mx-auto mb-12 max-w-3xl text-xl text-gray-200 lg:text-2xl">
              {hero.description}
            </p>

            <div className="mt-12">
              <Link href="/text-to-video" className="inline-block">
                <Button
                  size="lg"
                  className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300 rounded-md shadow-xl border-0 transform hover:scale-105"
                >
                  <Icon name="RiPlayFill" className="mr-2 w-5 h-5" />
                  Start Creating Video
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
