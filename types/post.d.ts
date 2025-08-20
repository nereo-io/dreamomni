export interface Post {
  uuid?: string;
  slug?: string;
  title?: string;
  description?: string;
  content?: string;
  created_at?: string;
  updated_at?: string;
  status?: string;
  cover_url?: string;
  author_name?: string;
  author_avatar_url?: string;
  locale?: string;
  category?: string;
  tags?: string[];
  // Outrank fields
  outrank_id?: string;
  content_html?: string;
  content_markdown?: string;
  meta_description?: string;
  image_url?: string;
}
