import { jsPDF } from 'jspdf';

export function generateReceiptPdf(purchase) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header background
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, pageWidth, 50, 'F');

  // Logo / title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('IDENTRA', 20, 28);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Payment Receipt', 20, 40);

  // Invoice number top right
  doc.setFontSize(10);
  doc.text(purchase.invoice_number || 'N/A', pageWidth - 20, 28, { align: 'right' });

  // Reset text color
  doc.setTextColor(17, 24, 39);

  // Status badge
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(20, 60, 45, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT CONFIRMED', 42.5, 66.5, { align: 'center' });

  doc.setTextColor(17, 24, 39);

  // Section: Receipt Details
  let y = 82;
  doc.setFillColor(254, 243, 199);
  doc.rect(20, y, pageWidth - 40, 55, 'F');
  doc.setFillColor(245, 158, 11);
  doc.rect(20, y, 3, 55, 'F');

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Receipt Details', 28, y + 11);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const receiptDate = purchase.created_date
    ? new Date(purchase.created_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const rows = [
    ['Invoice Number', purchase.invoice_number || 'N/A'],
    ['Date', receiptDate],
    ['Payment Method', 'Credit Card'],
    ['Status', '✓ Completed'],
  ];

  rows.forEach(([label, value], i) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(label + ':', 28, y + 22 + i * 9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(value, pageWidth - 25, y + 22 + i * 9, { align: 'right' });
  });

  // Total
  y += 50;
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.5);
  doc.line(23, y + 3, pageWidth - 23, y + 3);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text('Amount Paid:', 28, y + 12);
  doc.text(`$${Number(purchase.amount || 0).toFixed(2)} USD`, pageWidth - 25, y + 12, { align: 'right' });

  // Section: Order Summary
  y += 25;
  doc.setFillColor(243, 244, 246);
  doc.rect(20, y, pageWidth - 40, 60, 'F');

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Order Summary', 28, y + 12);

  // Billing to
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('BILLING TO', 28, y + 22);
  doc.setTextColor(17, 24, 39);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(purchase.customer_name || 'N/A', 28, y + 30);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(purchase.customer_email || 'N/A', 28, y + 38);

  // Item table header
  y += 47;
  doc.setFillColor(229, 231, 235);
  doc.rect(20, y, pageWidth - 40, 9, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('Description', 25, y + 6.5);
  doc.text('Qty', pageWidth - 55, y + 6.5, { align: 'right' });
  doc.text('Price', pageWidth - 25, y + 6.5, { align: 'right' });

  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${purchase.plan_name || 'Digital Cards'} Package`, 25, y);
  doc.text('1', pageWidth - 55, y, { align: 'right' });
  doc.text(`$${Number(purchase.amount || 0).toFixed(2)}`, pageWidth - 25, y, { align: 'right' });

  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`Includes ${purchase.url_count || 0} permanent digital card slots`, 25, y);

  // Footer
  y = 270;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(20, y, pageWidth - 20, y);
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('Identra — Permanent Digital Business Cards Platform', pageWidth / 2, y + 8, { align: 'center' });
  doc.text('© 2026 Identra. All rights reserved.', pageWidth / 2, y + 15, { align: 'center' });
  if (purchase.stripe_session_id) {
    doc.text(`Ref: ${purchase.stripe_session_id}`, pageWidth / 2, y + 22, { align: 'center' });
  }

  const filename = `receipt-${purchase.invoice_number || purchase.stripe_session_id || 'identra'}.pdf`;
  doc.save(filename);
}