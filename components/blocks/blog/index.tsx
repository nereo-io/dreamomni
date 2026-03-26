'use client';

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Blog as BlogType } from "@/types/blocks/blog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

const DEFAULT_PAGE_SIZE = 24;

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

export default function Blog({
  blog,
  locale,
  initialHasMore = false,
  pageSize = DEFAULT_PAGE_SIZE,
  loadMoreText = "Load more",
  loadingText = "Loading...",
}: {
  blog: BlogType;
  locale: string;
  initialHasMore?: boolean;
  pageSize?: number;
  loadMoreText?: string;
  loadingText?: string;
}) {
  const [items, setItems] = useState(blog.items || []);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setItems(blog.items || []);
    setPage(1);
    setHasMore(initialHasMore);
    setIsLoading(false);
  }, [blog.items, initialHasMore, locale]);

  if (blog.disabled) {
    return null;
  }

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
        <div className="w-full flex flex-wrap items-start">
          {items?.map((item, idx) => {
            return (
              <a
                key={`${item.slug || "post"}-${idx}`}
                href={getPostHref(item)}
                target={item.target || "_self"}
                className="w-full md:w-1/3 p-4"
              >
                <div className="flex flex-col overflow-clip rounded-xl border border-border">
                  {item.cover_url && (
                    <div className="relative aspect-[16/9]">
                      <Image
                        src={item.cover_url}
                        alt={item.title || ""}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover object-center"
                      />
                    </div>
                  )}
                  <div className="px-4 py-4 md:px-4 md:py-4 lg:px-4 lg:py-4">
                    <h3 className="mb-3 text-lg font-semibold md:mb-4 md:text-xl lg:mb-6">
                      {item.title}
                    </h3>
                    <p className="mb-3 text-muted-foreground md:mb-4 lg:mb-6">
                      {item.description}
                    </p>
                    {blog.read_more_text && (
                      <p className="flex items-center hover:underline">
                        {blog.read_more_text}
                        <ArrowRight className="ml-2 size-4" />
                      </p>
                    )}
                  </div>
                </div>
              </a>
            );
          })}
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
