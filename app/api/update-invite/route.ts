import {
  CreditsTransType,
  CreditsAmount,
  increaseCredits,
} from "@/services/credit";
import {
  findUserByInviteCode,
  findUserByUuid,
  updateUserInvitedBy,
} from "@/models/user";
import { respData, respErr } from "@/lib/resp";
import { getOneMonthLaterTimestr } from "@/lib/time";
import { insertAffiliate } from "@/models/affiliate";
import {
  AffiliateStatus,
  AffiliateRewardPercent,
  AffiliateRewardAmount,
} from "@/services/constant";
import { getIsoTimestr } from "@/lib/time";

export async function POST(req: Request) {
  try {
    const { invite_code, user_uuid } = await req.json();
    if (!invite_code || !user_uuid) {
      return respErr("invalid params");
    }

    // check invite user
    const inviteUser = await findUserByInviteCode(invite_code);
    if (!inviteUser) {
      return respErr("invite user not found");
    }

    // check current user
    const user = await findUserByUuid(user_uuid);
    if (!user) {
      return respErr("user not found");
    }

    if (user.uuid === inviteUser.uuid || user.email === inviteUser.email) {
      return respErr("can't invite yourself");
    }

    if (user.invited_by) {
      return respErr("user already has invite user");
    }

    user.invited_by = inviteUser.uuid;

    // update invite user uuid
    await updateUserInvitedBy(user_uuid, inviteUser.uuid);

    // increase credits for new user, expire in one year
    await increaseCredits({
      user_uuid: inviteUser.uuid || "",
      trans_type: CreditsTransType.Invite,
      credits: CreditsAmount.InviteGet,
      expired_at: getOneMonthLaterTimestr(),
    });

    await insertAffiliate({
      user_uuid: user_uuid,
      invited_by: inviteUser.uuid,
      created_at: getIsoTimestr(),
      status: AffiliateStatus.Pending,
      paid_order_no: "",
      paid_amount: 0,
      reward_percent: AffiliateRewardPercent.Invited,
      reward_amount: AffiliateRewardAmount.Invited,
    });

    return respData(user);
  } catch (e) {
    console.error("update invited by failed: ", e);
    return respErr("update invited by failed");
  }
}
