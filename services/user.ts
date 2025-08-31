import { CreditsAmount, CreditsTransType } from "./credit";
import {
  findUserByEmail,
  findUserByUuid,
  insertUser,
  updateUserInviteCode,
} from "@/models/user";
import { generateInviteCode } from "@/lib/random";

import { User } from "@/types/user";
import { auth } from "@/auth";
import { getOneMonthLaterTimestr } from "@/lib/time";
import { headers } from "next/headers";
import { increaseCredits } from "./credit";

export async function saveUser(user: User) {
  try {
    const existUser = await findUserByEmail(user.email);
    let isNewUser = false;
    
    if (!existUser) {
      await insertUser(user);
      isNewUser = true;

      // 生成并保存邀请码
      const inviteCode = generateInviteCode();
      if (user.uuid) {
        await updateUserInviteCode(user.uuid, inviteCode);
        user.invite_code = inviteCode;
      }

      // 新用户赠送积分，1个月后过期
      // 已有IP限制和用户验证防护，恢复10积分赠送
      await increaseCredits({
        user_uuid: user.uuid || "",
        trans_type: CreditsTransType.NewUser,
        credits: CreditsAmount.NewUserGet, // 恢复为10积分
        expired_at: getOneMonthLaterTimestr(),
      });
    } else {
      user.id = existUser.id;
      user.uuid = existUser.uuid;
      user.created_at = existUser.created_at;
    }

    // 返回用户信息和是否新用户标志
    return { ...user, isNewUser };
  } catch (e) {
    console.log("save user failed: ", e);
    throw e;
  }
}

export async function getUserUuid() {
  let user_uuid = "";

  const session = await auth();
  if (session && session.user && session.user.uuid) {
    user_uuid = session.user.uuid;
  }

  return user_uuid;
}

export function getBearerToken() {
  const h = headers();
  const auth = h.get("Authorization");
  if (!auth) {
    return "";
  }

  return auth.replace("Bearer ", "");
}

export async function getUserEmail() {
  let user_email = "";

  const session = await auth();
  if (session && session.user && session.user.email) {
    user_email = session.user.email;
  }

  return user_email;
}

export async function getUserInfo() {
  let user_uuid = await getUserUuid();

  if (!user_uuid) {
    return;
  }

  let user = await findUserByUuid(user_uuid);

  // 如果没有邀请码，自动生成并保存
  if (user && !user.invite_code) {
    const inviteCode = generateInviteCode();
    await updateUserInviteCode(user_uuid, inviteCode);
    // 更新user对象
    user = { ...user, invite_code: inviteCode };
  }

  return user;
}
