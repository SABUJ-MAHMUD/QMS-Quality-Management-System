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
