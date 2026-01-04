import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import { getMusicGenerationById } from "@/models/musicGeneration";
import { parseAudioData } from "@/lib/music-utils";
import type { MusicGenerationStatusResponse } from "@/types/music.d";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return respErr("User not authenticated");
    }

    const { id } = params;

    if (!id) {
      return respErr("Music generation ID is required");
    }

    const record = await getMusicGenerationById(id, session.user.uuid);

    if (!record) {
      return respErr("Music generation record not found");
    }

    // 直接返回数据对象，包含多个音频文件
    const audioFiles = parseAudioData(record);
    return respData({
      id: record.id,
      status: record.status,
      ...(audioFiles && { audioFiles }), // 只在有音频文件时返回
      errorMessage: record.error_message || undefined,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      completedAt: record.completed_at || undefined,
    });

  } catch (error: any) {
    console.error("Failed to get music generation status:", error);

    let errorMessage = "Failed to get music generation status";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return respErr(errorMessage);
  }
}
