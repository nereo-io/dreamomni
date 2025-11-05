import { NextRequest, NextResponse } from 'next/server';
import { increaseCredits } from '@/services/credit';

/**
 * 内部 API: 退还积分
 * 用于 Python Agent 在任务失败或取消时退款
 */
export async function POST(req: NextRequest) {
  // 验证内部调用
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
    const { userId, credits, transType, reason } = body;

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

    // 调用现有的积分增加服务
    await increaseCredits({
      user_uuid: userId,
      trans_type: transType, // 例如: "refund" 或自定义类型
      credits: credits,
      order_no: reason || 'Agent refund' // 使用 reason 作为描述
    });

    return NextResponse.json({
      success: true,
      refunded: credits
    });

  } catch (error: any) {
    console.error('Internal credits refund error:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to refund credits' },
      { status: 500 }
    );
  }
}
