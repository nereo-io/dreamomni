import { Metadata } from "next";
import TermsOfServiceContent from "@/app/(legal)/terms-of-service/page.mdx";
import { buildLegalPageMetadata } from "../metadata";

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Metadata {
  return buildLegalPageMetadata(locale, "/terms-of-service", "Terms of Service");
}

export default function LocalizedTermsOfServicePage() {
  return <TermsOfServiceContent />;
}
