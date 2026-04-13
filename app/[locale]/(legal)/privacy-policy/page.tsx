import { Metadata } from "next";
import PrivacyPolicyContent from "@/app/(legal)/privacy-policy/page.mdx";
import { buildLegalPageMetadata } from "../metadata";

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Metadata {
  return buildLegalPageMetadata(locale, "/privacy-policy", "Privacy Policy");
}

export default function LocalizedPrivacyPolicyPage() {
  return <PrivacyPolicyContent />;
}
