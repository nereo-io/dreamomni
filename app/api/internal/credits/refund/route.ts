import { NextRequest, NextResponse } from 'next/server';
import { getUserCredits, increaseCredits } from '@/services/credit';

/**
 * 内部 API: 退还积分
 * 用于 Python Agent 在任务失败或取消时退款
 */
export async function POST(req: NextRequest) {
  // 验证内部调用
  const authHeader = req.headers.get('Authorization');
  const internalKey = process.env.INTERNAL_API_KEY?.trim();
  if (!internalKey) {
    return NextResponse.json(
      { error: 'INTERNAL_API_KEY is not configured' },
      { status: 500 }
    );
  }
  const expectedKey = `Bearer ${internalKey}`;

  if (!authHeader || authHeader !== expectedKey) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { userId, credits, transType, reason, pools } = body;

    // 参数验证
    if (!userId || !transType) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, transType' },
        { status: 400 }
      );
    }

    // 支持两种模式:
    // 1. 池化退款模式: 传入 pools 数组,按原订单和过期时间退款
    // 2. 简单退款模式: 传入 credits 数字,创建新的积分记录
    if (pools && Array.isArray(pools) && pools.length > 0) {
      // 池化退款模式: 遍历每个池,按原始 order_no 和 expired_at 退款
      let totalRefunded = 0;
      for (const pool of pools) {
        await increaseCredits({
          user_uuid: userId,
          trans_type: transType,
          credits: pool.deducted,
          order_no: pool.order_no,
          expired_at: pool.expired_at,
        });
        totalRefunded += pool.deducted;
      }

      const userCredits = await getUserCredits(userId);

      return NextResponse.json({
        success: true,
        refunded: totalRefunded,
        pools: pools.length,
        new_balance: userCredits.left_credits
      });
    } else if (typeof credits === 'number') {
      // 简单退款模式: 创建新的积分记录
      if (credits <= 0) {
        return NextResponse.json(
          { error: 'Credits must be greater than 0' },
          { status: 400 }
        );
      }

      await increaseCredits({
        user_uuid: userId,
        trans_type: transType,
        credits: credits,
        order_no: reason || 'Agent refund'
      });

      const userCredits = await getUserCredits(userId);

      return NextResponse.json({
        success: true,
        refunded: credits,
        new_balance: userCredits.left_credits
      });
    } else {
      return NextResponse.json(
        { error: 'Must provide either pools array or credits number' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Internal credits refund error:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to refund credits' },
      { status: 500 }
    );
  }
}
