"use client";
import { GoogleNanoBanana } from "@/components/blocks/model-landing-page/nano-banana";
import { PartnersScroll } from "@/components/blocks/model-landing-page/partners-scroll";

export default function NanoBananaLandingPage() {
  
  return (
    <div className="flex flex-col">
      <div className="container mx-auto px-4 py-12">
        <GoogleNanoBanana  />
      </div>
      <PartnersScroll className="mt-8" />
    </div>
  );
}