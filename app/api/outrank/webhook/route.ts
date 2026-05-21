import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import { upsertPostFromOutrank, PostStatus } from "@/models/post";

interface OutrankArticle {
  id: string;
  title: string;
  slug: string;
  content_markdown: string;
  content_html: string;
  meta_description: string;
  image_url: string;
  tags: string[];
  created_at: string;
}

async function saveArticle(article: OutrankArticle) {
  const post = {
    outrank_id: article.id,
    slug: article.slug,
    title: article.title,
    description: article.meta_description,
    content: article.content_markdown,
    content_html: article.content_html,
    content_markdown: article.content_markdown,
    meta_description: article.meta_description,
    image_url: article.image_url,
    cover_url: article.image_url,
    tags: article.tags,
    status: PostStatus.Online,
    locale: "en",
    created_at: article.created_at,
    updated_at: new Date().toISOString(),
  };
  
  await upsertPostFromOutrank(post);
}

function getArticlesFromPayload(body: any): OutrankArticle[] {
  if (body.event_type === "publish_articles") {
    return body.data?.articles || [];
  }

  if (body.event_type === "update_article" && body.data?.article) {
    return [body.data.article];
  }

  return [];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Token verification
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    const expectedToken = process.env.OUTRANK_WEBHOOK_SECRET;
    
    if (!expectedToken || token !== expectedToken) {
      console.error("[OUTRANK] Auth failed");
      return respErr("Unauthorized");
    }
    
    const articles = getArticlesFromPayload(body);
    if (articles.length > 0) {
      console.log(`[OUTRANK] Processing ${articles.length} articles`);
      await Promise.all(articles.map((a: OutrankArticle) => saveArticle(a)));
    }
    
    return respData({ received: true });
  } catch (error) {
    console.error("[OUTRANK] Error:", error instanceof Error ? error.message : "Unknown error");
    return respErr("Failed");
  }
}

export async function GET() {
  return respData({ status: "ok" });
}
