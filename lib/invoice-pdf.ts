import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type InvoiceData = {
  // Company information (all configurable via parameters)
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;

  // Invoice information
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;

  // Customer information
  customerName?: string;
  customerEmail: string;

  // Order items (supports multiple products)
  items: InvoiceItem[];

  // Amounts
  subtotal: number;
  taxRate: number; // Default 0
  taxAmount: number; // Auto-calculated
  total: number;
  currency: string;

  // Payment information
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  paymentDate?: string;
  paymentMethod?: string;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// Sanitize text to only include WinAnsi-compatible characters
// pdf-lib standard fonts only support WinAnsi encoding
const sanitizeText = (text: string): string => {
  // Replace non-ASCII characters with '?'
  // WinAnsi supports ASCII (0x20-0x7E) plus some extended Latin characters
  return text.replace(/[^\x20-\x7E]/g, '?');
};

const formatCurrency = (amount: number, currency: string): string => {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: 'EUR ',
    GBP: 'GBP ',
    CNY: 'CNY ',
    JPY: 'JPY ',
    RUB: 'RUB ',
  };
  const symbol = symbols[currency.toUpperCase()] || currency + ' ';
  return `${symbol}${amount.toFixed(2)}`;
};

const formatDate = (dateValue: string): string => {
  if (!dateValue) return 'N/A';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toISOString().split('T')[0];
};

export const buildInvoicePdf = async (data: InvoiceData): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const black = rgb(0, 0, 0);
  const gray = rgb(0.4, 0.4, 0.4);
  const lightGray = rgb(0.9, 0.9, 0.9);
  const green = rgb(0.2, 0.6, 0.2);
  const red = rgb(0.8, 0.2, 0.2);
  const orange = rgb(0.9, 0.6, 0.1);

  let y = PAGE_HEIGHT - MARGIN;

  // === Header Section ===
  // Company name (left)
  page.drawText(data.companyName, {
    x: MARGIN,
    y,
    size: 20,
    font: helveticaBold,
    color: black,
  });

  // INVOICE title (right)
  const invoiceTitle = 'INVOICE';
  const titleWidth = helveticaBold.widthOfTextAtSize(invoiceTitle, 24);
  page.drawText(invoiceTitle, {
    x: PAGE_WIDTH - MARGIN - titleWidth,
    y,
    size: 24,
    font: helveticaBold,
    color: black,
  });

  y -= 18;

  // Company address
  page.drawText(data.companyAddress, {
    x: MARGIN,
    y,
    size: 10,
    font: helvetica,
    color: gray,
  });

  // Invoice number (right)
  const invoiceNumText = `Invoice #: ${data.invoiceNumber}`;
  const invoiceNumWidth = helvetica.widthOfTextAtSize(invoiceNumText, 10);
  page.drawText(invoiceNumText, {
    x: PAGE_WIDTH - MARGIN - invoiceNumWidth,
    y,
    size: 10,
    font: helvetica,
    color: black,
  });

  y -= 14;

  // Company phone
  page.drawText(`Phone: ${data.companyPhone}`, {
    x: MARGIN,
    y,
    size: 10,
    font: helvetica,
    color: gray,
  });

  // Invoice date (right)
  const dateText = `Date: ${formatDate(data.invoiceDate)}`;
  const dateWidth = helvetica.widthOfTextAtSize(dateText, 10);
  page.drawText(dateText, {
    x: PAGE_WIDTH - MARGIN - dateWidth,
    y,
    size: 10,
    font: helvetica,
    color: black,
  });

  y -= 14;

  // Company email
  page.drawText(`Email: ${data.companyEmail}`, {
    x: MARGIN,
    y,
    size: 10,
    font: helvetica,
    color: gray,
  });

  // Due date (right, if provided)
  if (data.dueDate) {
    const dueText = `Due: ${formatDate(data.dueDate)}`;
    const dueWidth = helvetica.widthOfTextAtSize(dueText, 10);
    page.drawText(dueText, {
      x: PAGE_WIDTH - MARGIN - dueWidth,
      y,
      size: 10,
      font: helvetica,
      color: black,
    });
  }

  y -= 30;

  // === Separator line ===
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 1,
    color: lightGray,
  });

  y -= 25;

  // === Bill To Section ===
  page.drawText('Bill To:', {
    x: MARGIN,
    y,
    size: 12,
    font: helveticaBold,
    color: black,
  });

  y -= 16;

  if (data.customerName) {
    page.drawText(sanitizeText(data.customerName), {
      x: MARGIN,
      y,
      size: 10,
      font: helvetica,
      color: black,
    });
    y -= 14;
  }

  page.drawText(sanitizeText(data.customerEmail), {
    x: MARGIN,
    y,
    size: 10,
    font: helvetica,
    color: black,
  });

  y -= 30;

  // === Items Table ===
  const tableTop = y;
  const colDescription = MARGIN;
  const colQty = MARGIN + 280;
  const colUnitPrice = MARGIN + 340;
  const colAmount = MARGIN + 420;
  const tableRowHeight = 25;

  // Table header background
  page.drawRectangle({
    x: MARGIN,
    y: tableTop - 20,
    width: CONTENT_WIDTH,
    height: 25,
    color: lightGray,
  });

  // Table header text
  page.drawText('Description', {
    x: colDescription + 5,
    y: tableTop - 14,
    size: 10,
    font: helveticaBold,
    color: black,
  });

  page.drawText('Qty', {
    x: colQty,
    y: tableTop - 14,
    size: 10,
    font: helveticaBold,
    color: black,
  });

  page.drawText('Unit Price', {
    x: colUnitPrice,
    y: tableTop - 14,
    size: 10,
    font: helveticaBold,
    color: black,
  });

  page.drawText('Amount', {
    x: colAmount,
    y: tableTop - 14,
    size: 10,
    font: helveticaBold,
    color: black,
  });

  y = tableTop - 20 - tableRowHeight;

  // Table rows
  for (const item of data.items) {
    const lineTotal = item.quantity * item.unitPrice;

    page.drawText(sanitizeText(item.description), {
      x: colDescription + 5,
      y: y + 8,
      size: 10,
      font: helvetica,
      color: black,
    });

    page.drawText(String(item.quantity), {
      x: colQty,
      y: y + 8,
      size: 10,
      font: helvetica,
      color: black,
    });

    page.drawText(formatCurrency(item.unitPrice, data.currency), {
      x: colUnitPrice,
      y: y + 8,
      size: 10,
      font: helvetica,
      color: black,
    });

    page.drawText(formatCurrency(lineTotal, data.currency), {
      x: colAmount,
      y: y + 8,
      size: 10,
      font: helvetica,
      color: black,
    });

    // Row separator line
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: PAGE_WIDTH - MARGIN, y },
      thickness: 0.5,
      color: lightGray,
    });

    y -= tableRowHeight;
  }

  // Table bottom line
  page.drawLine({
    start: { x: MARGIN, y: y + tableRowHeight },
    end: { x: PAGE_WIDTH - MARGIN, y: y + tableRowHeight },
    thickness: 1,
    color: lightGray,
  });

  y -= 10;

  // === Totals Section ===
  const totalsX = colUnitPrice - 30;

  // Subtotal
  page.drawText('Subtotal:', {
    x: totalsX,
    y,
    size: 10,
    font: helvetica,
    color: black,
  });
  page.drawText(formatCurrency(data.subtotal, data.currency), {
    x: colAmount,
    y,
    size: 10,
    font: helvetica,
    color: black,
  });

  y -= 16;

  // Tax
  const taxLabel = `Tax (${(data.taxRate * 100).toFixed(0)}%):`;
  page.drawText(taxLabel, {
    x: totalsX,
    y,
    size: 10,
    font: helvetica,
    color: black,
  });
  page.drawText(formatCurrency(data.taxAmount, data.currency), {
    x: colAmount,
    y,
    size: 10,
    font: helvetica,
    color: black,
  });

  y -= 20;

  // Total (bold)
  page.drawText('Total:', {
    x: totalsX,
    y,
    size: 12,
    font: helveticaBold,
    color: black,
  });
  page.drawText(formatCurrency(data.total, data.currency), {
    x: colAmount,
    y,
    size: 12,
    font: helveticaBold,
    color: black,
  });

  y -= 40;

  // === Payment Status Section ===
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 1,
    color: lightGray,
  });

  y -= 20;

  // Payment status with color
  const statusColor =
    data.paymentStatus === 'PAID'
      ? green
      : data.paymentStatus === 'PENDING'
        ? orange
        : red;

  page.drawText('Payment Status:', {
    x: MARGIN,
    y,
    size: 10,
    font: helveticaBold,
    color: black,
  });
  page.drawText(data.paymentStatus, {
    x: MARGIN + 95,
    y,
    size: 10,
    font: helveticaBold,
    color: statusColor,
  });

  y -= 16;

  // Payment date
  if (data.paymentDate) {
    page.drawText('Payment Date:', {
      x: MARGIN,
      y,
      size: 10,
      font: helvetica,
      color: black,
    });
    page.drawText(formatDate(data.paymentDate), {
      x: MARGIN + 95,
      y,
      size: 10,
      font: helvetica,
      color: black,
    });
    y -= 16;
  }

  // Payment method
  if (data.paymentMethod) {
    page.drawText('Payment Method:', {
      x: MARGIN,
      y,
      size: 10,
      font: helvetica,
      color: black,
    });
    page.drawText(sanitizeText(data.paymentMethod), {
      x: MARGIN + 95,
      y,
      size: 10,
      font: helvetica,
      color: black,
    });
    y -= 16;
  }

  y -= 30;

  // === Footer Section ===
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 1,
    color: lightGray,
  });

  y -= 25;

  // Thank you message
  const thankYouText = 'Thank you for your business!';
  const thankYouWidth = helvetica.widthOfTextAtSize(thankYouText, 12);
  page.drawText(thankYouText, {
    x: (PAGE_WIDTH - thankYouWidth) / 2,
    y,
    size: 12,
    font: helvetica,
    color: gray,
  });

  y -= 16;

  // Company website
  const websiteWidth = helvetica.widthOfTextAtSize(data.companyWebsite, 10);
  page.drawText(data.companyWebsite, {
    x: (PAGE_WIDTH - websiteWidth) / 2,
    y,
    size: 10,
    font: helvetica,
    color: gray,
  });

  return await pdfDoc.save();
};
