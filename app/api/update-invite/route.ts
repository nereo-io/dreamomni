// 已移除邀请积分相关导入以防止薅羊毛
import {
  findUserByInviteCode,
  findUserByUuid,
  updateUserInvitedBy,
} from "@/models/user";
import { respData, respErr } from "@/lib/resp";
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

    // 邀请功能已完全禁用以防止薅羊毛
    return respErr("Invite feature temporarily disabled for maintenance");
  } catch (e) {
    console.error("update invited by failed: ", e);
    return respErr("update invited by failed");
  }
}
