import { Metadata } from "next";
import RefundPolicyContent from "@/app/(legal)/refund-policy/page.mdx";
import { buildLegalPageMetadata } from "../metadata";

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Metadata {
  return buildLegalPageMetadata(locale, "/refund-policy", "Refund Policy");
}

export default function LocalizedRefundPolicyPage() {
  return <RefundPolicyContent />;
}
