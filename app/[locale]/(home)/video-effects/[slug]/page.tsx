import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getSupabaseClient } from "@/models/db";
import { getEffectConfigBySlug } from "@/models/effectConfig";
import EffectDetailClient from "./client";

export async function generateMetadata({
  params,
}: {
  params: { slug: string; locale: string };
}) {
  const supabase = getSupabaseClient();
  const effect = await getEffectConfigBySlug(supabase, params.slug);
  
  if (!effect) {
    return {
      title: "Effect Not Found",
      description: "The requested video effect could not be found.",
    };
  }

  const locale = await getLocale();
  const title = effect.seo_title?.[locale] || effect.title[locale] || effect.title.en;
  const description = effect.seo_description?.[locale] || effect.description[locale] || effect.description.en;
  const keywords = effect.seo_keywords?.[locale] || "";

  return {
    title,
    description,
    keywords,
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
  const supabase = getSupabaseClient();
  const effect = await getEffectConfigBySlug(supabase, params.slug);

  if (!effect) {
    notFound();
  }

  const locale = await getLocale();

  return <EffectDetailClient effect={effect} locale={locale} />;
}