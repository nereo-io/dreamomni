import { respData, respErr } from "@/lib/resp";

import { JSONValue } from "ai";
import type { VideoModelV1 } from "@/aisdk/provider";
import { generateVideo } from "@/aisdk";
import { getUuid } from "@/lib/hash";
import { kling } from "@/aisdk/kling";
import path from "path";
import { writeFile } from "fs/promises";

export async function POST(req: Request) {
  try {
    const { prompt, provider, model } = await req.json();
    if (!prompt || !provider || !model) {
      return respErr("invalid params");
    }

    let videoModel: VideoModelV1;
    let providerOptions: Record<string, Record<string, JSONValue>> = {};

    switch (provider) {
      case "kling":
        videoModel = kling.video(model);
        providerOptions = {
          kling: {
            mode: "std",
            duration: 5,
          },
        };
        break;
      default:
        return respErr("invalid provider");
    }

    const { videos, warnings } = await generateVideo({
      model: videoModel,
      prompt: prompt,
      n: 1,
      providerOptions,
    });

    if (warnings.length > 0) {
      console.log("gen videos warnings:", provider, warnings);
      return respErr("gen videos failed");
    }

    const batch = getUuid();

    const processedVideos = await Promise.all(
      videos.map(async (video, index) => {
        const fileName = `${provider}_video_${batch}_${index}.mp4`;
        const filePath = path.join(process.cwd(), ".tmp", fileName);

        const buffer = Buffer.from(video.base64, "base64");
        await writeFile(filePath, buffer);

        return {
          provider,
          fileName,
          filePath,
        };
      })
    );

    return respData(processedVideos);
  } catch (err) {
    console.log("gen video failed:", err);
    return respErr("gen video failed");
  }
}
