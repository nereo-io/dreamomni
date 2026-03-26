'use client';

import Image from "next/image";
import { ArrowRight, Search } from "lucide-react";
import { Blog as BlogType } from "@/types/blocks/blog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeferredValue, useEffect, useState } from "react";

const DEFAULT_PAGE_SIZE = 24;

type BlogItem = NonNullable<BlogType["items"]>[number];

interface BlogPostsResponse {
  code: number;
  data?: {
    items: BlogType["items"];
    hasMore: boolean;
  };
}

function getPostHref(item: NonNullable<BlogType["items"]>[number]) {
  if (item.url) {
    return item.url;
  }

  if (!item.locale || item.locale === "en") {
    return `/blog/${item.slug}`;
  }

  return `/${item.locale}/blog/${item.slug}`;
}

function ArticleCard({
  item,
  ctaText,
}: {
  item: BlogItem;
  ctaText?: string;
}) {
  return (
    <a
      href={getPostHref(item)}
      target={item.target || "_self"}
      rel={item.target === "_blank" ? "noreferrer" : undefined}
      className="group block h-full"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/40 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
        {item.cover_url && (
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image
              src={item.cover_url}
              alt={item.title || ""}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
        )}
        <div className="flex flex-1 flex-col px-5 py-5">
          <h3 className="text-lg font-semibold leading-tight text-foreground md:text-xl">
            {item.title}
          </h3>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground md:text-base">
            {item.description}
          </p>
          {ctaText && (
            <p className="mt-6 inline-flex items-center text-sm font-medium text-foreground">
              {ctaText}
              <ArrowRight className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </p>
          )}
        </div>
      </div>
    </a>
  );
}

export default function Blog({
  blog,
  locale,
  initialHasMore = false,
  pageSize = DEFAULT_PAGE_SIZE,
  loadMoreText = "Load more",
  loadingText = "Loading...",
  featuredLabel = "Featured article",
  searchPlaceholder = "Search articles",
  emptyText = "No articles match your search.",
}: {
  blog: BlogType;
  locale: string;
  initialHasMore?: boolean;
  pageSize?: number;
  loadMoreText?: string;
  loadingText?: string;
  featuredLabel?: string;
  searchPlaceholder?: string;
  emptyText?: string;
}) {
  const [items, setItems] = useState(blog.items || []);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    setItems(blog.items || []);
    setPage(1);
    setHasMore(initialHasMore);
    setIsLoading(false);
    setSearchQuery("");
  }, [blog.items, initialHasMore, locale]);

  if (blog.disabled) {
    return null;
  }

  const normalizedSearchQuery = deferredSearchQuery.trim().toLowerCase();
  const filteredItems = normalizedSearchQuery
    ? items.filter((item) => {
        const searchableText = `${item.title || ""} ${item.description || ""}`.toLowerCase();

        return searchableText.includes(normalizedSearchQuery);
      })
    : items;
  const featuredItem = filteredItems[0];
  const gridItems = filteredItems.slice(1);

  async function handleLoadMore() {
    if (isLoading || !hasMore) {
      return;
    }

    setIsLoading(true);

    try {
      const nextPage = page + 1;
      const response = await fetch(
        `/api/blog/posts?locale=${encodeURIComponent(locale)}&page=${nextPage}&limit=${pageSize}`
      );
      const result = (await response.json()) as BlogPostsResponse;

      if (!response.ok || result.code !== 0 || !result.data) {
        throw new Error("Failed to load more posts");
      }

      setItems((currentItems) => [...currentItems, ...(result.data?.items || [])]);
      setPage(nextPage);
      setHasMore(result.data.hasMore);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="w-full py-16">
      <div className="container flex flex-col items-center gap-8 lg:px-16">
        <div className="text-center">
          <p className="mb-6 text-xs font-medium uppercase tracking-wider">
            {blog.label}
          </p>
          <h1 className="mb-3 text-pretty text-3xl font-semibold md:mb-4 md:text-4xl lg:mb-6 lg:max-w-3xl lg:text-5xl">
            {blog.title}
          </h1>
          <p className="mb-8 text-muted-foreground md:text-base lg:max-w-2xl lg:text-lg">
            {blog.description}
          </p>
        </div>
        <div className="w-full">
          <div className="mb-8 rounded-3xl border border-border/60 bg-card/30 p-4 shadow-sm sm:p-5">
            <div className="relative mx-auto max-w-2xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-12 rounded-full border-border/60 bg-background pl-11 pr-4"
              />
            </div>
          </div>

          {featuredItem ? (
            <div className="mb-8">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                {featuredLabel}
              </p>
              <a
                href={getPostHref(featuredItem)}
                target={featuredItem.target || "_self"}
                rel={featuredItem.target === "_blank" ? "noreferrer" : undefined}
                className="group grid overflow-hidden rounded-[2rem] border border-border/70 bg-card/40 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.45)] transition-all duration-300 hover:border-primary/40 hover:shadow-[0_24px_70px_-32px_rgba(15,23,42,0.55)] lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden lg:min-h-[420px] lg:aspect-auto">
                  {featuredItem.cover_url ? (
                    <Image
                      src={featuredItem.cover_url}
                      alt={featuredItem.title || ""}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 60vw"
                      className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-end bg-muted/50 p-8">
                      <h2 className="text-2xl font-semibold text-foreground md:text-3xl">
                        {featuredItem.title}
                      </h2>
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center p-6 md:p-8 lg:p-10">
                  <h2 className="text-2xl font-semibold leading-tight text-foreground md:text-3xl lg:text-4xl">
                    {featuredItem.title}
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
                    {featuredItem.description}
                  </p>
                  {blog.read_more_text && (
                    <p className="mt-8 inline-flex items-center text-sm font-medium text-foreground">
                      {blog.read_more_text}
                      <ArrowRight className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </p>
                  )}
                </div>
              </a>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 px-6 py-16 text-center text-muted-foreground">
              {emptyText}
            </div>
          )}

          {gridItems.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {gridItems.map((item, idx) => (
                <ArticleCard
                  key={`${item.slug || "post"}-${idx}`}
                  item={item}
                  ctaText={blog.read_more_text}
                />
              ))}
            </div>
          )}
        </div>
        {hasMore && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="min-w-40"
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? loadingText : loadMoreText}
          </Button>
        )}
      </div>
    </section>
  );
}
