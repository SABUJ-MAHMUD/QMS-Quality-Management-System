import * as XLSX from 'xlsx';
import { InspectionReport, CAPARecord, MonitoringRecord } from '../types';

export function exportReportsToExcel(
  reports: InspectionReport[],
  filename: string = 'Garment_Quality_Analytics_Reports.xlsx'
) {
  // 1. Overview sheet
  const overviewData = reports.map((r, index) => ({
    'Sl. No': index + 1,
    'Report Number': r.reportNumber,
    'Inspection Date': r.inspectionDate,
    'Buyer': r.buyer,
    'Factory': r.factory,
    'Order Number': r.orderNumber,
    'Style Number': r.styleNumber,
    'Product Description': r.productDescription,
    'Order Qty': r.orderQuantity,
    'Inspected Qty': r.inspectedQuantity,
    'Critical Defects': r.criticalDefectQuantity,
    'Major Defects': r.majorDefectQuantity,
    'Minor Defects': r.minorDefectQuantity,
    'Total Defects': r.totalDefectQuantity,
    'OQL (%)': `${r.oql.toFixed(2)}%`,
    'Result': r.inspectionResult,
    'Inspection Level': r.inspectionLevel,
    'Data Status': r.isDemo ? 'DEMO DATA' : 'Actual Report',
  }));

  // 2. Defects breakdown sheet
  const defectsData: any[] = [];
  reports.forEach((r) => {
    (r.defects || []).forEach((d, idx) => {
      defectsData.push({
        'Report Number': r.reportNumber,
        'Order Number': r.orderNumber,
        'Style Number': r.styleNumber,
        'Defect Sl': idx + 1,
        'Original Defect Description': d.originalDefectName,
        'Standard Defect Name': d.standardDefectName,
        'Defect Group ID': d.defectGroupId,
        'Severity': d.severity,
        'Defect Quantity': d.defectQuantity,
        'Remarks': d.remarks || '',
      });
    });
  });

  const wb = XLSX.utils.book_new();
  const wsOverview = XLSX.utils.json_to_sheet(overviewData);
  const wsDefects = XLSX.utils.json_to_sheet(defectsData);

  XLSX.utils.book_append_sheet(wb, wsOverview, 'OQL Inspection Reports');
  XLSX.utils.book_append_sheet(wb, wsDefects, 'Defects Breakdown');

  XLSX.writeFile(wb, filename);
}

export function exportCapaToExcel(
  capas: CAPARecord[],
  filename: string = 'CAPA_Management_Log.xlsx'
) {
  const capaData = capas.map((c) => ({
    'CAPA ID': c.capaId,
    'Report No': c.reportNumber,
    'Buyer': c.buyer,
    'Order No': c.orderNumber,
    'Style No': c.styleNumber,
    'Defect Name': c.defectName,
    'Defect Group': c.defectGroup,
    'Severity': c.defectSeverity,
    'Defect Qty': c.defectQuantity,
    'Status': c.capaStatus,
    'Effectiveness': c.effectivenessStatus,
    'Responsible Person': c.responsiblePerson,
    'Department': c.responsibleDepartment,
    'Target Date': c.targetCompletionDate,
    'Root Cause': c.rootCause,
    'Correction': c.correction,
    'Corrective Action': c.correctiveAction,
    'Preventive Action': c.preventiveAction,
    'Monitoring Method': c.monitoringMethod,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(capaData);
  XLSX.utils.book_append_sheet(wb, ws, 'CAPA Log');
  XLSX.writeFile(wb, filename);
}

export function printQualityReport(title: string, contentHtml: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - Garment Quality Analytics</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 24px; padding: 0; }
          .header { border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 22px; font-weight: 700; color: #0f172a; }
          .subtitle { font-size: 13px; color: #0284c7; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
          .meta { font-size: 12px; color: #64748b; text-align: right; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
          th { background: #f1f5f9; text-align: left; padding: 8px 10px; border: 1px solid #cbd5e1; font-weight: 600; color: #1e293b; }
          td { padding: 8px 10px; border: 1px solid #e2e8f0; }
          tr:nth-child(even) { background: #f8fafc; }
          .footer { margin-top: 30px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 11px; color: #64748b; text-align: center; }
          .badge-passed { background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
          .badge-failed { background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">Garment Quality Analytics</div>
            <div class="subtitle">Digital Quality Intelligence System | Northern Fashions Ltd.</div>
          </div>
          <div class="meta">
            <div><strong>Report:</strong> ${title}</div>
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
          </div>
        </div>
        <div>
          ${contentHtml}
        </div>
        <div class="footer">
          <strong>Garment Quality Analytics | Digital Quality Intelligence System</strong><br/>
          Confidential QMS Audit Documentation &copy; ${new Date().getFullYear()} Northern Fashions Ltd.
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Export complete Quality Management Presentation as a PowerPoint (.pptx) slide deck
 * Designed for Northern Fashions Ltd. & BESTSELLER management reviews
 */
export async function exportDashboardToPptx(
  reports: InspectionReport[],
  capas: CAPARecord[],
  activeMonth?: string
) {
  const pptxModule = await import('pptxgenjs');
  const PptxGen = pptxModule.default || pptxModule;
  const pptx = new (PptxGen as any)();

  pptx.layout = 'LAYOUT_16x9';
  pptx.title = 'Northern Fashions Ltd. - Quality Management Presentation';
  pptx.company = 'Northern Fashions Ltd.';

  // Slide 1: Dark Title / Cover Slide
  const slide1 = pptx.addSlide();
  slide1.background = { color: '0A192F' };
  slide1.addText('NORTHERN FASHIONS LTD.', {
    x: 0.8,
    y: 1.8,
    w: 8.5,
    fontSize: 28,
    bold: true,
    color: '38BDF8',
  });
  slide1.addText('BESTSELLER QMS - Observed Quality Level (OQL) & Defect Analytics', {
    x: 0.8,
    y: 2.6,
    w: 8.5,
    fontSize: 18,
    color: 'FFFFFF',
  });
  slide1.addText(`Inspection Analysis & Management Action Plan • Month: ${activeMonth || 'Current Period'}`, {
    x: 0.8,
    y: 3.3,
    w: 8.5,
    fontSize: 13,
    color: '94A3B8',
  });
  slide1.addText('Digital Quality Intelligence System | ISO Apparel OBH Standard', {
    x: 0.8,
    y: 6.2,
    w: 8.5,
    fontSize: 10,
    color: '64748B',
  });

  // Calculate high-level metrics
  const totalReports = reports.length;
  const totalOrderQty = reports.reduce((s, r) => s + (Number(r.orderQuantity) || 0), 0);
  const totalInspected = reports.reduce((s, r) => s + (Number(r.inspectedQuantity) || 0), 0);
  const totalDefects = reports.reduce((s, r) => s + (Number(r.totalDefectQuantity) || 0), 0);
  const avgOql = totalInspected > 0 ? ((totalDefects / totalInspected) * 100).toFixed(2) : '0.00';
  const critDefects = reports.reduce((s, r) => s + (Number(r.criticalDefectQuantity) || 0), 0);
  const majDefects = reports.reduce((s, r) => s + (Number(r.majorDefectQuantity) || 0), 0);
  const minDefects = reports.reduce((s, r) => s + (Number(r.minorDefectQuantity) || 0), 0);

  // Slide 2: Executive Summary & KPI Scorecard
  const slide2 = pptx.addSlide();
  slide2.addText('Executive Quality Scorecard & Inspection Overview', {
    x: 0.8,
    y: 0.6,
    fontSize: 20,
    bold: true,
    color: '0F172A',
  });
  const kpiRows = [
    [
      { text: 'Inspection KPI Metric', options: { bold: true, fill: { color: 'F1F5F9' } } },
      { text: 'Quantity / Value', options: { bold: true, fill: { color: 'F1F5F9' } } },
      { text: 'Target / Benchmark', options: { bold: true, fill: { color: 'F1F5F9' } } },
      { text: 'Audit Verdict', options: { bold: true, fill: { color: 'F1F5F9' } } },
    ],
    ['Inspection Reports Audited', `${totalReports} Reports`, 'All Scheduled Batches', 'Verified'],
    ['Total Order Scope (Pcs)', `${totalOrderQty.toLocaleString()} Pcs`, 'Production POs', 'Audited'],
    ['Inspected Sample Scope', `${totalInspected.toLocaleString()} Pcs`, 'AQL 2.5 Level II Sampling', 'Sampled'],
    ['Total Defect Items', `${totalDefects} Defects`, '0 Critical Defects', critDefects === 0 ? 'Acceptable' : 'High Alert'],
    ['Observed Quality Level (OQL)', `${avgOql}%`, 'Standard Target: < 4.50%', Number(avgOql) <= 4.5 ? 'PASSED' : 'ACTION REQUIRED'],
    ['Critical Defects', `${critDefects}`, '0', critDefects === 0 ? 'Pass' : 'Failed'],
    ['Major Defects', `${majDefects}`, '< 2.5% AQL Limit', 'Monitored'],
    ['Minor Defects', `${minDefects}`, '< 4.0% AQL Limit', 'Monitored'],
  ];
  slide2.addTable(kpiRows, {
    x: 0.8,
    y: 1.3,
    w: 8.5,
    colW: [2.8, 2.0, 2.2, 1.5],
    fontSize: 11,
    rowH: 0.35,
    border: { pt: 0.5, color: 'CBD5E1' },
  });

  // Slide 3: Highest Defect Breakdown
  const slide3 = pptx.addSlide();
  slide3.addText('Highest Defect Frequency & Analysis', {
    x: 0.8,
    y: 0.6,
    fontSize: 20,
    bold: true,
    color: '0F172A',
  });

  const defectMap = new Map<string, number>();
  reports.forEach((r) => {
    (r.defects || []).forEach((d) => {
      const name = d.standardDefectName || d.originalDefectName;
      defectMap.set(name, (defectMap.get(name) || 0) + (Number(d.defectQuantity) || 1));
    });
  });
  const topDefects = Array.from(defectMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 7);

  if (topDefects.length > 0) {
    const defectRows = [
      [
        { text: 'Rank', options: { bold: true, fill: { color: '0284C7' }, color: 'FFFFFF' } },
        { text: 'Defect Description', options: { bold: true, fill: { color: '0284C7' }, color: 'FFFFFF' } },
        { text: 'Quantity Affected', options: { bold: true, fill: { color: '0284C7' }, color: 'FFFFFF' } },
        { text: '% Share of Defects', options: { bold: true, fill: { color: '0284C7' }, color: 'FFFFFF' } },
      ],
      ...topDefects.map(([name, count], i) => [
        `#${i + 1}`,
        name,
        `${count} pcs`,
        totalDefects > 0 ? `${((count / totalDefects) * 100).toFixed(1)}%` : '0%',
      ]),
    ];
    slide3.addTable(defectRows, {
      x: 0.8,
      y: 1.4,
      w: 8.5,
      colW: [0.8, 4.5, 1.6, 1.6],
      fontSize: 11,
      rowH: 0.4,
      border: { pt: 0.5, color: 'CBD5E1' },
    });
  } else {
    slide3.addText('No defects recorded in uploaded reports.', { x: 0.8, y: 2.0, fontSize: 13, color: '64748B' });
  }

  // Slide 4: Root Cause Analysis (RCA) & CAPA Action Plans
  const slide4 = pptx.addSlide();
  slide4.addText('RCA & CAPA - Corrective & Preventive Action Plan', {
    x: 0.8,
    y: 0.6,
    fontSize: 20,
    bold: true,
    color: '0F172A',
  });

  const capaToExport = capas.length > 0 ? capas.slice(0, 5) : [];
  if (capaToExport.length > 0) {
    const capaRows = [
      [
        { text: 'SL', options: { bold: true, fill: { color: '0F172A' }, color: 'FFFFFF' } },
        { text: 'Defect Name', options: { bold: true, fill: { color: '0F172A' }, color: 'FFFFFF' } },
        { text: 'Root Cause', options: { bold: true, fill: { color: '0F172A' }, color: 'FFFFFF' } },
        { text: 'Corrective Action', options: { bold: true, fill: { color: '0F172A' }, color: 'FFFFFF' } },
        { text: 'Preventive Action', options: { bold: true, fill: { color: '0F172A' }, color: 'FFFFFF' } },
        { text: 'Responsible', options: { bold: true, fill: { color: '0F172A' }, color: 'FFFFFF' } },
        { text: 'Status', options: { bold: true, fill: { color: '0F172A' }, color: 'FFFFFF' } },
      ],
      ...capaToExport.map((c, i) => [
        `${i + 1}`,
        c.defectName,
        c.rootCause || 'Root cause analyzed via 5-Why method',
        c.correctiveAction || c.correction || 'Immediate containment & rework',
        c.preventiveAction || 'Machine calibration & operator training',
        c.responsiblePerson || 'Quality In-charge',
        c.capaStatus,
      ]),
    ];
    slide4.addTable(capaRows, {
      x: 0.5,
      y: 1.3,
      w: 9.0,
      colW: [0.5, 1.6, 1.8, 1.8, 1.7, 0.9, 0.7],
      fontSize: 9,
      rowH: 0.45,
      border: { pt: 0.5, color: 'CBD5E1' },
    });
  } else {
    slide4.addText('No active CAPA records saved yet. Create CAPAs in the RCA & CAPA module to populate presentation slides.', {
      x: 0.8,
      y: 2.0,
      fontSize: 12,
      color: '64748B',
    });
  }

  const filename = `Northern_Fashions_QMS_Presentation_${(activeMonth || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_')}.pptx`;
  await pptx.writeFile({ fileName: filename });
}
