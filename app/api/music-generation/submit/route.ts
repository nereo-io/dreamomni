import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import { getUserInfo } from "@/services/user";
import { getClientIp, isIPBlocked } from "@/lib/ip";
import { getUserCredits } from "@/services/credit";
import { MusicGenerationService } from "@/services/musicGenerationService";
import { MusicParamsValidationError } from "@/services/musicParamsValidator";
import { getMusicModelCredits, getMusicModelEstimatedTime } from "@/config/music-models";
import type { SubmitMusicGenerationRequest } from "@/types/music.d";

/**
 * 验证 Cloudflare Turnstile CAPTCHA
 */
async function verifyCaptcha(
  token: string,
  clientIP: string
): Promise<boolean> {
  if (!process.env.TURNSTILE_SECRET_KEY) {
    console.warn("TURNSTILE_SECRET_KEY not configured, skipping CAPTCHA verification");
    return true;
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: clientIP,
        }),
      }
    );

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error("CAPTCHA verification error:", error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return respErr("User not authenticated");
    }

    const userInfo = await getUserInfo();
    if (!userInfo?.uuid) {
      return respErr("Failed to get user information");
    }

    if (userInfo.is_banned) {
      return respErr("Account has been suspended due to suspicious activity");
    }

    const clientIP = await getClientIp();
    const isBlocked = await isIPBlocked(clientIP);
    if (isBlocked) {
      console.warn(`Music generation blocked for IP: ${clientIP}`);
      return respErr("Music generation not available from this network");
    }

    const userCredits = await getUserCredits(userInfo.uuid);
    if (!userCredits) {
      return respErr("Failed to get user credits");
    }

    const params: SubmitMusicGenerationRequest = await req.json();

    if (userCredits.left_credits <= 12) {
      if (!params.captchaToken) {
        return respErr("CAPTCHA verification is required for new users");
      }

      const captchaValid = await verifyCaptcha(params.captchaToken, clientIP);
      if (!captchaValid) {
        console.warn(
          `CAPTCHA verification failed for new user: ${userInfo.uuid}, IP: ${clientIP}, credits: ${userCredits.left_credits}`
        );
        return respErr("CAPTCHA verification failed");
      }
    }

    const modelId = params.modelId || 'suno-v5';
    const requiredCredits = getMusicModelCredits(modelId);

    if (userCredits.left_credits < requiredCredits) {
      return respErr(`Insufficient credits. Required: ${requiredCredits}, Available: ${userCredits.left_credits}`);
    }

    const webhookUrl = `${process.env.NEXT_PUBLIC_WEB_URL}/api/music-generation/webhook`;

    const { record, deductResult } = await MusicGenerationService.submitGeneration(
      params,
      userInfo.uuid,
      webhookUrl
    );

    const newUserCredits = await getUserCredits(userInfo.uuid);

    return respData({
      id: record.id,
      providerTaskId: record.provider_task_id,
      status: record.status,
      requiredCredits,
      userCredits: {
        remainingCredits: newUserCredits.left_credits,
        deductedCredits: requiredCredits,
      },
      estimatedTime: getMusicModelEstimatedTime(modelId),
      provider: record.provider,
      modelId: record.model_id,
      message: "Music generation task submitted successfully",
    });

  } catch (error: any) {
    console.error("Music generation submission error:", error);

    if (error instanceof MusicParamsValidationError) {
      return respErr(error.message);
    }

    let errorMessage = "Failed to submit music generation task";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return respErr(errorMessage);
  }
}
