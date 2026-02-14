import { respData, respErr } from "@/lib/resp";
import { auth } from "@/auth";
import { getUserInfo } from "@/services/user";
import { getUserCredits } from "@/services/credit";
import { submitEffect } from "@/services/effectService";
import { calculateEffectCredits } from "@/config/effect-models";
import { NextRequest } from "next/server";
import { getClientIp } from "@/lib/ip";

async function verifyCaptcha(
  token: string,
  clientIP: string
): Promise<boolean> {
  if (!process.env.TURNSTILE_SECRET_KEY) {
    console.warn(
      "TURNSTILE_SECRET_KEY not configured, skipping CAPTCHA verification"
    );
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

export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const session = await auth();
    if (!session?.user?.uuid) {
      return respErr("User not authenticated");
    }

    // 2. Get user info
    const userInfo = await getUserInfo();
    if (!userInfo?.uuid) {
      return respErr("User not found. Please sign in again.");
    }

    // 3. Parse request body
    const { effectId, imageUrls, settings, captchaToken } = await req.json();

    // 4. Validate
    if (!effectId) {
      return respErr("effectId is required");
    }
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return respErr("At least one image URL is required");
    }

    // 5. Check credits
    const userCredits = await getUserCredits(userInfo.uuid);
    const creditsRequired = calculateEffectCredits(
      effectId,
      settings || {}
    );

    if (creditsRequired <= 0) {
      return respErr(`Invalid effect: ${effectId}`);
    }

    if (userCredits.left_credits < creditsRequired) {
      return respErr(
        `Insufficient credits. Need ${creditsRequired} credits.`
      );
    }

    // 6. CAPTCHA verification for low-credit users
    if (userCredits.left_credits <= 12 && captchaToken) {
      const clientIP = await getClientIp();
      const captchaValid = await verifyCaptcha(captchaToken, clientIP);
      if (!captchaValid) {
        return respErr("CAPTCHA verification failed, please try again");
      }
    } else if (userCredits.left_credits <= 12 && !captchaToken) {
      return respErr("CAPTCHA verification required");
    }

    // 7. Submit effect
    const result = await submitEffect({
      effectId,
      imageUrls,
      settings: settings || {},
      userId: userInfo.uuid,
    });

    return respData({
      id: result.id,
      task_id: result.taskId,
      status: result.status,
      credits: result.credits,
      output_type: result.outputType,
      message: "Effect generation submitted successfully",
    });
  } catch (error) {
    console.error("❌ [image-effect/submit] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return respErr(errorMessage);
  }
}

export async function GET() {
  return new Response("Method not allowed", { status: 405 });
}
