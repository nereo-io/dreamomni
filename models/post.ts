import { Post } from "@/types/post";
import { getSupabaseClient } from "./db";

export enum PostStatus {
  Created = "created",
  Deleted = "deleted",
  Online = "online",
  Offline = "offline",
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

export async function getPostLocalesBySlug(slug: string): Promise<string[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("posts")
    .select("locale")
    .eq("slug", slug)
    .eq("status", PostStatus.Online);

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
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("locale", locale)
    .eq("status", PostStatus.Online)
    .order("created_at", { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    return [];
  }

  return data;
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
