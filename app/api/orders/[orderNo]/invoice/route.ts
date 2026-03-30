import { NextResponse } from 'next/server';

import { findOrderByOrderNo } from '@/models/order';
import { findUserByUuid } from '@/models/user';
import { getUserUuid } from '@/services/user';
import { buildInvoicePdf, InvoiceData } from '@/lib/invoice-pdf';

export const runtime = 'nodejs';

type Order = Exclude<Awaited<ReturnType<typeof findOrderByOrderNo>>, undefined>;

const sanitizeFilename = (value: string) =>
  value.replace(/[^a-zA-Z0-9_-]/g, '_');

const getPaymentMethod = (order: Order): string => {
  const channel = order.payment_method?.toLowerCase();
  if (!channel) return 'Online Payment';
  if (channel.includes('stripe')) return 'Stripe';
  if (channel.includes('creem')) return 'Creem';
  if (channel.includes('payssion')) return 'Payssion';
  if (channel.includes('sberpay')) return 'Payssion (Sberpay)';
  return channel;
};

export async function GET(
  request: Request,
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
  const user = await findUserByUuid(userUuid);

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.user_uuid !== userUuid || !user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const searchParams = new URL(request.url).searchParams;
  const requestedTitle = searchParams.get('title')?.trim() || '';
  const requestedEmail = searchParams.get('email')?.trim() || '';
  const requestedAddress = searchParams.get('address')?.trim() || '';

  const customerName =
    requestedTitle ||
    user.nickname ||
    order.paid_email ||
    order.user_email ||
    undefined;
  const customerEmail = requestedEmail || order.paid_email || order.user_email || '';
  const customerAddress = requestedAddress || '';

  if (!customerEmail) {
    return NextResponse.json(
      { error: 'Customer email is required' },
      { status: 400 }
    );
  }

  // Convert amount from cents to dollars
  const amountInDollars = (order.amount || 0) / 100;
  const taxRate = 0; // Default 0% tax
  const taxAmount = amountInDollars * taxRate;
  const total = amountInDollars + taxAmount;

  // Build notes with payment info
  const paymentMethod = getPaymentMethod(order);
  const paymentId = order.payment_id || order.order_no;
  const notes = `Payment received via ${paymentMethod}. Payment ID: ${paymentId}`;

  // Build terms with validity period (if subscription has period end)
  let terms: string | undefined;
  if (order.sub_period_end) {
    const endDate = new Date(order.sub_period_end * 1000); // Unix timestamp to Date
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    terms = `Valid until ${months[endDate.getMonth()]} ${endDate.getDate()}, ${endDate.getFullYear()}`;
  }

  const invoiceData: InvoiceData = {
    // Invoice information
    invoiceNumber: order.order_no,
    invoiceDate: order.paid_at || order.created_at || new Date().toISOString(),
    paymentTerms: 'Paid in full',
    balanceDue: 0,

    // Customer information
    customerEmail,
    customerName,
    customerAddress,

    // Order items
    items: [
      {
        description: order.product_name || 'Credits Package',
        quantity: 1,
        unitPrice: amountInDollars,
      },
    ],

    // Amounts
    subtotal: amountInDollars,
    taxRate,
    taxAmount,
    total,
    amountPaid: total,
    currency: order.currency || 'USD',

    // Notes and terms
    notes,
    terms,
  };

  const pdfBytes = await buildInvoicePdf(invoiceData);
  const pdfBuffer = Buffer.from(pdfBytes);

  const safeOrderNo = sanitizeFilename(order.order_no || 'order');
  const filename = `invoice-${safeOrderNo}.pdf`;

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, max-age=0, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
