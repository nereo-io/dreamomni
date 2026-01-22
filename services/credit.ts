import {
  findCreditByOrderNo,
  getUserValidCredits,
  insertCredit,
} from "@/models/credit";

import { Credit } from "@/types/credit";
import { Order } from "@/types/order";
import { UserCredits } from "@/types/user";
import { findUserByUuid } from "@/models/user";
import { getFirstPaidOrderByUserUuid } from "@/models/order";
import { getIsoTimestr } from "@/lib/time";
import { getSnowId } from "@/lib/hash";

export enum CreditsTransType {
  NewUser = "new_user", // initial credits for new user
  OrderPay = "order_pay", // user pay for credits
  SystemAdd = "system_add", // system add credits
  Ping = "ping", // cost for ping api
  Chat = "chat", // cost for chat api
  RefundNonResponse = "refund_non_response", // compensation for unanswered messages
  VideoGeneration4s = "video_generation_4s", // cost for 4 seconds video generation
  VideoGeneration5s = "video_generation_5s", // cost for 5 seconds video generation
  VideoGeneration6s = "video_generation_6s", // cost for 6 seconds video generation
  VideoGeneration8s = "video_generation_8s", // cost for 8 seconds video generation
  VideoGeneration10s = "video_generation_10s", // cost for 10 seconds video generation
  VideoGeneration12s = "video_generation_12s", // cost for 12 seconds video generation
  VideoGeneration15s = "video_generation_15s", // cost for 15 seconds video generation (Sora 2/Pro)
  VideoGeneration25s = "video_generation_25s", // cost for 25 seconds video generation (Storyboard)
  RefundVideoGenerationFailed = "refund_video_generation_failed", // refund credits for failed video generation
  ImageGeneration = "image_generation", // cost for image generation
  RefundImageGenerationFailed = "refund_image_generation_failed", // refund credits for failed image generation
  // Agent system transaction types
  AgentShotAnalysis = "agent_shot_analysis", // cost for Agent shot analysis (分镜分析)
  AgentKeyframe = "agent_keyframe", // cost for Agent keyframe generation (关键帧生成)
  AgentVideoClip = "agent_video_clip", // cost for Agent video clip generation (视频片段生成)
  AgentVideoSplicing = "agent_video_splicing", // cost for Agent video splicing (视频拼接)
  // Music generation transaction types
  MusicGeneration = "music_generation", // cost for music generation
  RefundMusicGenerationFailed = "refund_music_generation_failed", // refund credits for failed music generation
}

export enum CreditsAmount {
  NewUserGet = 6,
  PingCost = 1,
  ChatCost = 1,
  VideoGeneration5sCost = 10,
  VideoGeneration10sCost = 20,
}

/**
 * Result of credit deduction operation
 * Contains pool information for refund tracking
 */
export type DeductResult = {
  pools: Array<{
    order_no: string;
    expired_at?: string;
    deducted: number;
  }>;
  totalDeducted: number;
};

export async function getUserCredits(user_uuid: string): Promise<UserCredits> {
  let user_credits: UserCredits = {
    left_credits: 0,
  };

  try {
    const first_paid_order = await getFirstPaidOrderByUserUuid(user_uuid);
    if (first_paid_order) {
      user_credits.is_recharged = true;
    }

    const credits = await getUserValidCredits(user_uuid);
    if (credits) {
      credits.forEach((v: Credit) => {
        user_credits.left_credits += v.credits;
      });
    }

    if (user_credits.left_credits < 0) {
      user_credits.left_credits = 0;
    }

    if (user_credits.left_credits > 0) {
      user_credits.is_pro = true;
    }

    return user_credits;
  } catch (e) {
    console.log("get user credits failed: ", e);
    return user_credits;
  }
}

/**
 * Decrease credits using pool-based deduction
 * Uses Supabase RPC function for transaction safety and pool aggregation
 *
 * @returns DeductResult containing pool information for refund tracking
 */
export async function decreaseCredits({
  user_uuid,
  trans_type,
  credits,
}: {
  user_uuid: string;
  trans_type: CreditsTransType;
  credits: number;
}): Promise<DeductResult> {
  try {
    const { getSupabaseClient } = await import("@/models/db");
    const supabase = getSupabaseClient();

    // Call the deduct_credits_v2 RPC function
    const { data, error } = await supabase.rpc('deduct_credits_v2', {
      p_user_uuid: user_uuid,
      p_credits_needed: credits,
      p_trans_type: trans_type
    });

    if (error) {
      console.error("Deduct credits RPC error:", error);
      throw new Error(`Failed to deduct credits: ${error.message}`);
    }

    if (!data) {
      throw new Error("Deduct credits returned no data");
    }

    // Parse the JSONB result from database
    const result: DeductResult = {
      pools: data.pools || [],
      totalDeducted: data.totalDeducted || 0
    };

    console.log(`✅ Deducted ${result.totalDeducted} credits from ${result.pools.length} pool(s) for user ${user_uuid}`);

    return result;
  } catch (e) {
    console.error("decrease credits failed:", e);
    throw e;
  }
}

export async function increaseCredits({
  user_uuid,
  trans_type,
  credits,
  expired_at,
  order_no,
  payment_id,
}: {
  user_uuid: string;
  trans_type: string;
  credits: number;
  expired_at?: string;
  order_no?: string;
  payment_id?: string;
}) {
  try {
    const new_credit: Credit = {
      trans_no: getSnowId(),
      created_at: getIsoTimestr(),
      user_uuid: user_uuid,
      trans_type: trans_type,
      credits: credits,
      order_no: order_no || "",
      expired_at: expired_at || undefined,
      payment_id: payment_id || undefined,
    };
    await insertCredit(new_credit);
  } catch (e) {
    console.log("increase credits failed: ", e);
    throw e;
  }
}

export async function updateCreditForOrder(order: Order) {
  try {
    const credit = await findCreditByOrderNo(order.order_no);
    if (credit) {
      // order already increased credit
      return;
    }

    await increaseCredits({
      user_uuid: order.user_uuid,
      trans_type: CreditsTransType.OrderPay,
      credits: order.credits,
      expired_at: order.expired_at,
      order_no: order.order_no,
    });
  } catch (e) {
    console.log("update credit for order failed: ", e);
    throw e;
  }
}
