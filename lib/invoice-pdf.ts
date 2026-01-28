export type InvoiceData = {
  orderNo: string;
  paidEmail: string;
  productName: string;
  amount: number;
  currency: string;
  paidAt: string;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 54;
const START_Y = PAGE_HEIGHT - 72;
const LINE_HEIGHT = 16;

const ASCII_TEXT_REGEX = /[^\x20-\x7E]/g;

const sanitizeText = (value: string) =>
  value.replace(ASCII_TEXT_REGEX, '?').trim();

const escapePdfText = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const formatAmount = (amount: number, currency: string) => {
  const safeCurrency = sanitizeText((currency || 'USD').toUpperCase());
  const value = Number.isFinite(amount) ? amount / 100 : 0;
  return `${value.toFixed(2)} ${safeCurrency}`;
};

const formatDate = (dateValue: string) => {
  if (!dateValue) return 'N/A';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return sanitizeText(dateValue);
  }
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate()
  )} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(
    date.getUTCSeconds()
  )} UTC`;
};

const buildTextStream = (lines: string[]) => {
  const sanitizedLines = lines.map((line) => sanitizeText(line));
  const content: string[] = [];

  content.push('BT');
  content.push('/F1 18 Tf');
  content.push(`${MARGIN_X} ${START_Y} Td`);
  content.push(`(${escapePdfText('Invoice')}) Tj`);
  content.push('ET');

  const bodyStartY = START_Y - 32;
  content.push('BT');
  content.push('/F1 12 Tf');
  content.push(`${MARGIN_X} ${bodyStartY} Td`);
  sanitizedLines.forEach((line, index) => {
    if (index > 0) {
      content.push(`0 -${LINE_HEIGHT} Td`);
    }
    content.push(`(${escapePdfText(line)}) Tj`);
  });
  content.push('ET');

  return content.join('\n');
};

const buildPdf = (contentStream: string) => {
  const objects: string[] = [];
  const offsets: number[] = [];
  let currentOffset = 0;

  const addObject = (value: string) => {
    offsets.push(currentOffset);
    objects.push(value);
    currentOffset += Buffer.byteLength(value, 'utf8');
  };

  const header = '%PDF-1.4\n';
  currentOffset += Buffer.byteLength(header, 'utf8');

  const stream = `${contentStream}\n`;
  const contentLength = Buffer.byteLength(stream, 'utf8');

  addObject('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  addObject(
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'
  );
  addObject(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`
  );
  addObject(
    `4 0 obj\n<< /Length ${contentLength} >>\nstream\n${stream}endstream\nendobj\n`
  );
  addObject(
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'
  );

  const xrefOffset = currentOffset;
  let xref = 'xref\n0 6\n0000000000 65535 f \n';
  offsets.forEach((offset) => {
    xref += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });

  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const pdf = [header, ...objects, xref, trailer].join('');
  return new Uint8Array(Buffer.from(pdf, 'utf8'));
};

export const buildInvoicePdf = (data: InvoiceData) => {
  const lines = [
    `Order No: ${data.orderNo || 'N/A'}`,
    `Email: ${data.paidEmail || 'N/A'}`,
    `Product: ${data.productName || 'N/A'}`,
    `Amount: ${formatAmount(data.amount, data.currency)}`,
    `Paid At: ${formatDate(data.paidAt)}`,
    '',
    'Thank you for your purchase.',
  ];

  const contentStream = buildTextStream(lines);
  return buildPdf(contentStream);
};
