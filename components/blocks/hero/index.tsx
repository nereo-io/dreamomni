import { RainbowButton } from "@/components/ui/rainbow-button";
import { Button } from "@/components/ui/button";
import HeroBg from "./bg";
import { Hero as HeroType } from "@/types/blocks/hero";
import Icon from "@/components/icon";
import Link from "next/link";
import { Type } from "lucide-react";


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
        className="relative min-h-[calc(100vh-60px)] flex items-end pb-40"
      >
        <div className="container">
          <div className="text-center text-white">
            {texts && texts.length > 1 ? (
              <h1 className="mx-auto mb-8 max-w-4xl text-balance text-4xl font-bold lg:text-7xl leading-tight">
                {texts[0]}
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
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

            <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/image-to-video" className="inline-block">
                <RainbowButton>
                  <Icon name="RiImage2Line" className="mr-2 w-5 h-5" />
                  Image to Video
                </RainbowButton>
              </Link>
              <Link href="/text-to-video" className="inline-block">
                <RainbowButton>
                  <Type className="mr-2 w-5 h-5" />
                  Text to Video
                </RainbowButton>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
