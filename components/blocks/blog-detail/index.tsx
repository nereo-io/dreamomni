"use client";

import Image from "next/image";
import StructuredData from "@/components/seo/structured-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight, Check, Copy, Twitter } from "lucide-react";
import { useTranslations } from "next-intl";

import Crumb from "./crumb";
import Markdown from "@/components/markdown";
import {
  createMarkdownRenderer,
  extractH2Headings,
} from "@/components/markdown/utils";
import { cn } from "@/lib/utils";
import { Post } from "@/types/post";
import moment from "moment";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type BlogCtaVariant = "default" | "pricing" | "sora" | "tutorial";

function getPostHref(post: Post) {
  if (!post.locale || post.locale === "en") {
    return `/blog/${post.slug}`;
  }

  return `/${post.locale}/blog/${post.slug}`;
}

function getLocaleHref(path: string, locale?: string) {
  if (!locale || locale === "en") {
    return path;
  }

  return `/${locale}${path}`;
}

function getAbsolutePostHref(post: Post) {
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "https://geminiomni.tv";

  return new URL(getPostHref(post), baseUrl).toString();
}

function includesAny(value: string, keywords: string[]) {
  return keywords.some((keyword) => value.includes(keyword));
}

function getBlogCtaVariant(post: Post): BlogCtaVariant {
  const slug = (post.slug || "").toLowerCase();
  const tags = (post.tags || []).map((tag) => tag.toLowerCase());
  const category = (post.category || "").toLowerCase();
  const searchableValues = [slug, category, ...tags].filter(Boolean);
  const searchableText = searchableValues.join(" ");

  if (includesAny(searchableText, ["sora"])) {
    return "sora";
  }

  if (
    includesAny(searchableText, [
      "pricing",
      "price",
      "prices",
      "plan",
      "plans",
      "cost",
      "costs",
      "credit",
      "credits",
      "subscription",
      "subscriptions",
      "billing",
      "free-plan",
      "free-trial",
      "no-credit-card",
    ])
  ) {
    return "pricing";
  }

  if (
    includesAny(searchableText, [
      "tutorial",
      "guide",
      "how-to",
      "howto",
      "tips",
      "walkthrough",
      "step-by-step",
      "prompt-guide",
    ])
  ) {
    return "tutorial";
  }

  return "default";
}

function splitContentForInlineCta(content: string) {
  if (!content.trim()) {
    return {
      introContent: "",
      remainingContent: "",
    };
  }

  const md = createMarkdownRenderer();
  const tokens = md.parse(content, {});
  const topLevelParagraphs = tokens.filter(
    (token) =>
      token.type === "paragraph_open" &&
      token.level === 0 &&
      Array.isArray(token.map)
  );

  if (!topLevelParagraphs.length) {
    return {
      introContent: content,
      remainingContent: "",
    };
  }

  const splitAfterParagraph = topLevelParagraphs[Math.min(topLevelParagraphs.length, 3) - 1];
  const splitLine = splitAfterParagraph.map?.[1];

  if (typeof splitLine !== "number") {
    return {
      introContent: content,
      remainingContent: "",
    };
  }

  const lines = content.split("\n");

  return {
    introContent: lines.slice(0, splitLine).join("\n").trim(),
    remainingContent: lines.slice(splitLine).join("\n").trim(),
  };
}

function getReadingTimeMinutes(content: string) {
  const plainText = content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!plainText) {
    return 1;
  }

  return Math.max(1, Math.ceil(plainText.split(/\s+/).length / 200));
}

function getStableDateLabel(date?: string) {
  return date ? moment.utc(date).format('MMM D, YYYY') : '';
}

function TableOfContents({ content }: { content: string }) {
  const t = useTranslations('blogDetail');
  const headings = useMemo(() => extractH2Headings(content), [content]);
  const [activeHeading, setActiveHeading] = useState(headings[0]?.id ?? "");

  useEffect(() => {
    setActiveHeading(headings[0]?.id ?? "");
  }, [headings]);

  useEffect(() => {
    if (!headings.length) {
      return;
    }

    const headingElements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (!headingElements.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleHeadings = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (entryA, entryB) =>
              entryA.boundingClientRect.top - entryB.boundingClientRect.top
          );

        if (visibleHeadings[0]?.target.id) {
          setActiveHeading(visibleHeadings[0].target.id);
          return;
        }

        const lastPassedHeading = headingElements
          .filter((element) => element.getBoundingClientRect().top <= 140)
          .at(-1);

        if (lastPassedHeading?.id) {
          setActiveHeading(lastPassedHeading.id);
        }
      },
      {
        rootMargin: "-96px 0px -60% 0px",
        threshold: [0, 1],
      }
    );

    headingElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [headings]);

  if (!headings.length) {
    return null;
  }

  return (
    <div className="sticky top-8 rounded-2xl border border-border/60 bg-background/80 p-5 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <p className="mb-4 text-sm font-semibold text-foreground">
        {t("tocTitle")}
      </p>
      <nav aria-label="Table of Contents">
        <ul className="space-y-2">
          {headings.map((heading) => (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                className={cn(
                  "block border-l pl-3 text-sm text-muted-foreground transition-colors hover:text-foreground",
                  activeHeading === heading.id
                    ? "border-primary text-foreground"
                    : "border-border"
                )}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

function RelatedArticles({
  posts,
  locale,
}: {
  posts: Post[];
  locale?: string;
}) {
  const t = useTranslations("blogDetail");

  if (!posts.length) {
    return null;
  }

  return (
    <div className="mt-16 border-t border-border/60 pt-12">
      <div className="mb-8">
        <h2 className="text-2xl font-bold md:text-3xl">
          {t("relatedTitle")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          {t("relatedDescription")}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={getLocaleHref("/blog", locale)}
            className="inline-flex items-center rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
          >
            {t("browseMore")}
          </Link>
          <Link
            href={getLocaleHref("/image-to-video", locale)}
            className="inline-flex items-center rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
          >
            {t("imageToVideo")}
          </Link>
          <Link
            href={getLocaleHref("/text-to-video", locale)}
            className="inline-flex items-center rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
          >
            {t("textToVideo")}
          </Link>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((relatedPost) => (
          <Link
            key={relatedPost.uuid ?? relatedPost.slug}
            href={getPostHref(relatedPost)}
            className="group overflow-hidden rounded-2xl border border-border/70 bg-card/40 transition-colors hover:border-primary/40 hover:bg-card"
          >
            {relatedPost.cover_url ? (
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={relatedPost.cover_url}
                  alt={relatedPost.title || ""}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
            ) : (
              <div className="flex aspect-[16/9] items-end bg-muted/50 p-5">
                <span className="text-sm font-medium text-muted-foreground">
                  {relatedPost.title}
                </span>
              </div>
            )}
            <div className="p-5">
              <h3 className="line-clamp-2 text-lg font-semibold text-foreground">
                {relatedPost.title}
              </h3>
              <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
                {relatedPost.description}
              </p>
              <span className="mt-5 inline-flex items-center text-sm font-medium text-foreground">
                {t("readArticle")}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function InlineBlogCta({
  locale,
  variant,
}: {
  locale?: string;
  variant: BlogCtaVariant;
}) {
  const t = useTranslations("blogDetail");

  return (
    <div className="my-8 rounded-2xl border border-primary/20 bg-primary/5 p-4 md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {t(`cta.headlines.${variant}`)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("cta.pricing")}
          </p>
        </div>
        <Link
          href={getLocaleHref("/text-to-video", locale)}
          className="inline-flex w-fit items-center rounded-lg border border-primary/30 bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          {t("cta.inlineButton")}
        </Link>
      </div>
    </div>
  );
}

function PrimaryBlogCta({
  locale,
  variant,
}: {
  locale?: string;
  variant: BlogCtaVariant;
}) {
  const t = useTranslations("blogDetail");

  return (
    <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8">
      <h2 className="text-2xl font-bold md:text-3xl">
        {t(`cta.headlines.${variant}`)}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
        {t(`cta.descriptions.${variant}`)}
      </p>
      <p className="mt-3 text-sm font-medium text-foreground md:text-base">
        {t("cta.pricing")}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={getLocaleHref("/image-to-video", locale)}
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t("cta.primaryButton")}
        </Link>
        <Link
          href={getLocaleHref("/text-to-video", locale)}
          className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          {t("cta.secondaryButton")}
        </Link>
        <Link
          href={getLocaleHref("/video-effects", locale)}
          className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          {t("cta.tertiaryButton")}
        </Link>
      </div>
    </div>
  );
}

export default function BlogDetail({
  post,
  relatedPosts,
}: {
  post: Post;
  relatedPosts: Post[];
}) {
  const t = useTranslations('blogDetail');
  const ctaVariant = useMemo(() => getBlogCtaVariant(post), [post]);
  const { introContent, remainingContent } = useMemo(
    () => splitContentForInlineCta(post.content || ""),
    [post.content]
  );
  const readingTime = useMemo(
    () => getReadingTimeMinutes(post.content || ""),
    [post.content]
  );
  const shareUrl = useMemo(() => getAbsolutePostHref(post), [post]);
  const shareText = useMemo(
    () => `${post.title || ""} ${shareUrl}`.trim(),
    [post.title, shareUrl]
  );
  const [copied, setCopied] = useState(false);
  const publishedDate = post.created_at || post.updated_at;
  const [publishedFromNow, setPublishedFromNow] = useState(
    getStableDateLabel(publishedDate)
  );

  useEffect(() => {
    setPublishedFromNow(publishedDate ? moment(publishedDate).fromNow() : "");
  }, [publishedDate]);

  const metaItems = [
    post.author_name?.trim(),
    t("readTime", { minutes: readingTime }),
    publishedFromNow || undefined,
  ].filter(Boolean);

  const authorInitial = (post.author_name || "?").trim().charAt(0).toUpperCase();

  function handleCopyLink() {
    const urlToCopy =
      typeof window !== "undefined" ? window.location.href : shareUrl;

    navigator.clipboard
      .writeText(urlToCopy)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  return (
    <section className="py-16">
      <StructuredData
        type="article"
        data={{
          title: post.title,
          description: post.description,
          publishedDate: post.created_at,
          modifiedDate: post.updated_at || post.created_at,
        }}
      />
      <div className="container">
        <Crumb post={post} />
        <div className="mx-auto mt-9 max-w-4xl">
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight md:text-5xl">
            {post.title}
          </h1>
          <div className="mt-7 flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/40 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between md:p-5">
            <div className="flex items-center gap-3">
              {(post.author_name || post.author_avatar_url) && (
                <Avatar className="h-10 w-10 border border-border/60">
                  <AvatarImage
                    src={post.author_avatar_url}
                    alt={post.author_name}
                  />
                  <AvatarFallback className="bg-primary/15 text-sm font-semibold text-primary">
                    {authorInitial}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm md:text-base">
                {metaItems.map((item, index) => (
                  <span
                    key={`${item}-${index}`}
                    className={cn(
                      "text-muted-foreground",
                      index === 0 && "font-medium text-foreground"
                    )}
                  >
                    {index > 0 && (
                      <span className="mr-2 text-border">·</span>
                    )}
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? t("linkCopied") : t("copyLink")}
              </button>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <Twitter className="h-4 w-4" />
                {t("shareOnX")}
              </a>
            </div>
          </div>
          {post.cover_url && (
            <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl shadow-[0_20px_50px_-24px_rgba(15,23,42,0.45)]">
              <Image
                src={post.cover_url}
                alt={post.title || ""}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 960px"
                className="object-cover"
              />
            </div>
          )}
        </div>
        <div className="relative mx-auto mt-10 grid max-w-screen-xl gap-4 lg:grid lg:grid-cols-12 lg:gap-6">
          <div className="order-2 lg:order-none lg:col-span-8">
            {introContent && <Markdown content={introContent} />}
            {post.content && (
              <InlineBlogCta locale={post.locale} variant={ctaVariant} />
            )}
            {remainingContent && <Markdown content={remainingContent} />}

            <PrimaryBlogCta locale={post.locale} variant={ctaVariant} />

            <RelatedArticles posts={relatedPosts} locale={post.locale} />
          </div>
          <div className="order-1 hidden h-fit flex-col text-sm lg:order-none lg:col-span-3 lg:col-start-10 lg:flex lg:text-xs">
            {post.content && <TableOfContents content={post.content} />}
          </div>
        </div>
      </div>
    </section>
  );
}
