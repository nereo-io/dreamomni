import type { Metadata } from "next";
import { OmniStudio } from "@/components/blocks/omni-studio";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "";
  const canonical =
    locale === "en"
      ? `${baseUrl}/omni-studio`
      : `${baseUrl}/${locale}/omni-studio`;

  return {
    title: "Omni Studio | GeminiOmni",
    description:
      "Create and edit Gemini Omni videos with text, image, video, audio ID, and character references.",
    alternates: {
      canonical,
    },
  };
}

export default function OmniStudioPage() {
  return <OmniStudio />;
}
