import {
  CreditsAmount,
  CreditsTransType,
  decreaseCredits,
  increaseCredits,
} from "@/services/credit";
import { respData, respErr } from "@/lib/resp";
import { getOneMonthLaterTimestr } from "@/lib/time";

import { getUserUuid } from "@/services/user";
import { getUserLeftCredits } from "@/models/credit";
export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message) {
      return respErr("invalid params");
    }

    const user_uuid = await getUserUuid();
    if (!user_uuid) {
      return respErr("no auth");
    }

    await increaseCredits({
      user_uuid,
      trans_type: CreditsTransType.NewUser,
      credits: CreditsAmount.NewUserGet,
      expired_at: getOneMonthLaterTimestr(),
    });

    // decrease credits for ping
    await decreaseCredits({
      user_uuid,
      trans_type: CreditsTransType.Ping,
      credits: CreditsAmount.PingCost,
    });

    const left_credits = await getUserLeftCredits(user_uuid);
    console.log("left_credits", left_credits);

    return respData({
      pong: `received message: ${message}`,
    });
  } catch (e) {
    console.log("test failed:", e);
    return respErr("test failed");
  }
}
