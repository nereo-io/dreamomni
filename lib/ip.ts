"use server";

import { headers } from "next/headers";
import { findIPLimitByAddress, upsertIPRegistrationCount, countUserRegistrationsByIPAndTime } from "@/models/ipLimit";

export async function getClientIp() {
  const h = headers();

  const ip =
    h.get("cf-connecting-ip") || // Cloudflare IP
    h.get("x-real-ip") || // Vercel or other reverse proxies
    (h.get("x-forwarded-for") || "127.0.0.1").split(",")[0]; // Standard header

  return ip;
}

// IP注册限制配置
const IP_LIMITS = {
  DAILY_LIMIT: 10,   // 每IP每日最多10个账号
  HOURLY_LIMIT: 3,   // 每IP每小时最多3个账号
};

/**
 * 检查IP注册限制
 * @param ip IP地址
 * @returns 检查结果 {allowed: boolean, reason?: string}
 */
export async function checkIPRegistrationLimit(ip: string): Promise<{allowed: boolean, reason?: string}> {
  try {
    // 开发环境跳过IP限制检查
    if (process.env.NODE_ENV === 'development' || ip === '127.0.0.1' || ip === '::1') {
      console.log(`Skipping IP limit check for development IP: ${ip}`);
      return { allowed: true };
    }
    // 检查IP是否已被明确封禁
    const ipLimit = await findIPLimitByAddress(ip);
    
    // 如果IP已被明确标记为blocked
    if (ipLimit && ipLimit.is_blocked) {
      return { allowed: false, reason: 'IP address is blocked' };
    }

    // 检查24小时内的注册数量
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dailyCount = await countUserRegistrationsByIPAndTime(ip, last24h);

    if (dailyCount >= IP_LIMITS.DAILY_LIMIT) {
      return { allowed: false, reason: `Too many registrations from this IP today (${dailyCount}/${IP_LIMITS.DAILY_LIMIT})` };
    }

    // 检查1小时内的注册数量
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    const hourlyCount = await countUserRegistrationsByIPAndTime(ip, lastHour);

    if (hourlyCount >= IP_LIMITS.HOURLY_LIMIT) {
      return { allowed: false, reason: `Too many registrations from this IP in the past hour (${hourlyCount}/${IP_LIMITS.HOURLY_LIMIT})` };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Unexpected error in checkIPRegistrationLimit:', error);
    // 出现意外错误时允许通过，避免误杀真实用户
    return { allowed: true };
  }
}

/**
 * 更新IP注册计数
 * @param ip IP地址
 */
export async function updateIPRegistrationCount(ip: string): Promise<void> {
  try {
    await upsertIPRegistrationCount(ip);
  } catch (error) {
    console.error('Error updating IP registration count:', error);
    // 这里不抛出错误，因为注册计数失败不应该阻止用户注册
  }
}

/**
 * 检查IP是否在黑名单中（用于视频生成等操作）
 * @param ip IP地址
 * @returns 是否被封禁
 */
export async function isIPBlocked(ip: string): Promise<boolean> {
  try {
    const ipLimit = await findIPLimitByAddress(ip);
    return ipLimit?.is_blocked === true;
  } catch (error) {
    console.error('Unexpected error in isIPBlocked:', error);
    return false; // 发生错误时不阻止
  }
}
