import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import * as fs from 'fs/promises';
import * as path from 'path';

export type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type InvoiceData = {
  // Invoice information
  invoiceNumber: string;
  invoiceDate: string;
  paymentTerms: string; // e.g., "Paid in full"
  balanceDue: number;

  // Customer information
  customerName?: string;
  customerEmail: string;

  // Order items (supports multiple products)
  items: InvoiceItem[];

  // Amounts
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  currency: string;

  // Notes section
  notes?: string;
  terms?: string;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const formatCurrency = (amount: number, currency: string): string => {
  const code = currency.toUpperCase();
  return `${code}$${amount.toFixed(2)}`;
};

const formatDate = (dateValue: string): string => {
  if (!dateValue) return 'N/A';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

export const buildInvoicePdf = async (data: InvoiceData): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  // Load custom fonts
  const fontDir = path.join(process.cwd(), 'public', 'fonts');
  const regularFontBytes = await fs.readFile(path.join(fontDir, 'NotoSans-Regular.ttf'));
  const boldFontBytes = await fs.readFile(path.join(fontDir, 'NotoSans-Bold.ttf'));

  const regularFont = await pdfDoc.embedFont(regularFontBytes);
  const boldFont = await pdfDoc.embedFont(boldFontBytes);

  // Load and embed logo
  const logoPath = path.join(process.cwd(), 'public', 'logo.png');
  const logoBytes = await fs.readFile(logoPath);
  const logoImage = await pdfDoc.embedPng(logoBytes);

  // Colors
  const black = rgb(0, 0, 0);
  const gray = rgb(0.5, 0.5, 0.5);
  const purple = rgb(0.42, 0.35, 0.80); // #6B5ACD - table header color

  let y = PAGE_HEIGHT - MARGIN;

  // === Header Section ===

  // Logo (left side) - scale to ~80px height
  const logoScale = 80 / logoImage.height;
  const logoWidth = logoImage.width * logoScale;
  const logoHeight = 80;
  page.drawImage(logoImage, {
    x: MARGIN,
    y: y - logoHeight,
    width: logoWidth,
    height: logoHeight,
  });

  // INVOICE title (right side)
  const invoiceTitle = 'INVOICE';
  const titleWidth = boldFont.widthOfTextAtSize(invoiceTitle, 36);
  page.drawText(invoiceTitle, {
    x: PAGE_WIDTH - MARGIN - titleWidth,
    y: y - 30,
    size: 36,
    font: boldFont,
    color: black,
  });

  // Invoice number below title
  const invoiceNumText = `# ${data.invoiceNumber}`;
  const invoiceNumWidth = regularFont.widthOfTextAtSize(invoiceNumText, 12);
  page.drawText(invoiceNumText, {
    x: PAGE_WIDTH - MARGIN - invoiceNumWidth,
    y: y - 50,
    size: 12,
    font: regularFont,
    color: gray,
  });

  y -= logoHeight + 20;

  // Company name below logo
  page.drawText('AstroInspire Ltd (Veo3 AI)', {
    x: MARGIN,
    y,
    size: 12,
    font: boldFont,
    color: black,
  });

  // Right side info: Date, Payment Terms, Balance Due
  const rightLabelX = PAGE_WIDTH - MARGIN - 200;
  const rightValueX = PAGE_WIDTH - MARGIN - 80;

  // Date
  page.drawText('Date:', {
    x: rightLabelX,
    y,
    size: 10,
    font: regularFont,
    color: gray,
  });
  const dateText = formatDate(data.invoiceDate);
  const dateWidth = regularFont.widthOfTextAtSize(dateText, 10);
  page.drawText(dateText, {
    x: PAGE_WIDTH - MARGIN - dateWidth,
    y,
    size: 10,
    font: regularFont,
    color: black,
  });

  y -= 18;

  // Payment Terms
  page.drawText('Payment Terms:', {
    x: rightLabelX,
    y,
    size: 10,
    font: regularFont,
    color: gray,
  });
  const termsWidth = regularFont.widthOfTextAtSize(data.paymentTerms, 10);
  page.drawText(data.paymentTerms, {
    x: PAGE_WIDTH - MARGIN - termsWidth,
    y,
    size: 10,
    font: regularFont,
    color: black,
  });

  y -= 18;

  // Balance Due
  page.drawText('Balance Due:', {
    x: rightLabelX,
    y,
    size: 10,
    font: boldFont,
    color: black,
  });
  const balanceText = formatCurrency(data.balanceDue, data.currency);
  const balanceWidth = boldFont.widthOfTextAtSize(balanceText, 10);
  page.drawText(balanceText, {
    x: PAGE_WIDTH - MARGIN - balanceWidth,
    y,
    size: 10,
    font: boldFont,
    color: black,
  });

  y -= 30;

  // === Bill To Section ===
  page.drawText('Bill To:', {
    x: MARGIN,
    y,
    size: 10,
    font: regularFont,
    color: gray,
  });

  y -= 16;

  if (data.customerName) {
    page.drawText(data.customerName, {
      x: MARGIN,
      y,
      size: 11,
      font: boldFont,
      color: black,
    });
    y -= 16;
  }

  page.drawText(`(${data.customerEmail})`, {
    x: MARGIN,
    y,
    size: 10,
    font: regularFont,
    color: black,
  });

  y -= 40;

  // === Items Table ===
  const tableTop = y;
  const colItem = MARGIN;
  const colQty = MARGIN + 280;
  const colRate = MARGIN + 360;
  const colAmount = MARGIN + 440;
  const tableRowHeight = 30;
  const headerHeight = 28;

  // Table header background (purple)
  page.drawRectangle({
    x: MARGIN,
    y: tableTop - headerHeight + 5,
    width: CONTENT_WIDTH,
    height: headerHeight,
    color: purple,
  });

  // Table header text (white)
  const white = rgb(1, 1, 1);
  page.drawText('Item', {
    x: colItem + 10,
    y: tableTop - 15,
    size: 10,
    font: boldFont,
    color: white,
  });

  page.drawText('Quantity', {
    x: colQty,
    y: tableTop - 15,
    size: 10,
    font: boldFont,
    color: white,
  });

  page.drawText('Rate', {
    x: colRate,
    y: tableTop - 15,
    size: 10,
    font: boldFont,
    color: white,
  });

  page.drawText('Amount', {
    x: colAmount,
    y: tableTop - 15,
    size: 10,
    font: boldFont,
    color: white,
  });

  y = tableTop - headerHeight - 5;

  // Table rows
  for (const item of data.items) {
    const lineTotal = item.quantity * item.unitPrice;

    y -= tableRowHeight;

    page.drawText(item.description, {
      x: colItem + 10,
      y: y + 10,
      size: 10,
      font: boldFont,
      color: black,
    });

    page.drawText(String(item.quantity), {
      x: colQty,
      y: y + 10,
      size: 10,
      font: regularFont,
      color: black,
    });

    page.drawText(formatCurrency(item.unitPrice, data.currency), {
      x: colRate,
      y: y + 10,
      size: 10,
      font: regularFont,
      color: black,
    });

    page.drawText(formatCurrency(lineTotal, data.currency), {
      x: colAmount,
      y: y + 10,
      size: 10,
      font: regularFont,
      color: black,
    });
  }

  y -= 50;

  // === Totals Section (right aligned) ===
  const totalsLabelX = colRate - 20;

  // Subtotal
  page.drawText('Subtotal:', {
    x: totalsLabelX,
    y,
    size: 10,
    font: regularFont,
    color: black,
  });
  const subtotalText = formatCurrency(data.subtotal, data.currency);
  const subtotalWidth = regularFont.widthOfTextAtSize(subtotalText, 10);
  page.drawText(subtotalText, {
    x: PAGE_WIDTH - MARGIN - subtotalWidth,
    y,
    size: 10,
    font: regularFont,
    color: black,
  });

  y -= 20;

  // Tax
  const taxLabel = `Tax (${(data.taxRate * 100).toFixed(0)}%):`;
  page.drawText(taxLabel, {
    x: totalsLabelX,
    y,
    size: 10,
    font: regularFont,
    color: black,
  });
  const taxText = formatCurrency(data.taxAmount, data.currency);
  const taxWidth = regularFont.widthOfTextAtSize(taxText, 10);
  page.drawText(taxText, {
    x: PAGE_WIDTH - MARGIN - taxWidth,
    y,
    size: 10,
    font: regularFont,
    color: black,
  });

  y -= 20;

  // Total
  page.drawText('Total:', {
    x: totalsLabelX,
    y,
    size: 10,
    font: regularFont,
    color: black,
  });
  const totalText = formatCurrency(data.total, data.currency);
  const totalWidth = regularFont.widthOfTextAtSize(totalText, 10);
  page.drawText(totalText, {
    x: PAGE_WIDTH - MARGIN - totalWidth,
    y,
    size: 10,
    font: regularFont,
    color: black,
  });

  y -= 20;

  // Amount Paid
  page.drawText('Amount Paid:', {
    x: totalsLabelX,
    y,
    size: 10,
    font: regularFont,
    color: black,
  });
  const paidText = formatCurrency(data.amountPaid, data.currency);
  const paidWidth = regularFont.widthOfTextAtSize(paidText, 10);
  page.drawText(paidText, {
    x: PAGE_WIDTH - MARGIN - paidWidth,
    y,
    size: 10,
    font: regularFont,
    color: black,
  });

  y -= 60;

  // === Notes Section ===
  if (data.notes) {
    page.drawText('Notes:', {
      x: MARGIN,
      y,
      size: 10,
      font: regularFont,
      color: gray,
    });
    y -= 16;
    page.drawText(data.notes, {
      x: MARGIN,
      y,
      size: 10,
      font: regularFont,
      color: black,
    });
    y -= 24;
  }

  // === Terms Section ===
  if (data.terms) {
    page.drawText('Terms:', {
      x: MARGIN,
      y,
      size: 10,
      font: regularFont,
      color: gray,
    });
    y -= 16;
    page.drawText(data.terms, {
      x: MARGIN,
      y,
      size: 10,
      font: regularFont,
      color: black,
    });
  }

  return await pdfDoc.save();
};
