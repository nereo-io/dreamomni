import { IMAGE_CACHE_CONTROL } from "@/lib/cache-control";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function getAllowedHosts(): Set<string> {
  const hosts = new Set<string>();

  const storageDomain = process.env.STORAGE_DOMAIN;
  if (storageDomain) {
    try {
      const { hostname } = new URL(storageDomain);
      if (hostname) {
        hosts.add(hostname.toLowerCase());
      }
    } catch (error) {
      console.warn("Invalid STORAGE_DOMAIN for proxy-image:", error);
    }
  }

  return hosts;
}

function isHostAllowed(hostname: string, allowedHosts: Set<string>): boolean {
  const normalizedHostname = hostname.toLowerCase();
  for (const allowed of allowedHosts) {
    if (normalizedHostname === allowed) return true;
    if (normalizedHostname.endsWith(`.${allowed}`)) return true;
  }
  return false;
}

export async function GET(request: NextRequest) {
  try {
    const imageUrl = request.nextUrl.searchParams.get("url");
    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
    }

    const allowedHosts = getAllowedHosts();
    if (!isHostAllowed(parsedUrl.hostname, allowedHosts)) {
      return NextResponse.json({ error: "Invalid image source" }, { status: 400 });
    }

    const response = await fetch(parsedUrl.toString());
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: response.status }
      );
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": IMAGE_CACHE_CONTROL,
      },
    });
  } catch (error) {
    console.error("Error proxying image:", error);
    return NextResponse.json({ error: "Failed to proxy image" }, { status: 500 });
  }
}

