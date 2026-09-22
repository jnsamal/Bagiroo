const NAVY = '0 0 0';
const DARK = '0.08 0.08 0.09';
const MUTED = '0.38 0.40 0.43';
const LIGHT = '0.94 0.95 0.96';

function safe(value) {
  return String(value ?? '').replace(/[^\x20-\x7E]/g, ' ').replace(/([\\()])/g, '\\$1');
}
function money(minor, currency = 'INR') { return `${currency} ${(Number(minor || 0) / 100).toFixed(2)}`; }
function shorten(value, max) { const text = String(value || ''); return text.length > max ? `${text.slice(0, max - 3)}...` : text; }
function text(x, y, value, size = 9, bold = false, color = DARK) {
  return `${color} rg BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${safe(value)}) Tj ET`;
}
function line(x1, y1, x2, y2, color = '0.70 0.73 0.77', width = 0.6) { return `${color} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`; }
function rect(x, y, width, height, color) { return `${color} rg ${x} ${y} ${width} ${height} re f`; }

function pageContent(order, items, pageIndex, pageCount, isLastPage) {
  const commands = [];
  const shipping = order.addresses.find(address => address.type === 'SHIPPING');
  const billing = order.addresses.find(address => address.type === 'BILLING') || shipping;
  const customerName = order.user?.name || billing?.fullName || 'Customer';
  const email = order.user?.email || order.guestEmail || '';

  // Brand and invoice masthead.
  commands.push(rect(26, 777, 30, 30, NAVY), text(36, 787, 'B', 13, true, '1 1 1'));
  commands.push(text(64, 792, 'Bagiroo & Co.', 12, true), text(26, 758, `Invoice Number: ${order.orderNumber}`, 8), text(26, 744, `Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 8));
  commands.push(rect(355, 772, 214, 40, NAVY), text(374, 783, 'INVOICE', 25, true, '1 1 1'));
  if (pageCount > 1) commands.push(text(516, 758, `Page ${pageIndex + 1}/${pageCount}`, 8, false, MUTED));
  commands.push(line(26, 727, 569, 727, NAVY, 1));

  // Seller and customer columns.
  commands.push(text(26, 707, 'Bill from:', 8, true), text(310, 707, 'Bill to:', 8, true));
  commands.push(text(26, 691, 'Bagiroo & Co.', 9, true), text(26, 676, 'Online Store', 8), text(26, 661, 'India', 8));
  commands.push(text(310, 691, customerName, 9, true));
  let billY = 676;
  if (billing) {
    [billing.line1, billing.line2, `${billing.city}, ${billing.state} ${billing.postalCode}`, billing.phone].filter(Boolean).forEach(value => { commands.push(text(310, billY, shorten(value, 48), 8)); billY -= 14; });
  }
  if (email && billY > 635) commands.push(text(310, billY, shorten(email, 48), 8));

  // Item table.
  commands.push(rect(26, 615, 543, 28, LIGHT), line(26, 643, 569, 643, NAVY), line(26, 615, 569, 615));
  commands.push(text(32, 625, 'Item', 9, true), text(305, 625, 'Quantity', 9, true), text(371, 625, 'Rate', 9, true), text(445, 625, 'Tax', 9, true), text(510, 625, 'Amount', 9, true));
  let rowY = 592;
  items.forEach(item => {
    const itemBase = item.priceMinor * item.quantity;
    const itemTax = order.subtotalMinor ? Math.round(order.taxMinor * itemBase / order.subtotalMinor) : 0;
    commands.push(text(32, rowY, shorten(`${item.titleSnapshot}${item.variation?.colorName ? ` - ${item.variation.colorName}` : ''}`, 43), 8));
    commands.push(text(323, rowY, item.quantity, 8), text(371, rowY, money(item.priceMinor, order.currency), 8), text(445, rowY, money(itemTax, order.currency), 8), text(510, rowY, money(itemBase, order.currency), 8));
    rowY -= 32;
    commands.push(line(26, rowY + 18, 569, rowY + 18));
  });

  if (isLastPage) {
    const paidMinor = (order.payments || []).filter(payment => payment.status === 'CAPTURED').reduce((sum, payment) => sum + payment.amountMinor, 0);
    const summaryTop = Math.min(rowY - 4, 260);
    commands.push(text(26, summaryTop, 'Terms & Conditions:', 8, true), text(26, summaryTop - 16, 'This invoice was generated for your Bagiroo & Co. order.', 7, false, MUTED));
    const labels = [['Subtotal:', order.subtotalMinor], ['Discount:', -order.discountMinor], ['Shipping:', order.shippingMinor], ['Tax:', order.taxMinor], ['Paid:', paidMinor]];
    let totalY = summaryTop;
    labels.forEach(([label, value]) => { commands.push(text(375, totalY, label, 8), text(500, totalY, `${value < 0 ? '-' : ''}${money(Math.abs(value), order.currency)}`, 8)); totalY -= 18; });
    commands.push(rect(350, 62, 219, 42, NAVY), text(367, 76, 'Total', 14, true, '1 1 1'), text(468, 76, money(order.totalMinor, order.currency), 14, true, '1 1 1'));
  }
  commands.push(line(26, 45, 569, 45, NAVY), text(26, 27, 'Thank you for shopping with Bagiroo & Co.', 7, false, MUTED));
  return commands.join('\n');
}

function createInvoicePdf(order) {
  const chunks = [];
  for (let index = 0; index < order.items.length; index += 9) chunks.push(order.items.slice(index, index + 9));
  if (!chunks.length) chunks.push([]);
  const streams = chunks.map((items, index) => pageContent(order, items, index, chunks.length, index === chunks.length - 1));
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${streams.map((_, index) => `${5 + index * 2} 0 R`).join(' ')}] /Count ${streams.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ];
  streams.forEach(stream => {
    const pageNumber = objects.length + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pageNumber + 1} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
  });
  let output = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => { offsets.push(Buffer.byteLength(output)); output += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = Buffer.byteLength(output);
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => { output += `${String(offset).padStart(10, '0')} 00000 n \n`; });
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(output, 'ascii');
}

module.exports = { createInvoicePdf };
