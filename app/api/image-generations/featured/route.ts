import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/models/db";
import type { ImageGenerationMode } from "@/types/image";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") as ImageGenerationMode | null;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const supabase = getSupabaseClient();

    // Build query - using only existing columns
    let query = supabase
      .from("image_generations")
      .select(`
        id,
        user_id,
        prompt,
        optimized_prompt,
        mode,
        model_id,
        provider,
        width,
        height,
        image_urls,
        image_urls_r2,
        input_image_urls,
        credits_used,
        is_featured,
        featured_at,
        featured_order,
        created_at
      `)
      .eq("is_featured", true)
      .eq("is_delete", false)
      .in("status", ["COMPLETED", "SAVED_TO_R2"]);

    // Filter by mode if specified
    if (mode) {
      query = query.eq("mode", mode);
    }

    // Apply ordering and pagination - prioritize newest items
    query = query
      .order("featured_at", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching featured images:", error);
      return NextResponse.json(
        {
          code: 1,
          message: "Failed to fetch featured images",
          error: error.message
        },
        { status: 500 }
      );
    }

    // Transform data to match frontend expectations
    const transformedData = (data || []).map(item => {
      // Get the first image URL
      let imageUrl = null;
      if (item.image_urls_r2 && Array.isArray(item.image_urls_r2) && item.image_urls_r2.length > 0) {
        imageUrl = item.image_urls_r2[0];
      } else if (item.image_urls && Array.isArray(item.image_urls) && item.image_urls.length > 0) {
        imageUrl = item.image_urls[0];
      }

      // Get the first input image URL for image-to-image mode
      let inputImageUrl = null;
      if (item.input_image_urls && Array.isArray(item.input_image_urls) && item.input_image_urls.length > 0) {
        inputImageUrl = item.input_image_urls[0];
      }

      // Calculate aspect ratio from width/height
      let aspectRatio = "";
      if (item.width && item.height) {
        const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
        const divisor = gcd(item.width, item.height);
        aspectRatio = `${item.width / divisor}:${item.height / divisor}`;
      }

      return {
        id: item.id,
        title: item.prompt ? item.prompt.substring(0, 50) + (item.prompt.length > 50 ? "..." : "") : "",
        prompt: item.optimized_prompt || item.prompt,
        imageUrl: imageUrl,
        inputImageUrl: inputImageUrl,
        mode: item.mode,
        model: item.model_id,
        provider: item.provider,
        aspectRatio: aspectRatio,
        creditsUsed: item.credits_used,
        createdAt: item.created_at
      };
    });

    return NextResponse.json({
      code: 0,
      data: transformedData,
      total: transformedData.length,
      message: "Featured images fetched successfully"
    });

  } catch (error) {
    console.error("Unexpected error in featured images API:", error);
    return NextResponse.json(
      {
        code: 1,
        message: "An unexpected error occurred",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}