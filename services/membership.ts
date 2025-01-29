import { Membership } from '@/types/membership';
import { getUserUuid } from './user';
import { 
  findActiveMembershipByUserUuid, 
  insertMembership, 
  updateMembership, 
  checkAndUpdateMembershipStatus,
  getMembershipHistory
} from '@/models/membership';
import { User } from '@/types/user';

// 检查用户的会员状态
export async function checkMembershipStatus(user: User): Promise<{
  isMember: boolean;
  membership?: Membership;
}> {
  const userUuid = user.uuid;
  if (!userUuid) {
    return { isMember: false };
  }

  // 先检查并更新过期会员状态
  await checkAndUpdateMembershipStatus(userUuid);

  // 获取当前有效会员
  const membership = await findActiveMembershipByUserUuid(userUuid);
  if (!membership) {
    return { isMember: false };
  }

  return {
    isMember: true,
    membership
  };
}

// 创建或更新会员
export async function createOrUpdateMembership(
  userUuid: string,
  planType: 'monthly' | 'yearly'
): Promise<void> {
  const now = new Date();
  const startDate = now.toISOString();
  
  // 计算结束时间
  const endDate = new Date(now);
  if (planType === 'monthly') {
    endDate.setMonth(endDate.getMonth() + 1);
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  const membership = await findActiveMembershipByUserUuid(userUuid);
  if (membership) {
    // 更新现有会员
    await updateMembership(userUuid, {
      start_date: startDate,
      end_date: endDate.toISOString(),
      status: 'active',
      plan_type: planType,
      updated_at: now.toISOString()
    });
  } else {
    // 创建新会员
    await insertMembership({
      user_uuid: userUuid,
      start_date: startDate,
      end_date: endDate.toISOString(),
      status: 'active',
      plan_type: planType,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    } as Membership);
  }
}

// 获取用户会员历史记录
export async function getUserMembershipHistory(page: number = 1, limit: number = 10): Promise<Membership[] | undefined> {
  const userUuid = await getUserUuid();
  if (!userUuid) {
    return undefined;
  }
  
  return await getMembershipHistory(userUuid, page, limit);
} 