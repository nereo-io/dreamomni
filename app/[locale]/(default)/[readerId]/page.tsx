import { getReaderPage } from "@/services/page"
import CustomerInputForm from "@/components/readers/CustomerInputForm"
// import { unstable_setRequestLocale } from "next-intl/server";

export const runtime = "edge";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  let canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}`;

  if (locale !== "en") {
    canonicalUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/${locale}`;
  }

  return {
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function ReaderPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  // unstable_setRequestLocale(locale);
  const messages = await getReaderPage(locale);
  
  return <CustomerInputForm messages={messages} />;
}