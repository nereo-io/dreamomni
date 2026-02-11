import { NextRequest } from "next/server";
import { respData, respErr } from "@/lib/resp";
import { getImageGenerationById } from "@/models/imageGeneration";
import { getVideoGenerationById } from "@/models/videoGeneration";
import { syncImageGenerationStatus } from "@/services/imageGenerationStatusService";
import { VideoStatusService } from "@/services/videoStatusService";

const EXPECTED_AUTH_HEADER = `Bearer ${process.env.INTERNAL_API_KEY}`;

type GenerationType = "image" | "video";

type UpdateRequest = {
  id: string;
  type: GenerationType;
};

const buildImageResponse = (record: any) => {
  return {
    id: record.id,
    status: record.status?.toLowerCase(),
    prompt: record.prompt,
    model: record.model_id,
    mode: record.mode,
    image_url:
      record.image_urls_r2 && record.image_urls_r2.length > 0
        ? record.image_urls_r2[0]
        : record.image_urls && record.image_urls.length > 0
        ? record.image_urls[0]
        : null,
    image_urls: record.image_urls || [],
    image_urls_r2: record.image_urls_r2 || [],
    image_count: record.image_count || 0,
    credits_used: record.credits_used,
    error_message: record.error_message,
    created_at: record.created_at,
    updated_at: record.updated_at,
    completed_at: record.completed_at,
    metadata: record.metadata,
  };
};

async function updateImageGeneration(id: string) {
  let imageGeneration = await getImageGenerationById(id);
  if (!imageGeneration) {
    return respErr("Image generation not found");
  }

  try {
    const updatedGeneration = await syncImageGenerationStatus(imageGeneration);
    return respData(buildImageResponse(updatedGeneration));
  } catch (error) {
    return respErr(error instanceof Error ? error.message : "Failed to update image generation");
  }
}

async function updateVideoGeneration(id: string) {
  const videoGeneration = await getVideoGenerationById(id);
  if (!videoGeneration) {
    return respErr("Video generation not found");
  }

  const statusResult = await VideoStatusService.getVideoStatus(videoGeneration);
  return respData(statusResult);
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || authHeader !== EXPECTED_AUTH_HEADER) {
      return respErr("Unauthorized");
    }

    const body = (await req.json()) as UpdateRequest;
    const { id, type } = body;

    if (!id) {
      return respErr("id is required");
    }

    if (!type || (type !== "image" && type !== "video")) {
      return respErr("type must be 'image' or 'video'");
    }

    if (type === "image") {
      return await updateImageGeneration(id);
    }

    return await updateVideoGeneration(id);
  } catch (error) {
    console.error("External generation status update error:", error);
    return respErr(error instanceof Error ? error.message : "Internal server error");
  }
}

export async function GET() {
  return new Response("Method not allowed", { status: 405 });
}

export async function PUT() {
  return new Response("Method not allowed", { status: 405 });
}

export async function DELETE() {
  return new Response("Method not allowed", { status: 405 });
}
