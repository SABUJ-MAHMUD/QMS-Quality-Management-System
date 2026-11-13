import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileSpreadsheet,
  Download,
  Printer,
  FileText,
  Calendar,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  Presentation,
} from 'lucide-react';
import { exportReportsToExcel, exportCapaToExcel, printQualityReport, exportDashboardToPptx } from '../../utils/exportUtils';
import { computeParetoAnalysis } from '../../utils/oqlCalculator';

export const ReportsView: React.FC = () => {
  const { filteredReports, capas, monitoringRecords, defectGroups, settings, kpiMetrics, filters } = useApp();

  const [selectedReportType, setSelectedReportType] = useState<string>('monthly_oql');

  const reportDefinitions = [
    { id: 'daily_oql', name: '1. Daily OQL Report', desc: 'Day-by-day inspection results, defect sums, and calculated OQL' },
    { id: 'monthly_oql', name: '2. Monthly OQL Report', desc: 'Aggregated monthly defect rates vs 4.5% target' },
    { id: 'buyer_oql', name: '3. Buyer-wise OQL Report', desc: 'BESTSELLER and vendor observed quality level performance' },
    { id: 'order_wise', name: '4. Order-wise Inspection Report', desc: 'Detailed order and style audit results' },
    { id: 'defect_analysis', name: '5. Defect Analysis Report', desc: 'Defect distribution by 12 QMS defect groups' },
    { id: 'pareto_report', name: '6. Defect Pareto Report', desc: '80/20 ranked defect volume with cumulative %' },
    { id: 'severity_report', name: '7. Critical / Major / Minor Report', desc: 'AQL severity proportions and pass rates' },
    { id: 'capa_report', name: '8. RCA & CAPA Report', desc: 'Active 5-Why root cause corrective action logs' },
    { id: 'monitoring_report', name: '9. Monitoring & Effectiveness Report', desc: 'Post-action defect reduction and verification status' },
    { id: 'fy_performance', name: '10. Financial Year Performance Report', desc: 'Full FY26/27 (Aug-Jul) factory quality index' },
  ];

  const handleExcelExport = () => {
    if (selectedReportType === 'capa_report') {
      exportCapaToExcel(capas, 'Garment_QMS_CAPA_Report.xlsx');
    } else {
      exportReportsToExcel(filteredReports, `Garment_QMS_${selectedReportType}.xlsx`);
    }
  };

  const handlePrint = () => {
    const reportInfo = reportDefinitions.find((r) => r.id === selectedReportType);
    const title = reportInfo ? reportInfo.name : 'Quality Analytics Report';

    let tableHtml = `
      <div style="margin-bottom: 16px; padding: 12px; background: #f8fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
        <strong>Total Inspected Scope:</strong> ${kpiMetrics.totalInspectedQuantity.toLocaleString()} pcs &nbsp;|&nbsp;
        <strong>Total Defects:</strong> ${kpiMetrics.totalDefects} &nbsp;|&nbsp;
        <strong>Aggregated OQL:</strong> <span style="font-weight: bold; color: ${kpiMetrics.aggregatedOql <= settings.targetOql ? '#166534' : '#991b1b'};">${kpiMetrics.aggregatedOql.toFixed(2)}%</span> &nbsp;|&nbsp;
        <strong>Target OQL:</strong> ${settings.targetOql.toFixed(2)}% &nbsp;|&nbsp;
        <strong>Pass Rate:</strong> ${kpiMetrics.passRate}%
      </div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Report No</th>
            <th>Buyer</th>
            <th>Order No</th>
            <th>Style No</th>
            <th style="text-align: right;">Inspected</th>
            <th style="text-align: right;">Defects</th>
            <th style="text-align: right;">OQL (%)</th>
            <th style="text-align: center;">Result</th>
          </tr>
        </thead>
        <tbody>
    `;

    filteredReports.forEach((r) => {
      tableHtml += `
        <tr>
          <td>${r.inspectionDate}</td>
          <td><strong>${r.reportNumber}</strong></td>
          <td>${r.buyer}</td>
          <td>${r.orderNumber}</td>
          <td>${r.styleNumber}</td>
          <td style="text-align: right;">${r.inspectedQuantity}</td>
          <td style="text-align: right;">${r.totalDefectQuantity}</td>
          <td style="text-align: right; font-weight: bold;">${r.oql.toFixed(2)}%</td>
          <td style="text-align: center;"><span class="${r.inspectionResult === 'PASSED' ? 'badge-passed' : 'badge-failed'}">${r.inspectionResult}</span></td>
        </tr>
      `;
    });

    tableHtml += `
        </tbody>
      </table>
    `;

    printQualityReport(title, tableHtml);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Quality Reports & Official Export Engine
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
              10 Standard Reports
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate formal documentation for BESTSELLER buyer audits, factory management reviews, and ISO/QMS record-keeping.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            Print / Save as PDF
          </button>
          <button
            onClick={handleExcelExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export to Excel (.xlsx)
          </button>
          <button
            onClick={() => exportDashboardToPptx(filteredReports, capas, filters.month)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#b25900] hover:bg-[#964b00] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Download executive PowerPoint presentation (.pptx) with charts, KPIs, and CAPA logs"
          >
            <Presentation className="w-3.5 h-3.5" />
            Export PPT (.pptx)
          </button>
        </div>
      </div>

      {/* Report Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {reportDefinitions.map((rep) => {
          const isSelected = selectedReportType === rep.id;
          return (
            <button
              key={rep.id}
              onClick={() => setSelectedReportType(rep.id)}
              className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-sky-50/70 border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-sky-300 shadow-2xs'
              }`}
            >
              <div>
                <h3
                  className={`text-xs font-bold leading-snug ${
                    isSelected ? 'text-sky-900' : 'text-slate-800'
                  }`}
                >
                  {rep.name}
                </h3>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{rep.desc}</p>
              </div>
              <span
                className={`mt-2 text-[9px] font-semibold uppercase tracking-wider inline-block ${
                  isSelected ? 'text-sky-700 font-bold' : 'text-slate-400'
                }`}
              >
                {isSelected ? '&bull; Active Selection' : 'Click to preview'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Live Report Preview Canvas */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Report Document Header Preview */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-sky-700">
              Live Filtered Document Preview
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              {reportDefinitions.find((r) => r.id === selectedReportType)?.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Northern Fashions Ltd. &bull; BESTSELLER Observed Quality Level Compliance
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Scope Inspected</span>
              <span className="font-bold text-slate-800">{kpiMetrics.totalInspectedQuantity} pcs</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400 block text-[10px]">Aggregated OQL</span>
              <span
                className={`font-black ${
                  kpiMetrics.aggregatedOql <= settings.targetOql ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {kpiMetrics.aggregatedOql.toFixed(2)}%
              </span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400 block text-[10px]">Pass Rate</span>
              <span className="font-bold text-slate-800">{kpiMetrics.passRate}%</span>
            </div>
          </div>
        </div>

        {/* Preview Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Report Number</th>
                <th className="py-2.5 px-3">Order Number</th>
                <th className="py-2.5 px-3">Style Number</th>
                <th className="py-2.5 px-3 text-right">Order Qty</th>
                <th className="py-2.5 px-3 text-right">Inspected</th>
                <th className="py-2.5 px-3 text-center">Crit</th>
                <th className="py-2.5 px-3 text-center">Maj</th>
                <th className="py-2.5 px-3 text-center">Min</th>
                <th className="py-2.5 px-3 text-center font-bold">Total</th>
                <th className="py-2.5 px-3 text-right">OQL (%)</th>
                <th className="py-2.5 px-3 text-center">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60">
                  <td className="py-2 px-3 font-medium text-slate-700">{r.inspectionDate}</td>
                  <td className="py-2 px-3 font-bold text-sky-800">{r.reportNumber}</td>
                  <td className="py-2 px-3 font-semibold text-slate-800">{r.orderNumber}</td>
                  <td className="py-2 px-3 text-slate-600">{r.styleNumber}</td>
                  <td className="py-2 px-3 text-right text-slate-600">{r.orderQuantity.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-800">{r.inspectedQuantity}</td>
                  <td className="py-2 px-3 text-center text-rose-600 font-bold">{r.criticalDefectQuantity}</td>
                  <td className="py-2 px-3 text-center text-amber-600 font-bold">{r.majorDefectQuantity}</td>
                  <td className="py-2 px-3 text-center text-sky-600 font-bold">{r.minorDefectQuantity}</td>
                  <td className="py-2 px-3 text-center font-extrabold text-slate-900 bg-slate-50">{r.totalDefectQuantity}</td>
                  <td className="py-2 px-3 text-right font-black">
                    <span className={r.oql <= settings.targetOql ? 'text-emerald-600' : 'text-rose-600'}>
                      {r.oql.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.inspectionResult === 'PASSED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {r.inspectionResult}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Corporate branding watermark bar */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500 font-medium">
          Garment Quality Analytics | Digital Quality Intelligence System &bull; Northern Fashions Ltd. QMS
        </div>
      </div>
    </div>
  );
};
