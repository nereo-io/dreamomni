import { Post } from "@/types/post";
import { getSupabaseClient } from "./db";
import { locales } from "@/i18n/locale";

export enum PostStatus {
  Created = "created",
  Deleted = "deleted",
  Online = "online",
  Offline = "offline",
}

const POST_LIST_SELECT = [
  "uuid",
  "slug",
  "title",
  "description",
  "created_at",
  "updated_at",
  "status",
  "cover_url",
  "author_name",
  "author_avatar_url",
  "locale",
  "category",
  "tags",
].join(", ");

function normalizePosts(posts: Post[] | null | undefined): Post[] {
  return (posts || []).map((post) => ({
    ...post,
    tags: Array.isArray(post.tags) ? post.tags : [],
  }));
}

export async function insertPost(post: Post) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("posts").insert(post);

  if (error) {
    throw error;
  }

  return data;
}

export async function updatePost(uuid: string, post: Partial<Post>) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("posts")
    .update(post)
    .eq("uuid", uuid);

  if (error) {
    throw error;
  }

  return data;
}

export async function findPostByUuid(uuid: string): Promise<Post | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("uuid", uuid)
    .limit(1)
    .single();

  if (error) {
    return undefined;
  }

  return data;
}

export async function findPostBySlug(
  slug: string,
  locale: string
): Promise<Post | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("locale", locale)
    .limit(1)
    .single();

  if (error) {
    return undefined;
  }

  return data;
}

export async function getPostLocalesBySlug(
  slug: string,
  supportedLocales: string[] = locales
): Promise<string[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("posts")
    .select("locale")
    .eq("slug", slug)
    .eq("status", PostStatus.Online)
    .in("locale", supportedLocales);

  if (error || !data) {
    return [];
  }

  return Array.from(
    new Set(
      data
        .map((post) => post.locale)
        .filter((locale): locale is string => Boolean(locale))
    )
  );
}

export async function getAllPosts(
  page: number = 1,
  limit: number = 50
): Promise<Post[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    return [];
  }

  return data;
}

export async function getPostsByLocale(
  locale: string,
  page: number = 1,
  limit: number = 50
): Promise<Post[]> {
  const { posts } = await getPostsPageByLocale(locale, page, limit);

  return posts;
}

export async function getPostsPageByLocale(
  locale: string,
  page: number = 1,
  limit: number = 50
): Promise<{ posts: Post[]; hasMore: boolean }> {
  const supabase = getSupabaseClient();
  const offset = (page - 1) * limit;
  const { data, error } = await supabase
    .from("posts")
    .select(POST_LIST_SELECT)
    .eq("locale", locale)
    .eq("status", PostStatus.Online)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit);

  if (error) {
    return {
      posts: [],
      hasMore: false,
    };
  }

  const rows = (data || []) as unknown as Post[];
  const posts = rows.slice(0, limit);

  return {
    posts,
    hasMore: rows.length > limit,
  };
}

export async function getPostCountByLocale(locale: string): Promise<number> {
  const supabase = getSupabaseClient();
  const { count, error } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("locale", locale)
    .eq("status", PostStatus.Online);

  if (error) {
    return 0;
  }

  return count || 0;
}

export async function getRelatedPosts(
  post: Pick<Post, "category" | "locale" | "slug" | "uuid">,
  limit: number = 3
): Promise<Post[]> {
  const supabase = getSupabaseClient();

  async function runQuery(category?: string) {
    let query = supabase
      .from("posts")
      .select("*")
      .eq("status", PostStatus.Online)
      .order("created_at", { ascending: false })
      .range(0, limit - 1);

    if (post.locale) {
      query = query.eq("locale", post.locale);
    }

    if (post.uuid) {
      query = query.neq("uuid", post.uuid);
    } else if (post.slug) {
      query = query.neq("slug", post.slug);
    }

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      return [];
    }

    return normalizePosts(data);
  }

  const category = post.category?.trim();
  const categoryMatches = category ? await runQuery(category) : [];

  if (categoryMatches.length >= limit) {
    return categoryMatches.slice(0, limit);
  }

  const fallbackMatches = await runQuery();
  const mergedPosts = [...categoryMatches];

  for (const item of fallbackMatches) {
    const exists = mergedPosts.some((existingPost) => {
      if (existingPost.uuid && item.uuid) {
        return existingPost.uuid === item.uuid;
      }

      return existingPost.slug === item.slug;
    });

    if (exists) {
      continue;
    }

    mergedPosts.push(item);

    if (mergedPosts.length === limit) {
      break;
    }
  }

  return normalizePosts(mergedPosts);
}

export async function findPostByOutrankId(
  outrankId: string
): Promise<Post | undefined> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("outrank_id", outrankId)
    .single();

  if (error) {
    return undefined;
  }

  return data;
}

export async function upsertPostFromOutrank(post: Post) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("posts")
    .upsert(post, { onConflict: "outrank_id" });

  if (error) {
    throw error;
  }

  return data;
}
