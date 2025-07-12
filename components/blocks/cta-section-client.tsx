"use client";

import { CTASection } from "./cta-section";

interface CTASectionClientProps {
  title: string;
  description: string;
  buttonText: string;
}

export function CTASectionClient(props: CTASectionClientProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <CTASection
      {...props}
      onButtonClick={scrollToTop}
    />
  );
}