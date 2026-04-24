"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { RelatedModelsSection } from "@/types/pages/model-landing-page";

interface RelatedModelsProps {
  section: RelatedModelsSection;
}

export default function RelatedModels({ section }: RelatedModelsProps) {
  const { title, models, buttonText = "Try Now" } = section;

  return (
    <section className="w-full py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
          {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((model, index) => (
            <Link
              key={index}
              href={`/${model.slug}`}
              className="group block p-6 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/50 transition-all duration-300"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <Image
                    src={model.logo}
                    alt={`${model.name} logo`}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                  {model.name}
                </h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                {model.description}
              </p>
              <div className="flex items-center text-primary text-sm font-medium">
                {buttonText}
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
