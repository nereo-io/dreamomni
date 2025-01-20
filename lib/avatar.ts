/**
 * 生成默认头像 URL
 * 使用 DiceBear 的 avatars 服务生成基于邮箱的头像
 * @param email 用户邮箱
 * @returns 头像 URL
 */
export function getDefaultAvatar(email: string): string {
  // 使用邮箱的 MD5 作为种子
  const seed = email.toLowerCase().trim();
  // 使用 DiceBear 的 avatars 服务
  return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(seed)}`;
} 