import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import * as fs from 'fs/promises';
import * as path from 'path';

export type InvoiceItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type InvoiceData = {
  invoiceNumber: string;
  invoiceDate: string;
  paymentTerms: string;
  balanceDue: number;
  customerName?: string;
  customerEmail: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  currency: string;
  notes?: string;
  terms?: string;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

// Helper to format currency
const formatCurrency = (amount: number, currency: string): string => {
  // 根据截图，金额前缀通常是 US$ 或类似
  return `US$${amount.toFixed(2)}`;
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
  
  // 1. 注册 fontkit (必须保留以支持自定义字体子集嵌入，解决俄语乱码)
  pdfDoc.registerFontkit(fontkit);

  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  // 2. 加载字体 (确保 public/fonts 目录下有支持俄语的 NotoSans 字体文件)
  const fontDir = path.join(process.cwd(), 'public', 'fonts');
  const regularFontBytes = await fs.readFile(path.join(fontDir, 'NotoSans-Regular.ttf'));
  const boldFontBytes = await fs.readFile(path.join(fontDir, 'NotoSans-Bold.ttf'));

  const regularFont = await pdfDoc.embedFont(regularFontBytes);
  const boldFont = await pdfDoc.embedFont(boldFontBytes);

  // 3. 加载 Logo
  const logoPath = path.join(process.cwd(), 'public', 'logo.png');
  const logoBytes = await fs.readFile(logoPath);
  const logoImage = await pdfDoc.embedPng(logoBytes);

  // 4. 定义颜色
  const black = rgb(0.1, 0.1, 0.1);
  const darkGray = rgb(0.2, 0.2, 0.2); // 表格头颜色
  const gray = rgb(0.4, 0.4, 0.4);      // 标签颜色
  const lightGrayBg = rgb(0.96, 0.96, 0.96); // Balance Due 背景色
  const white = rgb(1, 1, 1);

  let y = PAGE_HEIGHT - MARGIN;

  // ==========================
  // Header Section (Top)
  // ==========================

  // Logo (左侧)
  const logoHeight = 80;
  const logoScale = logoHeight / logoImage.height;
  const logoWidth = logoImage.width * logoScale;
  
  page.drawImage(logoImage, {
    x: MARGIN,
    y: y - logoHeight,
    width: logoWidth,
    height: logoHeight,
  });

  // INVOICE Title (右侧)
  const titleText = 'INVOICE';
  const titleFontSize = 36;
  const titleWidth = regularFont.widthOfTextAtSize(titleText, titleFontSize); // 截图字体偏细，用Regular或Light，这里用Regular
  
  // 对齐最右边
  page.drawText(titleText, {
    x: PAGE_WIDTH - MARGIN - titleWidth,
    y: y - 35,
    size: titleFontSize,
    font: regularFont, // 截图看起来像非粗体
    color: black,
  });

  // Invoice Number (标题下方)
  const invoiceNumText = `# ${data.invoiceNumber}`;
  const invNumFontSize = 12;
  const invNumWidth = regularFont.widthOfTextAtSize(invoiceNumText, invNumFontSize);

  page.drawText(invoiceNumText, {
    x: PAGE_WIDTH - MARGIN - invNumWidth,
    y: y - 55,
    size: invNumFontSize,
    font: regularFont,
    color: gray,
  });

  // 调整 Y 坐标到 Logo 下方
  y -= (logoHeight + 20);

  // ==========================
  // Info Section (Sender & Dates)
  // ==========================

  const senderName = 'AstroInspire Ltd (Veo3 AI)';
  page.drawText(senderName, {
    x: MARGIN,
    y,
    size: 11,
    font: boldFont,
    color: black,
  });

  // 右侧数据块 (Date, Payment Terms, Balance Due)
  // 我们需要计算右侧文本的起始位置
  const rightColLabelX = PAGE_WIDTH - MARGIN - 220; // 标签起始X
  const rightColValueEnd = PAGE_WIDTH - MARGIN;     // 值结束X (右对齐)

  // 1. Date
  page.drawText('Date:', {
    x: rightColLabelX,
    y,
    size: 10,
    font: regularFont,
    color: gray,
  });
  
  const dateStr = formatDate(data.invoiceDate);
  const dateWidth = regularFont.widthOfTextAtSize(dateStr, 10);
  page.drawText(dateStr, {
    x: rightColValueEnd - dateWidth,
    y,
    size: 10,
    font: regularFont,
    color: black,
  });

  y -= 20;

  // 2. Payment Terms
  page.drawText('Payment Terms:', {
    x: rightColLabelX,
    y,
    size: 10,
    font: regularFont,
    color: gray,
  });

  const termsValWidth = regularFont.widthOfTextAtSize(data.paymentTerms, 10);
  page.drawText(data.paymentTerms, {
    x: rightColValueEnd - termsValWidth,
    y,
    size: 10,
    font: regularFont,
    color: black,
  });

  y -= 25; // 增加一点间距给灰色背景条

  // 3. Balance Due (带灰色背景)
  const balanceRowHeight = 24;
  const balanceY = y - 7; // 背景条的底部 Y

  // 绘制灰色背景条 (宽度覆盖标签和值)
  page.drawRectangle({
    x: rightColLabelX - 10, // 左边多一点留白
    y: balanceY,
    width: (PAGE_WIDTH - MARGIN) - (rightColLabelX - 10),
    height: balanceRowHeight,
    color: lightGrayBg,
  });

  page.drawText('Balance Due:', {
    x: rightColLabelX,
    y: y, // 文字基线
    size: 10,
    font: boldFont,
    color: black,
  });

  const balanceStr = formatCurrency(data.balanceDue, data.currency);
  const balanceWidth = boldFont.widthOfTextAtSize(balanceStr, 10);
  page.drawText(balanceStr, {
    x: rightColValueEnd - balanceWidth,
    y: y,
    size: 10,
    font: boldFont,
    color: black,
  });

  y -= 40; // 向下移动更多

  // ==========================
  // Bill To Section
  // ==========================

  page.drawText('Bill To:', {
    x: MARGIN,
    y,
    size: 10,
    font: regularFont,
    color: gray,
  });

  y -= 18;

  if (data.customerName) {
    // 俄语名字，使用 boldFont (NotoSans-Bold 支持 Cyrillic)
    page.drawText(data.customerName, {
      x: MARGIN,
      y,
      size: 11,
      font: boldFont,
      color: black,
    });
    y -= 15;
  }

  page.drawText(`(${data.customerEmail})`, {
    x: MARGIN,
    y,
    size: 10,
    font: regularFont,
    color: gray, // 邮箱颜色偏灰
  });

  y -= 40;

  // ==========================
  // Items Table
  // ==========================

  const tableTop = y;
  const headerHeight = 30;
  
  // 定义列的位置 (除了第一列，其他建议定义为"右边界")
  const col1X = MARGIN;             // Item Start
  const col2End = PAGE_WIDTH - MARGIN - 180; // Quantity End
  const col3End = PAGE_WIDTH - MARGIN - 80;  // Rate End
  const col4End = PAGE_WIDTH - MARGIN;       // Amount End (最右边)

  // 1. 表头背景 (深灰色)
  page.drawRectangle({
    x: MARGIN,
    y: tableTop - headerHeight + 8, // 微调位置
    width: CONTENT_WIDTH,
    height: headerHeight,
    color: darkGray, // 改为深灰色
  });

  const headerY = tableTop - 12;

  // 2. 表头文字 (白色)
  page.drawText('Item', {
    x: col1X + 10,
    y: headerY,
    size: 10,
    font: boldFont,
    color: white,
  });

  // Quantity (右对齐)
  const headQty = 'Quantity';
  const headQtyWidth = boldFont.widthOfTextAtSize(headQty, 10);
  page.drawText(headQty, {
    x: col2End - headQtyWidth,
    y: headerY,
    size: 10,
    font: boldFont,
    color: white,
  });

  // Rate (右对齐)
  const headRate = 'Rate';
  const headRateWidth = boldFont.widthOfTextAtSize(headRate, 10);
  page.drawText(headRate, {
    x: col3End - headRateWidth,
    y: headerY,
    size: 10,
    font: boldFont,
    color: white,
  });

  // Amount (右对齐)
  const headAmt = 'Amount';
  const headAmtWidth = boldFont.widthOfTextAtSize(headAmt, 10);
  page.drawText(headAmt, {
    x: col4End - headAmtWidth,
    y: headerY,
    size: 10,
    font: boldFont,
    color: white,
  });

  y = tableTop - headerHeight - 10;

  // 3. 表格内容行
  const rowHeight = 30;

  for (const item of data.items) {
    const lineTotal = item.quantity * item.unitPrice;

    // Item Description (左对齐, 粗体)
    page.drawText(item.description, {
      x: col1X + 10,
      y: y,
      size: 10,
      font: boldFont, // 截图中的项目名称是加粗的
      color: black,
    });

    // Quantity (右对齐)
    const qtyStr = String(item.quantity);
    const qtyWidth = regularFont.widthOfTextAtSize(qtyStr, 10);
    page.drawText(qtyStr, {
      x: col2End - qtyWidth,
      y: y,
      size: 10,
      font: regularFont,
      color: black,
    });

    // Rate (右对齐)
    const rateStr = formatCurrency(item.unitPrice, data.currency);
    const rateWidth = regularFont.widthOfTextAtSize(rateStr, 10);
    page.drawText(rateStr, {
      x: col3End - rateWidth,
      y: y,
      size: 10,
      font: regularFont,
      color: black,
    });

    // Amount (右对齐)
    const amtStr = formatCurrency(lineTotal, data.currency);
    const amtWidth = regularFont.widthOfTextAtSize(amtStr, 10);
    page.drawText(amtStr, {
      x: col4End - amtWidth,
      y: y,
      size: 10,
      font: regularFont,
      color: black,
    });

    y -= rowHeight;
  }

  y -= 20;

  // ==========================
  // Totals Section (Right Aligned)
  // ==========================
  
  const totalsLabelEnd = col3End; // 标签对齐 Rate 列
  const totalsValueEnd = col4End; // 数值对齐 Amount 列

  const drawTotalLine = (label: string, value: number, isTotal: boolean = false) => {
    const valueStr = formatCurrency(value, data.currency);
    
    // Label
    const labelWidth = regularFont.widthOfTextAtSize(label, 10);
    page.drawText(label, {
      x: totalsLabelEnd - labelWidth,
      y: y,
      size: 10,
      font: regularFont,
      color: isTotal ? black : gray, // 总计用黑色，其他用灰色
    });

    // Value
    const valueWidth = regularFont.widthOfTextAtSize(valueStr, 10);
    page.drawText(valueStr, {
      x: totalsValueEnd - valueWidth,
      y: y,
      size: 10,
      font: regularFont,
      color: black,
    });

    y -= 20;
  };

  drawTotalLine('Subtotal:', data.subtotal);
  drawTotalLine(`Tax (${(data.taxRate * 100).toFixed(0)}%):`, data.taxAmount);
  drawTotalLine('Total:', data.total, true); // 这里的 Total 暂不加粗，如果需要可以改为 boldFont
  drawTotalLine('Amount Paid:', data.amountPaid);

  y -= 40;

  // ==========================
  // Notes & Terms
  // ==========================

  if (data.notes) {
    page.drawText('Notes:', {
      x: MARGIN,
      y,
      size: 10,
      font: regularFont,
      color: gray,
    });
    y -= 15;
    
    // 这里如果 notes 很长可能需要处理换行 (此处暂按单行或简短多行处理)
    page.drawText(data.notes, {
      x: MARGIN,
      y,
      size: 10,
      font: regularFont,
      color: black,
    });
    y -= 30;
  }

  if (data.terms) {
    page.drawText('Terms:', {
      x: MARGIN,
      y,
      size: 10,
      font: regularFont,
      color: gray,
    });
    y -= 15;
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