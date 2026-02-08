"use client";

import Link from "next/link";
import { useState } from "react";

interface RelatedEffect {
  id: string;
  title: string;
  slug: string;
  image: string;
  href: string;
}

interface EffectRelatedGridProps {
  title: string;
  effects: RelatedEffect[];
}

export function EffectRelatedGrid({ title, effects }: EffectRelatedGridProps) {
  if (!effects || effects.length === 0) return null;

  return (
    <section className="py-16 md:py-20">
      <h2 className="text-4xl md:text-5xl font-bold text-white mb-12 text-center">
        {title}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {effects.map((effect) => (
          <RelatedEffectCard key={effect.id} effect={effect} />
        ))}
      </div>
    </section>
  );
}

function RelatedEffectCard({ effect }: { effect: RelatedEffect }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={effect.href}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="rounded-lg overflow-hidden bg-gray-900 border border-gray-800 group-hover:border-gray-700 transition-all duration-300">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-950">
          <img
            src={effect.image}
            alt={effect.title}
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 ${
              isHovered ? "scale-105" : "scale-100"
            }`}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Hover overlay */}
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
              isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-6 py-2.5 rounded-lg whitespace-nowrap">
                Try Now
              </span>
            </div>
          </div>
        </div>

        {/* Title bar */}
        <div className="p-3 bg-gray-900 border-t border-gray-800">
          <h3 className="text-white text-sm font-medium line-clamp-1">
            {effect.title}
          </h3>
        </div>
      </div>
    </Link>
  );
}
