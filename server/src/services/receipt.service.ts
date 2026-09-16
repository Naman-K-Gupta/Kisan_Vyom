import PDFDocument from 'pdfkit';

export interface WeighmentSlipPdfData {
  paymentNumber?: string;
  tokenNumber?: string;
  centreName?: string;
  centreDistrict?: string;
  centreState?: string;
  farmerName?: string;
  farmerMobile?: string;
  farmerVillage?: string;
  cropName?: string;
  quantity?: number;
  unit?: string;
  ratePerUnit?: number;
  grossAmount?: number;
  deductions?: number;
  amount?: number;
  moisturePercentage?: number | null;
  foreignMatterPercentage?: number | null;
  qualityGrade?: string | null;
  vehicleNumber?: string | null;
  vehicleType?: string | null;
  bankName?: string | null;
  accountNumberMasked?: string | null;
  createdAt?: string | Date | null;
}

/**
 * Generate official APMC Mandi Weighment Slip (Tulai Parchi) as PDF buffer
 */
export async function generateWeighmentSlipPdf(data: WeighmentSlipPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      const buffers: Buffer[] = [];
      doc.on('data', (b: Buffer) => buffers.push(b));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const slipNo = data.paymentNumber || 'PAY-SLIP-0001';
      const tokenNo = data.tokenNumber || 'T-2026-0001';
      const centre = data.centreName || 'APMC Procurement Yard';
      const farmer = data.farmerName || 'Registered Farmer';
      const mobile = data.farmerMobile ? `+91 ${data.farmerMobile}` : 'N/A';
      const village = data.farmerVillage || 'Local Village';
      const vehicle = data.vehicleNumber || 'Registered Vehicle';
      const vehicleCategory = data.vehicleType || 'Tractor Trolley';
      const crop = data.cropName || 'Wheat (FAQ)';
      const qty = data.quantity ? `${data.quantity} ${data.unit || 'Quintals'}` : 'N/A';
      const moisture = data.moisturePercentage != null ? `${data.moisturePercentage}%` : 'Standard (FAQ)';
      const foreignMatter = data.foreignMatterPercentage != null ? `${data.foreignMatterPercentage}%` : 'Normal';
      const grade = data.qualityGrade || 'Grade A (FAQ Passed)';
      const rate = data.ratePerUnit ? `Rs ${data.ratePerUnit.toLocaleString('en-IN')}` : 'MSP Benchmark';
      const gross = data.grossAmount ? `Rs ${data.grossAmount.toLocaleString('en-IN')}` : 'N/A';
      const deductions = data.deductions ? `- Rs ${data.deductions.toLocaleString('en-IN')}` : 'Rs 0.00';
      const net = data.amount ? `Rs ${data.amount.toLocaleString('en-IN')}` : 'N/A';
      const bank = data.bankName || 'State Bank of India';
      const maskedAcc = data.accountNumberMasked || 'XXXXXX4021';
      const dateStr = data.createdAt ? new Date(data.createdAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN');

      // Outer border styling
      doc.rect(20, 20, 555, 800).lineWidth(1.5).strokeColor('#15803d').stroke();
      doc.rect(23, 23, 549, 794).lineWidth(0.5).strokeColor('#86efac').stroke();

      // Mandi header
      doc.fontSize(8.5).font('Helvetica').fillColor('#64748b').text('GOVERNMENT OF INDIA • MINISTRY OF AGRICULTURE & FARMERS WELFARE', 30, 34, { align: 'center' });
      doc.fontSize(15).font('Helvetica-Bold').fillColor('#0f172a').text('KRISHI UPAJ MANDI SAMITI (APMC)', { align: 'center' });
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#15803d').text(centre, { align: 'center' });
      doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#b45309').text('OFFICIAL MANDI WEIGHMENT SLIP (तुलाई पर्ची) & QUALITY ASSAY', { align: 'center' });
      doc.moveDown(0.4);

      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(35, doc.y).lineTo(560, doc.y).stroke();
      doc.moveDown(0.7);

      // Consignor & vehicle summary
      const metaY = doc.y;
      doc.fontSize(8.5).font('Helvetica').fillColor('#64748b').text('SLIP NUMBER:', 40, metaY);
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#0f172a').text(slipNo, 40, metaY + 12);

      doc.fontSize(8.5).font('Helvetica').fillColor('#64748b').text('QUEUE TOKEN:', 40, metaY + 28);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1d4ed8').text(tokenNo, 40, metaY + 40);

      doc.fontSize(8.5).font('Helvetica').fillColor('#64748b').text('DATE & TIME:', 40, metaY + 56);
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#0f172a').text(dateStr, 40, metaY + 68);

      doc.fontSize(8.5).font('Helvetica').fillColor('#64748b').text('FARMER CONSIGNOR:', 310, metaY);
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a').text(farmer, 310, metaY + 12);

      doc.fontSize(8.5).font('Helvetica').fillColor('#64748b').text('MOBILE & VILLAGE:', 310, metaY + 28);
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#0f172a').text(`${mobile} (${village})`, 310, metaY + 40);

      doc.fontSize(8.5).font('Helvetica').fillColor('#64748b').text('VEHICLE REGISTRATION:', 310, metaY + 56);
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#047857').text(`${vehicle} (${vehicleCategory})`, 310, metaY + 68);

      doc.y = metaY + 92;
      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(35, doc.y).lineTo(560, doc.y).stroke();
      doc.moveDown(0.8);

      // Quality metrics table
      const tableY = doc.y;
      doc.rect(35, tableY, 525, 22).fillColor('#f1f5f9').fill();
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#334155');
      doc.text('COMMODITY', 45, tableY + 6);
      doc.text('NET WEIGHED', 160, tableY + 6);
      doc.text('MOISTURE %', 270, tableY + 6);
      doc.text('IMPURITY %', 360, tableY + 6);
      doc.text('FAQ GRADE', 450, tableY + 6);

      doc.y = tableY + 28;
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#0f172a');
      doc.text(crop, 45, doc.y);
      doc.text(qty, 160, doc.y);
      doc.fillColor('#1d4ed8').text(moisture, 270, doc.y);
      doc.fillColor('#0f172a').text(foreignMatter, 360, doc.y);
      doc.fillColor('#15803d').text(grade, 450, doc.y);

      doc.moveDown(1.6);

      // Financial breakdown & deductions
      const finY = doc.y;
      doc.rect(35, finY, 525, 110).lineWidth(1).strokeColor('#cbd5e1').fillColor('#f8fafc').fillAndStroke();
      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#0f172a').text('FINANCIAL SETTLEMENT (MINIMUM SUPPORT PRICE)', 45, finY + 12);
      
      doc.fontSize(8.5).font('Helvetica').fillColor('#475569');
      doc.text('Government MSP Rate Applied:', 45, finY + 32);
      doc.font('Helvetica-Bold').text(`${rate} / Qtl`, 370, finY + 32, { align: 'right', width: 175 });

      doc.font('Helvetica').text(`Gross Lot Valuation (${qty} @ ${rate}):`, 45, finY + 48);
      doc.font('Helvetica-Bold').text(gross, 370, finY + 48, { align: 'right', width: 175 });

      doc.font('Helvetica').fillColor('#dc2626').text('Moisture & FAQ Refraction Deductions (Value Cut):', 45, finY + 64);
      doc.font('Helvetica-Bold').fillColor('#dc2626').text(deductions, 370, finY + 64, { align: 'right', width: 175 });

      doc.strokeColor('#94a3b8').lineWidth(1).moveTo(45, finY + 82).lineTo(545, finY + 82).stroke();
      doc.fontSize(10.5).font('Helvetica-Bold').fillColor('#15803d').text('NET PAYABLE FARMER DBT SETTLEMENT:', 45, finY + 89);
      doc.fontSize(12).fillColor('#15803d').text(net, 370, finY + 88, { align: 'right', width: 175 });

      // Banking & disbursement reference
      doc.y = finY + 124;
      doc.fontSize(8).font('Helvetica').fillColor('#64748b');
      doc.text(`Disbursement Channel: PFMS Direct Benefit Transfer (DBT) • ${bank} • A/C: ${maskedAcc} • Aadhaar Linked`, 35, doc.y, { align: 'center' });
      doc.moveDown(2);

      // Signatures
      const sigY = doc.y + 10;
      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(35, sigY).lineTo(560, sigY).stroke();
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#475569');
      doc.text('Farmer / Consignor Acknowledgment', 60, sigY + 35);
      doc.text('Weighbridge Incharge (Digital Sign-Off)', 340, sigY + 35);

      doc.fontSize(7.5).font('Helvetica').fillColor('#94a3b8').text(
        'This is a certified digital weighment slip generated via Kisan Kendra Digital Mandi Assistance System under APMC regulations.',
        35,
        782,
        { align: 'center' }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
