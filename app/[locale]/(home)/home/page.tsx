import { redirect } from "next/navigation";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://dreamomni.ai";
  const canonicalUrl = locale === "en" ? baseUrl : `${baseUrl}/${locale}`;

  return {
    alternates: {
      canonical: canonicalUrl,
    },
    robots: "noindex,follow",
  };
}

export default function HomeAliasPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  redirect(locale === "en" ? "/" : `/${locale}`);
}
