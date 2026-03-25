"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { useInViewport } from "@/hooks/useInViewport";
import { LandingPage } from "@/types/pages/landing";
import { SeedanceFeaturesBlockTranslations } from "@/types/blocks/seedance-features";

const DeferredImageToVideoShowcase = dynamic(
  () =>
    import("@/components/blocks/image-to-video-showcase").then(
      (mod) => mod.ImageToVideoShowcase
    ),
  {
    ssr: false,
    loading: () => <SectionPlaceholder minHeightClass="min-h-[720px]" />,
  }
);

const DeferredAIVideoShowcase = dynamic(
  () =>
    import("@/components/blocks/ai-video-showcase").then(
      (mod) => mod.AIVideoShowcase
    ),
  {
    ssr: false,
    loading: () => <SectionPlaceholder minHeightClass="min-h-[760px]" />,
  }
);

const DeferredSeedanceFeaturesBlock = dynamic(
  () => import("@/components/blocks/seedance-features"),
  {
    ssr: false,
    loading: () => <SectionPlaceholder minHeightClass="min-h-[1280px]" />,
  }
);

const DeferredGettingStarted = dynamic(
  () => import("@/components/blocks/getting-started"),
  {
    ssr: false,
    loading: () => <SectionPlaceholder minHeightClass="min-h-[720px]" />,
  }
);

const DeferredFAQ = dynamic(() => import("@/components/blocks/faq"), {
  ssr: false,
  loading: () => <SectionPlaceholder minHeightClass="min-h-[640px]" />,
});

const DeferredCTA = dynamic(() => import("@/components/blocks/cta"), {
  ssr: false,
  loading: () => <SectionPlaceholder minHeightClass="min-h-[320px]" />,
});

interface DeferredHomepageSectionsProps {
  page: LandingPage;
  seedanceFeatures: SeedanceFeaturesBlockTranslations;
}

function SectionPlaceholder({ minHeightClass }: { minHeightClass: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "w-full animate-pulse bg-gradient-to-b from-white/[0.04] via-white/[0.02] to-transparent",
        minHeightClass
      )}
    />
  );
}

function DeferredSection({
  children,
  minHeightClass,
}: {
  children: ReactNode;
  minHeightClass: string;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInViewport = useInViewport(sectionRef, { rootMargin: "500px 0px" });
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isInViewport) {
      setShouldRender(true);
    }
  }, [isInViewport]);

  return (
    <div ref={sectionRef}>
      {shouldRender ? children : <SectionPlaceholder minHeightClass={minHeightClass} />}
    </div>
  );
}

export default function DeferredHomepageSections({
  page,
  seedanceFeatures,
}: DeferredHomepageSectionsProps) {
  return (
    <>
      {page.imageToVideoShowcase && (
        <DeferredSection minHeightClass="min-h-[720px]">
          <DeferredImageToVideoShowcase data={page.imageToVideoShowcase} />
        </DeferredSection>
      )}
      {page.aiVideoShowcase && (
        <DeferredSection minHeightClass="min-h-[760px]">
          <DeferredAIVideoShowcase data={page.aiVideoShowcase} />
        </DeferredSection>
      )}
      <DeferredSection minHeightClass="min-h-[1280px]">
        <DeferredSeedanceFeaturesBlock translations={seedanceFeatures} />
      </DeferredSection>
      {page.gettingStarted && (
        <DeferredSection minHeightClass="min-h-[720px]">
          <DeferredGettingStarted data={page.gettingStarted} />
        </DeferredSection>
      )}
      {page.faq && (
        <DeferredSection minHeightClass="min-h-[640px]">
          <DeferredFAQ section={page.faq} />
        </DeferredSection>
      )}
      {page.cta && Array.isArray(page.cta) && page.cta.length > 0 && (
        <DeferredSection minHeightClass="min-h-[320px]">
          <DeferredCTA section={page.cta[0]} />
        </DeferredSection>
      )}
    </>
  );
}
