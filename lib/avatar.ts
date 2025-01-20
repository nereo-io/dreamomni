/**
 * 生成默认头像 URL
 * 使用 UI Avatars 服务生成基于用户名或邮箱的头像
 * @param email 用户邮箱
 * @returns 头像 URL
 */
export function getDefaultAvatar(email: string): string {
  // 使用邮箱前缀或整个邮箱作为名字
  const name = email.split('@')[0];
  // 使用 UI Avatars 服务
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&bold=true&format=svg`;
} 