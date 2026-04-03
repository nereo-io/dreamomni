'use client';

import Image from 'next/image';
import { ArrowRight, Search } from 'lucide-react';
import moment from 'moment';
import { useDeferredValue, useEffect, useState } from 'react';

import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Blog as BlogType } from '@/types/blocks/blog';
import { buildPaginationItems } from '@/utils/pagination';

type BlogItem = NonNullable<BlogType['items']>[number];

function getPostHref(item: BlogItem) {
  if (item.url) {
    return item.url;
  }

  if (!item.locale || item.locale === 'en') {
    return `/blog/${item.slug}`;
  }

  return `/${item.locale}/blog/${item.slug}`;
}

function getRelativeDate(date?: string) {
  return date ? moment(date).fromNow() : null;
}

function getStableDateLabel(date?: string) {
  return date ? moment.utc(date).format('MMM D, YYYY') : null;
}

function useRelativeDateLabel(date?: string) {
  const fallbackLabel = getStableDateLabel(date);
  const [label, setLabel] = useState<string | null>(fallbackLabel);

  useEffect(() => {
    setLabel(getRelativeDate(date));
  }, [date]);

  return label;
}

function getPaginationHref(basePath?: string, page: number = 1) {
  if (!basePath) {
    return '#';
  }

  if (page <= 1) {
    return basePath;
  }

  return `${basePath}?page=${page}`;
}

function ArticleCard({
  item,
  ctaText,
}: {
  item: BlogItem;
  ctaText?: string;
}) {
  const relativeDate = useRelativeDateLabel(item.created_at);

  return (
    <a
      href={getPostHref(item)}
      target={item.target || '_self'}
      rel={item.target === '_blank' ? 'noreferrer' : undefined}
      className="group block h-full"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/40 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
        {item.cover_url ? (
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image
              src={item.cover_url}
              alt={item.title || ''}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
        ) : (
          <div className="aspect-[16/9] bg-gradient-to-br from-primary/10 via-background to-cyan-500/10" />
        )}
        <div className="flex flex-1 flex-col px-5 py-5">
          {relativeDate ? (
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {relativeDate}
            </p>
          ) : null}
          <h3 className="mt-3 text-lg font-semibold leading-tight text-foreground md:text-xl">
            {item.title}
          </h3>
          {item.description ? (
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">
              {item.description}
            </p>
          ) : null}
          <div className="mt-6 flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">{item.author_name || ''}</span>
            {ctaText ? (
              <span className="inline-flex items-center text-sm font-medium text-foreground">
                {ctaText}
                <ArrowRight className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </a>
  );
}

export default function Blog({
  blog,
  featuredLabel = 'Featured article',
  searchPlaceholder = 'Search articles',
  emptyText = 'No articles match your search.',
}: {
  blog: BlogType;
  featuredLabel?: string;
  searchPlaceholder?: string;
  emptyText?: string;
}) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const items = blog.items || [];
  const currentPage = blog.current_page || 1;
  const pageSize = blog.page_size || items.length || 1;
  const totalItems = blog.total_items || items.length;
  const totalPages = blog.total_pages || 1;

  const filteredItems = deferredQuery
    ? items.filter((item) => {
        const searchableText = `${item.title || ''} ${item.description || ''}`.toLowerCase();
        return searchableText.includes(deferredQuery);
      })
    : items;

  const featuredItem = filteredItems[0];
  const gridItems = filteredItems.slice(1);
  const paginationItems =
    totalPages > 1 ? buildPaginationItems(currentPage, totalPages, 7) : [];
  const pageStart = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = totalItems === 0 ? 0 : pageStart + items.length - 1;
  const resultSummary = deferredQuery
    ? `${filteredItems.length} match${filteredItems.length === 1 ? '' : 'es'} on this page`
    : `Showing ${pageStart}-${pageEnd} of ${totalItems} article${
        totalItems === 1 ? '' : 's'
      }`;

  if (blog.disabled) {
    return null;
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
            <div className="flex flex-col gap-3">
              <label className="relative mx-auto block w-full max-w-2xl">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  aria-label="Search blog articles on this page"
                  className="h-12 rounded-full border-border/60 bg-background pl-11 pr-4"
                />
              </label>
              <p className="text-center text-sm text-muted-foreground">
                {resultSummary}
              </p>
            </div>
          </div>

          {featuredItem ? (
            <div className="mb-8">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                {featuredLabel}
              </p>
              <a
                href={getPostHref(featuredItem)}
                target={featuredItem.target || '_self'}
                rel={featuredItem.target === '_blank' ? 'noreferrer' : undefined}
                className="group grid overflow-hidden rounded-[2rem] border border-border/70 bg-card/40 shadow-[0_20px_60px_-32px_rgba(15,23,42,0.45)] transition-all duration-300 hover:border-primary/40 hover:shadow-[0_24px_70px_-32px_rgba(15,23,42,0.55)] lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden lg:min-h-[420px] lg:aspect-auto">
                  {featuredItem.cover_url ? (
                    <Image
                      src={featuredItem.cover_url}
                      alt={featuredItem.title || ''}
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
                  {blog.read_more_text ? (
                    <p className="mt-8 inline-flex items-center text-sm font-medium text-foreground">
                      {blog.read_more_text}
                      <ArrowRight className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </p>
                  ) : null}
                </div>
              </a>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 px-6 py-16 text-center text-muted-foreground">
              {emptyText}
            </div>
          )}

          {gridItems.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {gridItems.map((item, index) => (
                <ArticleCard
                  key={item.slug || item.title || index}
                  item={item}
                  ctaText={blog.read_more_text}
                />
              ))}
            </div>
          ) : null}
        </div>

        {totalPages > 1 ? (
          <Pagination className="mt-2">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={getPaginationHref(blog.base_path, currentPage - 1)}
                  className={
                    currentPage === 1 ? 'pointer-events-none opacity-50' : undefined
                  }
                />
              </PaginationItem>
              {paginationItems.map((item, index) =>
                item === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      href={getPaginationHref(blog.base_path, item)}
                      isActive={currentPage === item}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  href={getPaginationHref(blog.base_path, currentPage + 1)}
                  className={
                    currentPage === totalPages
                      ? 'pointer-events-none opacity-50'
                      : undefined
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        ) : null}
      </div>
    </section>
  );
}
