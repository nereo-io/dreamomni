import { NextResponse } from 'next/server';

import { findOrderByOrderNo } from '@/models/order';
import { getUserUuid } from '@/services/user';
import { buildInvoicePdf, InvoiceData } from '@/lib/invoice-pdf';

export const runtime = 'nodejs';

type Order = Exclude<Awaited<ReturnType<typeof findOrderByOrderNo>>, undefined>

// Company information - can be moved to environment variables or config file
const COMPANY_INFO = {
  name: 'Veo3 AI',
  address: 'Singapore',
  phone: '+65 8888 8888',
  email: 'support@veo3ai.io',
  website: 'https://veo3ai.io',
};

const sanitizeFilename = (value: string) =>
  value.replace(/[^a-zA-Z0-9_-]/g, '_');

const getPaymentMethod = (order: Order): string => {
  const channel = order.payment_method?.toLowerCase();
  if (!channel) return 'Online Payment';
  if (channel.includes('stripe')) return 'Credit Card (Stripe)';
  if (channel.includes('creem')) return 'Credit Card (Creem)';
  if (channel.includes('payssion')) return 'Online Payment (Payssion)';
  return 'Online Payment';
};

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

  // Convert amount from cents to dollars
  const amountInDollars = (order.amount || 0) / 100;
  const taxRate = 0; // Default 0% tax
  const taxAmount = amountInDollars * taxRate;
  const total = amountInDollars + taxAmount;

  const invoiceData: InvoiceData = {
    // Company information
    companyName: COMPANY_INFO.name,
    companyAddress: COMPANY_INFO.address,
    companyPhone: COMPANY_INFO.phone,
    companyEmail: COMPANY_INFO.email,
    companyWebsite: COMPANY_INFO.website,

    // Invoice information
    invoiceNumber: order.order_no,
    invoiceDate: order.paid_at || order.created_at || new Date().toISOString(),

    // Customer information
    customerEmail: order.paid_email || order.user_email || '',

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
    currency: order.currency || 'USD',

    // Payment information
    paymentStatus: 'PAID',
    paymentDate: order.paid_at || undefined,
    paymentMethod: getPaymentMethod(order),
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
