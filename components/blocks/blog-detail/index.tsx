"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { ArrowRight } from "lucide-react";

import Crumb from "./crumb";
import Markdown from "@/components/markdown";
import { extractH2Headings } from "@/components/markdown/utils";
import { cn } from "@/lib/utils";
import { Post } from "@/types/post";
import moment from "moment";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

function getPostHref(post: Post) {
  if (!post.locale || post.locale === "en") {
    return `/blog/${post.slug}`;
  }

  return `/${post.locale}/blog/${post.slug}`;
}

function TableOfContents({ content }: { content: string }) {
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
        Table of Contents
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

function RelatedArticles({ posts }: { posts: Post[] }) {
  if (!posts.length) {
    return null;
  }

  return (
    <div className="mt-16 border-t border-border/60 pt-12">
      <div className="mb-8">
        <h2 className="text-2xl font-bold md:text-3xl">Related Articles</h2>
        <p className="mt-2 text-sm text-muted-foreground md:text-base">
          More posts in the same locale you may want to read next.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((relatedPost) => (
          <Link
            key={relatedPost.uuid ?? relatedPost.slug}
            href={getPostHref(relatedPost)}
            className="group overflow-hidden rounded-2xl border border-border/70 bg-card/40 transition-colors hover:border-primary/40 hover:bg-card"
          >
            {relatedPost.cover_url ? (
              <div className="overflow-hidden">
                <img
                  src={relatedPost.cover_url}
                  alt={relatedPost.title || ""}
                  className="aspect-[16/9] h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
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
                Read article
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
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
  return (
    <section className="py-16">
      <div className="container">
        <Crumb post={post} />
        <h1 className="mb-7 mt-9 max-w-3xl text-2xl font-bold md:mb-10 md:text-4xl">
          {post.title}
        </h1>
        <div className="flex items-center gap-3 text-sm md:text-base">
          {post.author_avatar_url && (
            <Avatar className="h-8 w-8 border">
              <AvatarImage
                src={post.author_avatar_url}
                alt={post.author_name}
              />
            </Avatar>
          )}
          <div>
            {post.author_name && (
              <span className="font-medium">{post.author_name}</span>
            )}

            <span className="ml-2 text-muted-foreground">
              on {post.created_at && moment(post.created_at).fromNow()}
            </span>
          </div>
        </div>
        <div className="relative mt-0 grid max-w-screen-xl gap-4 lg:mt-0 lg:grid lg:grid-cols-12 lg:gap-6">
          <div className="order-2 lg:order-none lg:col-span-8">
            {post.content && <Markdown content={post.content} />}
            <RelatedArticles posts={relatedPosts} />
          </div>
          <div className="order-1 hidden h-fit flex-col text-sm lg:order-none lg:col-span-3 lg:col-start-10 lg:flex lg:text-xs">
            {post.content && <TableOfContents content={post.content} />}
          </div>
        </div>
      </div>
    </section>
  );
}
