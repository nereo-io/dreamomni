import { NextResponse } from 'next/server';

import { findOrderByOrderNo } from '@/models/order';
import { getUserUuid } from '@/services/user';
import { buildInvoicePdf } from '@/lib/invoice-pdf';

export const runtime = 'nodejs';

const sanitizeFilename = (value: string) =>
  value.replace(/[^a-zA-Z0-9_-]/g, '_');

export async function GET(
  _request: Request,
  { params }: { params: { orderNo: string } }
) {
  const userUuid = await getUserUuid();
  if (!userUuid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orderNo = params.orderNo;
  if (!orderNo) {
    return NextResponse.json(
      { error: 'Order number is required' },
      { status: 400 }
    );
  }

  const order = await findOrderByOrderNo(orderNo);
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.user_uuid !== userUuid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const pdf = buildInvoicePdf({
    orderNo: order.order_no,
    paidEmail: order.paid_email || order.user_email || '',
    productName: order.product_name || '',
    amount: order.amount || 0,
    currency: order.currency || 'USD',
    paidAt: order.paid_at || order.created_at || '',
  });

  const safeOrderNo = sanitizeFilename(order.order_no || 'order');
  const filename = `invoice-${safeOrderNo}.pdf`;

  return new Response(pdf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, max-age=0, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
