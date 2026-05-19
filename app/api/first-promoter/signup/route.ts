import { auth } from '@/auth';
import { getFirstPromoterCookies } from '@/lib/first-promoter/cookies';
import { trackFirstPromoterSignup } from '@/services/analytics/first-promoter';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.uuid || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.isNewUser !== true) {
    return NextResponse.json({ skipped: true, reason: 'not_new_user' });
  }

  const { trackingId, refId } = getFirstPromoterCookies(req.cookies);

  const result = await trackFirstPromoterSignup({
    userUuid: session.user.uuid,
    email: session.user.email,
    firstName: session.user.nickname,
    trackingId,
    refId,
  });

  return NextResponse.json(result);
}
