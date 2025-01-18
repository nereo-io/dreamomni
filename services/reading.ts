import { getTodayReadingCount, updateReadingCount } from "@/models/reading";
import { getUserUuid } from "./user";

const MAX_DAILY_READINGS = 3;

// 检查用户是否可以继续阅读
export async function checkReadingPermission() {
  const userUuid = await getUserUuid();
  
  if (!userUuid) {
    return {
      isLoggedIn: false,
      todayCount: 0,
      remainingCount: 0,
      canRead: false
    };
  }

  const todayCount = await getTodayReadingCount(userUuid);
  const remainingCount = MAX_DAILY_READINGS - todayCount;

  return {
    isLoggedIn: true,
    todayCount,
    remainingCount,
    canRead: remainingCount > 0
  };
}

// 记录一次阅读
export async function recordReading() {
  const userUuid = await getUserUuid();
  
  if (!userUuid) {
    throw new Error("用户未登录");
  }

  const todayCount = await getTodayReadingCount(userUuid);
  
  if (todayCount >= MAX_DAILY_READINGS) {
    throw new Error("今日解读次数已用完");
  }

  const newCount = await updateReadingCount(userUuid);
  const remainingCount = MAX_DAILY_READINGS - newCount;

  return {
    todayCount: newCount,
    remainingCount
  };
} 