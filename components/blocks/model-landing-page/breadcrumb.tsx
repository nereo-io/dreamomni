"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import type { BreadcrumbSection } from "@/types/pages/model-landing-page";

interface BreadcrumbProps {
  section: BreadcrumbSection;
}

export default function Breadcrumb({ section }: BreadcrumbProps) {
  const { items } = section;
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://geminiomni.tv";

  // JSON-LD structured data for breadcrumb
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href && { item: `${baseUrl}${item.href}` }),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav
        aria-label="Breadcrumb"
        className="w-full max-w-7xl mx-auto px-4 py-4"
      >
        <ol className="flex items-center flex-wrap gap-1 text-sm text-muted-foreground">
          {items.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground/50" />
              )}
              {index === 0 && <Home className="w-4 h-4 mr-1" />}
              {item.href && index < items.length - 1 ? (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={
                    index === items.length - 1
                      ? "text-foreground font-medium"
                      : ""
                  }
                  aria-current={index === items.length - 1 ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
