import { NextRequest, NextResponse } from "next/server";

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
      console.warn("Invalid STORAGE_DOMAIN for proxy-video:", error);
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
  return safe || "video.mp4";
}

export async function GET(request: NextRequest) {
  const videoUrl = request.nextUrl.searchParams.get("url");
  const filenameParam =
    request.nextUrl.searchParams.get("filename") || "video.mp4";

  if (!videoUrl) {
    return NextResponse.json(
      { error: "Video URL is required" },
      { status: 400 }
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(videoUrl);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid video URL" },
      { status: 400 }
    );
  }

  const allowedHosts = getAllowedHosts();
  if (!isHostAllowed(parsedUrl.hostname, allowedHosts)) {
    return NextResponse.json(
      { error: "Invalid video source" },
      { status: 400 }
    );
  }

  const rangeHeader = request.headers.get("range");
  let upstreamResponse: Response;

  try {
    upstreamResponse = await fetch(parsedUrl.toString(), {
      headers: rangeHeader ? { Range: rangeHeader } : undefined,
    });
  } catch (error) {
    console.error("proxy-video fetch failed:", error);
    return NextResponse.json(
      { error: "Unable to download video" },
      { status: 500 }
    );
  }

  if (!upstreamResponse.ok) {
    return NextResponse.json(
      { error: "Failed to fetch video" },
      { status: upstreamResponse.status }
    );
  }

  const headers = new Headers(upstreamResponse.headers);
  const sanitizedFilename = sanitizeFilename(filenameParam);

  headers.set(
    "Content-Disposition",
    `attachment; filename="${sanitizedFilename}"`
  );
  headers.set("Cache-Control", "private, max-age=0, must-revalidate");
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

  return new Response(body, {
    status: upstreamResponse.status,
    headers,
  });
}
