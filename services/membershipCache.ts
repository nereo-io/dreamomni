import { Membership } from "@/types/membership";
import { findActiveMembershipByUserUuid } from "@/models/membership";

interface CacheEntry {
  isMember: boolean;
  membership?: Membership;
  expiry: number;
}

/**
 * Membership缓存管理器
 * 解决频繁查询membership表导致的性能问题
 */
class MembershipCache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 5 * 60 * 1000; // 5分钟缓存

  /**
   * 获取用户membership状态（带缓存）
   */
  async getMembershipStatus(userUuid: string): Promise<{
    isMember: boolean;
    membership?: Membership;
  }> {
    // 检查缓存
    const cached = this.cache.get(userUuid);
    if (cached && Date.now() < cached.expiry) {
      this.hitCount++;
      return {
        isMember: cached.isMember,
        membership: cached.membership,
      };
    }

    // 缓存失效，查询数据库
    this.missCount++;
    const membership = await findActiveMembershipByUserUuid(userUuid);
    const result = {
      isMember: !!membership,
      membership,
    };

    // 更新缓存（包括"非会员"状态）
    this.cache.set(userUuid, {
      ...result,
      expiry: Date.now() + this.TTL,
    });

    return result;
  }

  /**
   * 清除特定用户的缓存
   * 在membership状态变更时调用
   */
  clearUserCache(userUuid: string): void {
    this.cache.delete(userUuid);
  }

  /**
   * 清理过期缓存条目
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiry) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 获取缓存统计信息（用于监控）
   */
  getStats(): {
    size: number;
    hitCount: number;
    missCount: number;
  } {
    return {
      size: this.cache.size,
      hitCount: this.hitCount,
      missCount: this.missCount,
    };
  }

  private hitCount = 0;
  private missCount = 0;

  constructor() {
    // 每10分钟清理一次过期缓存
    setInterval(() => this.cleanup(), 10 * 60 * 1000);
  }
}

// 单例模式
const membershipCache = new MembershipCache();

export default membershipCache;