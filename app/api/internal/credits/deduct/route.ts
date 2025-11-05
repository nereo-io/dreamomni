import { NextRequest, NextResponse } from 'next/server';
import { decreaseCredits, CreditsTransType } from '@/services/credit';

/**
 * 内部 API: 扣除积分
 * 用于 Python Agent 调用
 */
export async function POST(req: NextRequest) {
  // 验证内部调用 (INTERNAL_API_KEY)
  const authHeader = req.headers.get('Authorization');
  const expectedKey = `Bearer ${process.env.INTERNAL_API_KEY}`;

  if (!authHeader || authHeader !== expectedKey) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { userId, credits, transType } = body;

    // 参数验证
    if (!userId || typeof credits !== 'number' || !transType) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, credits, transType' },
        { status: 400 }
      );
    }

    if (credits <= 0) {
      return NextResponse.json(
        { error: 'Credits must be greater than 0' },
        { status: 400 }
      );
    }

    // 调用现有的积分扣除服务
    const result = await decreaseCredits({
      user_uuid: userId,
      trans_type: transType as CreditsTransType,
      credits: credits
    });

    return NextResponse.json({
      success: true,
      deducted: result.totalDeducted,
      pools: result.pools
    });

  } catch (error: any) {
    console.error('Internal credits deduct error:', error);

    // 处理积分不足错误
    if (error.message?.includes('insufficient') || error.message?.includes('not enough')) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to deduct credits' },
      { status: 500 }
    );
  }
}
