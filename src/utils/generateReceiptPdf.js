import { jsPDF } from 'jspdf';

export function generateReceiptPdf(purchase) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // ── Header ──────────────────────────────────────────────
  doc.setFillColor(17, 24, 39);
  doc.rect(0, 0, pageWidth, 45, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('IDENTRA', margin, 22);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Permanent Digital Business Cards', margin, 31);
  doc.text('Payment Receipt', margin, 39);

  // Invoice number top right
  doc.setFontSize(9);
  doc.setTextColor(200, 210, 220);
  doc.text(purchase.invoice_number || 'N/A', pageWidth - margin, 22, { align: 'right' });

  // ── Status badge ─────────────────────────────────────────
  doc.setFillColor(16, 185, 129);
  doc.roundedRect(margin, 53, 52, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('✓ PAYMENT CONFIRMED', margin + 26, 58.5, { align: 'center' });

  // ── Helper: section title ────────────────────────────────
  let y = 71;

  const sectionTitle = (title) => {
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setFillColor(17, 24, 39);
    doc.rect(margin, y, 3, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(17, 24, 39);
    doc.text(title.toUpperCase(), margin + 6, y + 5.5);
    y += 12;
  };

  // ── Helper: key-value row ────────────────────────────────
  const row = (label, value, highlight = false) => {
    if (highlight) {
      doc.setFillColor(240, 253, 244);
      doc.rect(margin, y - 1, contentWidth, 9, 'F');
    }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(label, margin + 3, y + 5);

    doc.setFont('helvetica', highlight ? 'bold' : 'normal');
    doc.setTextColor(17, 24, 39);
    doc.text(String(value), pageWidth - margin - 3, y + 5, { align: 'right' });

    // divider
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(margin, y + 8, pageWidth - margin, y + 8);
    y += 10;
  };

  // ── Receipt Details ──────────────────────────────────────
  sectionTitle('Receipt Details');

  const receiptDate = purchase.created_date
    ? new Date(purchase.created_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  row('Invoice Number', purchase.invoice_number || 'N/A');
  row('Date', receiptDate);
  row('Payment Method', 'Credit Card');
  row('Status', '✓ Completed');

  y += 2;

  // Amount total highlighted
  doc.setFillColor(254, 243, 199);
  doc.rect(margin, y, contentWidth, 13, 'F');
  doc.setFillColor(245, 158, 11);
  doc.rect(margin, y, 3, 13, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Amount Paid', margin + 6, y + 8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text(`$${Number(purchase.amount || 0).toFixed(2)} USD`, pageWidth - margin - 3, y + 8.5, { align: 'right' });
  y += 20;

  // ── Billing Information ──────────────────────────────────
  sectionTitle('Billing Information');
  row('Name', purchase.customer_name || 'N/A');
  row('Email', purchase.customer_email || 'N/A');

  y += 2;

  // ── Order Details ────────────────────────────────────────
  sectionTitle('Order Details');
  row('Package', `${purchase.plan_name || 'Digital Cards'} Package`);
  row('Digital Card Slots', `${purchase.url_count || 0} permanent slots`);
  row('Quantity', '1');
  row('Unit Price', `$${Number(purchase.amount || 0).toFixed(2)}`);

  y += 2;

  // Total row
  doc.setFillColor(17, 24, 39);
  doc.rect(margin, y, contentWidth, 12, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Total Charged', margin + 4, y + 8);
  doc.text(`$${Number(purchase.amount || 0).toFixed(2)} USD`, pageWidth - margin - 4, y + 8, { align: 'right' });
  y += 20;

  // ── Transaction Reference ────────────────────────────────
  sectionTitle('Transaction Reference');
  if (purchase.stripe_session_id) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text('Session ID:', margin + 3, y + 4);
    doc.setTextColor(17, 24, 39);
    // Wrap long session ID
    const sid = purchase.stripe_session_id;
    doc.text(sid, margin + 3, y + 10, { maxWidth: contentWidth - 6 });
    y += 18;
  }

  // ── Footer ───────────────────────────────────────────────
  const footerY = 272;
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(156, 163, 175);
  doc.text('Identra — Permanent Digital Business Cards Platform', pageWidth / 2, footerY + 6, { align: 'center' });
  doc.text('© 2026 Identra. All rights reserved. · support@identra.com', pageWidth / 2, footerY + 12, { align: 'center' });

  const filename = `receipt-${purchase.invoice_number || purchase.stripe_session_id || 'identra'}.pdf`;
  doc.save(filename);
}