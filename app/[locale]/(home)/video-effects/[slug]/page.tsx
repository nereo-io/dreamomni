import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getEffectConfigBySlug } from "@/models/effectConfig";
import EffectDetailClient from "./client";

export async function generateMetadata({
  params,
}: {
  params: { slug: string; locale: string };
}) {
  const locale = await getLocale();
  const effect = await getEffectConfigBySlug(params.slug, locale);
  
  if (!effect) {
    return {
      title: "Effect Not Found",
      description: "The requested video effect could not be found.",
    };
  }

  const title = effect.title || "Video Effect";
  const description = effect.description || "Create amazing video effects with AI";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: effect.preview_image ? [effect.preview_image] : [],
    },
  };
}

export default async function EffectDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const locale = await getLocale();
  const effect = await getEffectConfigBySlug(params.slug, locale);

  if (!effect) {
    notFound();
  }

  return <EffectDetailClient effect={effect} locale={locale} />;
}