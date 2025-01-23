import { getTodayReadingCount, updateReadingCount } from "@/models/reading";
import { getUserUuid } from "./user";
import { checkMembershipStatus } from "./membership";

const MAX_DAILY_READINGS = process.env.NEXT_PUBLIC_MAX_DAILY_READINGS ? parseInt(process.env.NEXT_PUBLIC_MAX_DAILY_READINGS) : 3;

// 检查用户是否可以继续阅读
export async function checkReadingPermission() {
  const userUuid = await getUserUuid();
  
  if (!userUuid) {
    return {
      isLoggedIn: false,
      todayCount: 0,
      remainingCount: 0,
      canRead: false,
      isMember: false
    };
  }

  // 检查会员状态
  const { isMember } = await checkMembershipStatus();
  
  // 如果是会员，直接允许阅读
  if (isMember) {
    return {
      isLoggedIn: true,
      todayCount: 0,
      remainingCount: -1, // -1 表示无限制
      canRead: true,
      isMember: true
    };
  }

  const todayCount = await getTodayReadingCount(userUuid);
  const remainingCount = MAX_DAILY_READINGS - todayCount;

  return {
    isLoggedIn: true,
    todayCount,
    remainingCount,
    canRead: remainingCount > 0,
    isMember: false
  };
}

// 记录一次阅读
export async function recordReading() {
  const userUuid = await getUserUuid();
  
  if (!userUuid) {
    throw new Error("用户未登录");
  }

  // 检查会员状态
  const { isMember } = await checkMembershipStatus();
  
  // 如果是会员，不需要记录次数
  if (isMember) {
    return {
      todayCount: 0,
      remainingCount: -1, // -1 表示无限制
      isMember: true
    };
  }

  const todayCount = await getTodayReadingCount(userUuid);
  
  if (todayCount >= MAX_DAILY_READINGS) {
    throw new Error("今日解读次数已用完");
  }

  const newCount = await updateReadingCount(userUuid);
  const remainingCount = MAX_DAILY_READINGS - newCount;

  return {
    todayCount: newCount,
    remainingCount,
    isMember: false
  };
} 