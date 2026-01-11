import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/models/db";
import { getUserInfo } from "@/services/user";
import { IMAGE_CACHE_CONTROL, VIDEO_CACHE_CONTROL } from "@/lib/cache-control";

export const runtime = "nodejs";

const DEFAULT_ALLOWED_HOSTS = ["r2.veo3ai.io", "static-lib.s3.amazonaws.com"];

function getAllowedHosts(): Set<string> {
  const hosts = new Set<string>();

  DEFAULT_ALLOWED_HOSTS.forEach((host) => hosts.add(host));

  const envAllowed = process.env.VIDEO_PROXY_ALLOWED_HOSTS;
  if (envAllowed) {
    envAllowed
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean)
      .forEach((host) => hosts.add(host));
  }

  const storageDomain = process.env.STORAGE_DOMAIN;
  if (storageDomain) {
    try {
      const { hostname } = new URL(storageDomain);
      if (hostname) {
        hosts.add(hostname.toLowerCase());
      }
    } catch (error) {
      console.warn("Invalid STORAGE_DOMAIN for agent asset download:", error);
    }
  }

  return hosts;
}

function isHostAllowed(hostname: string, allowedHosts: Set<string>): boolean {
  const normalizedHostname = hostname.toLowerCase();
  for (const allowed of allowedHosts) {
    if (normalizedHostname === allowed) {
      return true;
    }
    if (normalizedHostname.endsWith(`.${allowed}`)) {
      return true;
    }
  }
  return false;
}

function sanitizeFilename(filename: string): string {
  const trimmed = filename.trim().replace(/"/g, "");
  const safe = trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
  return safe || "asset";
}

function getFileExtension(url: string | null, fallback: string): string {
  if (!url) return fallback;
  const cleaned = url.split("?")[0]?.split("#")[0] || "";
  const parts = cleaned.split(".");
  const ext = parts.length > 1 ? parts[parts.length - 1] : "";
  return ext ? ext.toLowerCase() : fallback;
}

function getFileType(assetType: string): "image" | "audio" | "video" | "unknown" {
  if (["image", "character_ref", "scene_ref"].includes(assetType)) return "image";
  if (["background_music"].includes(assetType)) return "audio";
  if (["clip", "final", "final_with_bgm"].includes(assetType)) return "video";
  return "unknown";
}

async function incrementDownloadCount(assetId: string) {
  const supabase = getSupabaseClient();
  try {
    await supabase.rpc("increment_agent_asset_download_count", {
      asset_id: assetId,
    });
  } catch (error) {
    console.error("[Agent Asset Download] Update count failed:", error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const assetId = params.id;
  if (!assetId) {
    return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
  }

  const userInfo = await getUserInfo();
  if (!userInfo?.uuid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseClient();
  const { data: asset, error: assetError } = await supabase
    .from("agent_assets")
    .select("id, job_id, asset_type, url, metadata")
    .eq("id", assetId)
    .single();

  if (assetError || !asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  if (!asset.url) {
    return NextResponse.json({ error: "Asset URL not available" }, { status: 404 });
  }

  const { data: job, error: jobError } = await supabase
    .from("agent_jobs")
    .select("user_id")
    .eq("id", asset.job_id)
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.user_id !== userInfo.uuid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(asset.url);
  } catch (error) {
    return NextResponse.json({ error: "Invalid asset URL" }, { status: 400 });
  }

  const allowedHosts = getAllowedHosts();
  if (!isHostAllowed(parsedUrl.hostname, allowedHosts)) {
    return NextResponse.json({ error: "Invalid asset source" }, { status: 400 });
  }

  const filenameParam = request.nextUrl.searchParams.get("filename");
  const fileType = getFileType(asset.asset_type || "");
  const fallbackExt =
    fileType === "image" ? "png" : fileType === "audio" ? "mp3" : "mp4";
  const fileExt = getFileExtension(asset.url, fallbackExt);
  const filename = sanitizeFilename(
    filenameParam || `${asset.asset_type || "asset"}.${fileExt}`
  );

  await incrementDownloadCount(asset.id);

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(parsedUrl.toString());
  } catch (error) {
    console.error("[Agent Asset Download] Fetch failed:", error);
    return NextResponse.json(
      { error: "Unable to download asset" },
      { status: 500 }
    );
  }

  if (!upstreamResponse.ok) {
    return NextResponse.json(
      { error: "Failed to fetch asset" },
      { status: upstreamResponse.status }
    );
  }

  const headers = new Headers(upstreamResponse.headers);
  const cacheControl =
    fileType === "image" ? IMAGE_CACHE_CONTROL : VIDEO_CACHE_CONTROL;
  const existingCacheControl = headers.get("Cache-Control");

  headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  if (!existingCacheControl) {
    headers.set("Cache-Control", cacheControl);
  }
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Expose-Headers", "Content-Disposition");
  headers.set("X-Content-Type-Options", "nosniff");

  const body = upstreamResponse.body;
  if (!body) {
    const buffer = await upstreamResponse.arrayBuffer();
    return new Response(buffer, {
      status: upstreamResponse.status,
      headers,
    });
  }

  const reader = body.getReader();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) controller.enqueue(value);
        }
      } catch (error) {
        controller.error(error);
      } finally {
        reader.releaseLock();
      }
    },
  });

  return new Response(stream, {
    status: upstreamResponse.status,
    headers,
  });
}
