import { auth } from "@/auth";
import { getUserInfo } from "@/services/user";
import { getMusicGenerationsByUserId } from "@/models/musicGeneration";
import { respData, respErr } from "@/lib/resp";
import { parseAudioData } from "@/lib/music-utils";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return respErr("User not authenticated");
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const search = url.searchParams.get("search")?.trim();

    if (page < 1) {
      return respErr("Page number must be greater than 0");
    }
    if (limit < 1 || limit > 100) {
      return respErr("Limit must be between 1 and 100");
    }

    const { items: musicGenerations, total } = await getMusicGenerationsByUserId(
      session.user.uuid,
      page,
      limit,
      search
    );

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return respData({
      data: musicGenerations.map((music) => {
        const audioFiles = parseAudioData(music);
        return {
          id: music.id,
          provider: music.provider,
          model_id: music.model_id,
          generation_type: music.generation_type,
          custom_mode: music.custom_mode,
          instrumental: music.instrumental,
          prompt: music.prompt,
          title: music.title,
          style: music.style,
          status: music.status,
          ...(audioFiles && { audio_files: audioFiles }), // 只在有音频文件时返回
          error_message: music.error_message,
          credits_cost: music.credits_cost,
          created_at: music.created_at,
          updated_at: music.updated_at,
          completed_at: music.completed_at,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext,
        hasPrev,
      },
    });
  } catch (error) {
    console.error("Failed to get music generation history:", error);

    let errorMessage = "Failed to get music generation history";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return respErr(errorMessage);
  }
}
