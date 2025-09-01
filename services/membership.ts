import { Membership } from "@/types/membership";
import { getUserUuid } from "./user";
import {
  findActiveMembershipByUserUuid,
  insertMembership,
  updateMembership,
  checkAndUpdateMembershipStatus,
  getMembershipHistory,
  findMembershipByUserUuid,
} from "@/models/membership";
import { User } from "@/types/user";
import membershipCache from "./membershipCache";

// 检查用户的会员状态（带缓存优化）
export async function checkMembershipStatus(user: User): Promise<{
  isMember: boolean;
  membership?: Membership;
}> {
  const userUuid = user.uuid;
  if (!userUuid) {
    return { isMember: false };
  }

  // 使用缓存获取membership状态
  const result = await membershipCache.getMembershipStatus(userUuid);
  
  // 如果是会员但缓存的数据可能过期，需要检查过期状态
  if (result.isMember && result.membership) {
    const now = new Date();
    const endDate = new Date(result.membership.end_date);
    
    // 如果会员已过期，更新状态并清除缓存
    if (endDate < now) {
      await checkAndUpdateMembershipStatus(userUuid);
      membershipCache.clearUserCache(userUuid);
      // 重新获取更新后的状态
      return await membershipCache.getMembershipStatus(userUuid);
    }
  }

  return result;
}

// 创建或更新会员
export async function createOrUpdateMembership(
  userUuid: string,
  planType: "monthly" | "yearly" | "quarterly"
): Promise<void> {
  const now = new Date();
  const startDate = now.toISOString();

  // 查询用户是否有会员记录(不限制状态)
  const membership = await findMembershipByUserUuid(userUuid);

  // 计算结束时间
  let endDate = new Date(now);
  if (membership?.end_date) {
    const membershipEndDate = new Date(membership.end_date);
    // 判断会员结束时间是否晚于当前时间，如果是则使用会员结束时间作为基准
    endDate = membershipEndDate > now ? membershipEndDate : new Date(now);
  }

  // const endDate = new Date(now);
  if (planType === "monthly") {
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (planType === "yearly") {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else if (planType === "quarterly") {
    endDate.setMonth(endDate.getMonth() + 3);
  }

  if (membership) {
    // 更新现有会员
    console.log("membership", membership);
    await updateMembership(userUuid, {
      start_date: startDate,
      end_date: endDate.toISOString(),
      status: "active",
      plan_type: planType,
      updated_at: now.toISOString(),
    });
  } else {
    // 创建新会员
    await insertMembership({
      user_uuid: userUuid,
      start_date: startDate,
      end_date: endDate.toISOString(),
      status: "active",
      plan_type: planType,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    } as Membership);
  }

  // 会员状态变更后清除缓存
  membershipCache.clearUserCache(userUuid);
}

// 获取用户会员历史记录
export async function getUserMembershipHistory(
  page: number = 1,
  limit: number = 10
): Promise<Membership[] | undefined> {
  const userUuid = await getUserUuid();
  if (!userUuid) {
    return undefined;
  }

  return await getMembershipHistory(userUuid, page, limit);
}
