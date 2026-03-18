import { Blog } from "@/types/blocks/blog";
import { ArrowRight } from "lucide-react";

export default function BlogBlock({ blog }: { blog: Blog }) {
  return (
    <div className="w-full flex flex-wrap items-start">
      {blog.items?.map((item, idx) => (
        <a
          key={idx}
          href={item.url || `/${item.locale}/blog/${item.slug}`}
          target={item.target || "_self"}
          className="w-full md:w-1/3 p-4"
        >
          <div className="flex flex-col overflow-clip rounded-xl border border-border">
            {item.cover_url && (
              <div>
                <img
                  src={item.cover_url}
                  alt={item.title || ""}
                  className="aspect-[16/9] h-full w-full object-cover object-center"
                  loading="lazy"
                  decoding="async"
                  width={640}
                  height={360}
                />
              </div>
            )}
            <div className="px-4 py-4 md:px-4 md:py-4 lg:px-4 lg:py-4">
              <h3 className="mb-3 text-lg font-semibold md:mb-4 md:text-xl lg:mb-6">
                {item.title}
              </h3>
              <p className="mb-3 text-muted-foreground md:mb-4 lg:mb-6 line-clamp-2 h-12 overflow-hidden">
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
      ))}
    </div>
  );
}
