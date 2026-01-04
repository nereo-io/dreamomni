import { respData, respErr } from "@/lib/resp";
import { MusicWebhookService } from "@/services/musicWebhookService";
import type { KieAiMusicWebhookPayload } from "@/types/music.d";

export async function POST(req: Request) {
  try {
    const webhookData: KieAiMusicWebhookPayload = await req.json();

    console.log("Received music webhook:", JSON.stringify(webhookData, null, 2));

    // 验证必需字段
    if (!webhookData.code || !webhookData.data) {
      return respErr("Invalid webhook payload format");
    }

    await MusicWebhookService.handleCallback(webhookData);

    return respData({
      message: "Webhook processed successfully",
      callbackType: webhookData.data.callbackType,
      taskId: webhookData.data.task_id,
    });

  } catch (error: any) {
    console.error("Music webhook processing error:", error);

    let errorMessage = "Failed to process webhook";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return respErr(errorMessage);
  }
}

export async function GET() {
  return respData({
    message: "Music generation webhook endpoint is running",
    endpoint: "/api/music-generation/webhook",
    supported_methods: ["POST"],
    description: "Handles music generation status callbacks from Kie.ai Suno API",
    expected_callback_types: ["text", "first", "complete", "error"],
    provider: "kieai",
  });
}
