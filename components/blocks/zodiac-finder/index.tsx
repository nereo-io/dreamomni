"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ZodiacFinderSection } from "@/types/blocks/zodiac-finder";
import { cn } from "@/lib/utils";

interface ZodiacFinderProps {
  translations: ZodiacFinderSection;
  className?: string;
}

export const ZodiacFinder = ({
  translations,
  className = "",
}: ZodiacFinderProps) => {
  const [selectedZodiac, setSelectedZodiac] = useState<string | null>(null);

  return (
    <section className={cn("w-full py-16 bg-background", className)}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 text-foreground">
          {translations.title}
        </h2>
        <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
          {translations.instruction}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {translations.signs.map((sign, index) => (
            <Link
              href={`#zodiac-${sign.name.toLowerCase()}`}
              key={index}
              onClick={() => setSelectedZodiac(sign.name.toLowerCase())}
              className="block"
            >
              <div
                className={`bg-card p-4 rounded-lg shadow-md hover:shadow-lg transition duration-300 cursor-pointer text-center
                  ${
                    selectedZodiac === sign.name.toLowerCase()
                      ? "ring-2 ring-primary"
                      : ""
                  }`}
              >
                <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden bg-muted">
                  <Image
                    src={`/imgs/zodiac/${
                      sign.name.toLowerCase() === "goat"
                        ? "sheep"
                        : sign.name.toLowerCase()
                    }.png`}
                    alt={sign.name}
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                </div>
                <h3 className="font-bold text-lg mb-1 text-foreground">
                  {sign.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {sign.years}
                </p>
                <p className="text-sm text-muted-foreground">
                  {sign.shortDescription}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
