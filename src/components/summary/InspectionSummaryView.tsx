import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InspectionReport } from '../../types';
import {
  BarChart3,
  PieChart as PieChartIcon,
  FileCheck2,
  Sparkles,
  Eye,
  X,
  FileUp,
  TrendingDown,
  TrendingUp,
  AlertOctagon,
  AlertTriangle,
  Info,
  Layers,
  ChevronRight,
  UploadCloud,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from 'recharts';
import { getCanonicalDefectInfo } from '../../data/defectMasterData';

export const InspectionSummaryView: React.FC = () => {
  const { filteredReports, settings, setActiveTab, defectGroups, kpiMetrics } = useApp();

  const [selectedDrilldownGroup, setSelectedDrilldownGroup] = useState<string | null>(null);
  const [selectedReportModal, setSelectedReportModal] = useState<InspectionReport | null>(null);

  // High-vibrancy enterprise palette for categories
  const VIBRANT_COLORS = [
    '#0284c7', // Sky Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#f97316', // Orange
    '#06b6d4', // Cyan
    '#6366f1', // Indigo
    '#14b8a6', // Teal
    '#64748b', // Slate
  ];

  const SEVERITY_COLORS = {
    Critical: '#dc2626',
    Major: '#ea580c',
    Minor: '#0284c7',
  };

  // 1. Group-wise defect breakdown sorted in descending order of frequency
  const groupDefectMap = new Map<
    string,
    { totalQty: number; critical: number; major: number; minor: number; defectItems: Map<string, number> }
  >();

  let grandTotalDefects = 0;

  filteredReports.forEach((r) => {
    (r.defects || []).forEach((d) => {
      const canonical = getCanonicalDefectInfo(d);
      let gName = canonical.categoryName || 'General Workmanship';
      if (d.defectGroupId) {
        const found = defectGroups.find((g) => g.id === d.defectGroupId);
        if (found) gName = found.groupName;
      }

      const cur = groupDefectMap.get(gName) || {
        totalQty: 0,
        critical: 0,
        major: 0,
        minor: 0,
        defectItems: new Map<string, number>(),
      };

      const qty = Number(d.defectQuantity) || 1;
      cur.totalQty += qty;
      grandTotalDefects += qty;

      if (d.severity === 'Critical') cur.critical += qty;
      else if (d.severity === 'Major') cur.major += qty;
      else cur.minor += qty;

      const itemQty = cur.defectItems.get(d.standardDefectName) || 0;
      cur.defectItems.set(d.standardDefectName, itemQty + qty);

      groupDefectMap.set(gName, cur);
    });
  });

  const sortedGroupData = Array.from(groupDefectMap.entries())
    .map(([groupName, data], index) => {
      const percentage = grandTotalDefects > 0 ? ((data.totalQty / grandTotalDefects) * 100).toFixed(1) : '0';
      return {
        groupName,
        totalQty: data.totalQty,
        percentage: `${percentage}%`,
        displayLabel: `${data.totalQty} (${percentage}%)`,
        critical: data.critical,
        major: data.major,
        minor: data.minor,
        fillColor: VIBRANT_COLORS[index % VIBRANT_COLORS.length],
        items: Array.from(data.defectItems.entries()).map(([name, qty]) => ({ name, qty })),
      };
    })
    .sort((a, b) => b.totalQty - a.totalQty);

  // Defect Severity Pie Data with visible percentage and count
  const severityPieData = [
    { name: 'Critical', value: kpiMetrics.criticalDefects, color: SEVERITY_COLORS.Critical },
    { name: 'Major', value: kpiMetrics.majorDefects, color: SEVERITY_COLORS.Major },
    { name: 'Minor', value: kpiMetrics.minorDefects, color: SEVERITY_COLORS.Minor },
  ].filter((d) => d.value > 0);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Inspection Summary &amp; Individual Records
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
              {filteredReports.length} Reports
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Defect category distribution with visible labels, severity ratios, and individual inspection sheets.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('upload')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          Upload PDF Report
        </button>
      </div>

      {/* When no inspection reports exist (fresh clean database) */}
      {filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-sky-200 p-10 text-center space-y-4 max-w-2xl mx-auto shadow-2xs">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center mx-auto shadow-2xs">
            <UploadCloud className="w-8 h-8 text-sky-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">Fresh Quality Database Ready</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              All demo and previous test data have been completely cleared. Upload your factory inspection PDF reports (or screenshots) to generate real-time defect rankings and charts.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => setActiveTab('upload')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <FileUp className="w-4 h-4" />
              Upload PDF Report Now
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Charts Row: Gorgeous Column Chart & Severity Pie Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column Chart (2 cols) */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    Defect Category Comparison (Descending Order)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Defect quantities &amp; percentages displayed directly on each category column
                  </p>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-3 h-3 bg-rose-600 rounded-xs" /> Critical
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-3 h-3 bg-amber-600 rounded-xs" /> Major
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-3 h-3 bg-sky-600 rounded-xs" /> Minor
                  </span>
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sortedGroupData}
                    margin={{ top: 28, right: 20, bottom: 25, left: 10 }}
                    onClick={(state) => {
                      if (state && state.activeLabel !== undefined && state.activeLabel !== null) {
                        const labelStr = String(state.activeLabel);
                        setSelectedDrilldownGroup(selectedDrilldownGroup === labelStr ? null : labelStr);
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="groupName"
                      tick={{ fontSize: 10, fill: '#334155', fontWeight: 600 }}
                      angle={-15}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} width={34} />
                    <Tooltip
                      formatter={(val: any, name: any) => [`${val} items`, name]}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, fontSize: 12, border: '1px solid #cbd5e1' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                    <Bar dataKey="critical" name="Critical" stackId="a" isAnimationActive={false} fill="#dc2626" />
                    <Bar dataKey="major" name="Major" stackId="a" isAnimationActive={false} fill="#ea580c" />
                    <Bar dataKey="minor" name="Minor" stackId="a" isAnimationActive={false} fill="#0284c7" radius={[4, 4, 0, 0]}>
                      {/* Visible quantity and percentage on top of bar */}
                      <LabelList
                        dataKey="displayLabel"
                        position="top"
                        fill="#0f172a"
                        fontSize={11}
                        fontWeight="bold"
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Drilldown Category Breakdown */}
              <div className="pt-3 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center justify-between">
                  <span>Defect Line Items (Click any card to focus):</span>
                  {selectedDrilldownGroup && (
                    <button
                      onClick={() => setSelectedDrilldownGroup(null)}
                      className="text-sky-600 hover:underline font-normal text-[10px]"
                    >
                      Show All Categories
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {sortedGroupData
                    .filter((g) => !selectedDrilldownGroup || g.groupName === selectedDrilldownGroup)
                    .map((group) => (
                      <div
                        key={group.groupName}
                        onClick={() => setSelectedDrilldownGroup(group.groupName)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                          selectedDrilldownGroup === group.groupName
                            ? 'border-sky-500 bg-sky-50/70 shadow-2xs ring-2 ring-sky-500/20'
                            : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span className="truncate">{group.groupName}</span>
                          <span className="text-sky-700 bg-sky-100 px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0">
                            {group.totalQty} ({group.percentage})
                          </span>
                        </div>
                        <div className="mt-1 space-y-0.5 text-[11px] text-slate-600">
                          {group.items.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="truncate pr-2 text-slate-500">&bull; {item.name}</span>
                              <span className="font-semibold text-slate-700 shrink-0">{item.qty}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Pie Chart (1 col) with Visible Data Labels */}
            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <PieChartIcon className="w-4 h-4 text-emerald-600" />
                  Defect Severity Distribution
                </h3>
                <p className="text-xs text-slate-500">
                  Critical, Major, and Minor proportions with direct labels
                </p>

                <div className="h-60 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={severityPieData}
                        cx="50%"
                        cy="50%"
                        isAnimationActive={false}
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent, value }: any) =>
                          `${name}: ${value} (${(((percent ?? 0) as number) * 100).toFixed(0)}%)`
                        }
                        labelLine={true}
                      >
                        {severityPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any, name: any) => [`${value} defects`, name]}
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, fontSize: 12, border: '1px solid #cbd5e1' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> Critical Defects
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{kpiMetrics.criticalDefects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600" /> Major Defects
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{kpiMetrics.majorDefects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-600" /> Minor Defects
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{kpiMetrics.minorDefects}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Individual Inspection Reports Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  Individual Inspection Reports &amp; Extracted Data
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Each inspection report retains its inspector name, PDF file, after-slash quantities, and calculated individual OQL.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('upload')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Upload New PDF
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700 select-none">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Inspector</th>
                    <th className="py-2.5 px-3">PDF File / Report</th>
                    <th className="py-2.5 px-3">Order / PO No</th>
                    <th className="py-2.5 px-3">Style No</th>
                    <th className="py-2.5 px-3 text-right">Order Qty</th>
                    <th className="py-2.5 px-3 text-right">Inspected Qty</th>
                    <th className="py-2.5 px-2 text-center text-rose-600 dark:text-rose-400">Crit</th>
                    <th className="py-2.5 px-2 text-center text-amber-600 dark:text-amber-400">Maj</th>
                    <th className="py-2.5 px-2 text-center text-sky-600 dark:text-sky-400">Min</th>
                    <th className="py-2.5 px-2 text-center font-bold">Total</th>
                    <th className="py-2.5 px-3 text-right">Individual OQL (%)</th>
                    <th className="py-2.5 px-3 text-center">Result</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredReports.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {r.inspectionDate}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {r.inspector || 'Rifat Chowdhury'}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-sky-800 dark:text-sky-400 flex items-center gap-1">
                          <span>{r.pdfFileName || r.reportNumber}</span>
                          {r.isDemo && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              DEMO
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500">{r.reportNumber}</div>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {r.poNumber || r.orderNumber}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {r.styleNumber}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-700 dark:text-slate-300">
                        {r.orderQuantity?.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-slate-200">
                        {r.inspectedQuantity?.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-rose-600 dark:text-rose-400">
                        {r.criticalDefectQuantity}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-amber-600 dark:text-amber-400">
                        {r.majorDefectQuantity}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold text-sky-600 dark:text-sky-400">
                        {r.minorDefectQuantity}
                      </td>
                      <td className="py-2.5 px-2 text-center font-extrabold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/80">
                        {r.totalDefectQuantity}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black">
                        <span className={r.oql <= settings.targetOql ? 'text-emerald-600' : 'text-rose-600'}>
                          {r.oql.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.inspectionResult === 'PASSED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : r.inspectionResult === 'FAILED'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {r.inspectionResult}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setSelectedReportModal(r)}
                          className="inline-flex items-center gap-1 p-1 rounded text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                          title="View Defect Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Details Modal */}
      {selectedReportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <span>Inspection Report: {selectedReportModal.reportNumber}</span>
                  {selectedReportModal.isDemo && (
                    <span className="text-[10px] bg-amber-500/30 text-amber-300 border border-amber-400 px-1.5 py-0.2 rounded font-bold">
                      DEMO DATA
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inspector: {selectedReportModal.inspector || 'Rifat Chowdhury'} &bull; Order / PO:{' '}
                  {selectedReportModal.poNumber || selectedReportModal.orderNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedReportModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">Date</span>
                  <span className="font-bold text-slate-800">{selectedReportModal.inspectionDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Inspected Qty</span>
                  <span className="font-bold text-slate-800">{selectedReportModal.inspectedQuantity} pcs</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Defects</span>
                  <span className="font-bold text-slate-800">{selectedReportModal.totalDefectQuantity}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Observed OQL</span>
                  <span
                    className={`font-black ${
                      selectedReportModal.oql <= settings.targetOql ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {selectedReportModal.oql.toFixed(2)}% ({selectedReportModal.inspectionResult})
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">
                  Recorded Defect Items ({selectedReportModal.defects?.length || 0})
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b">
                      <tr>
                        <th className="py-2 px-3">Description in Report</th>
                        <th className="py-2 px-3">Standard Defect</th>
                        <th className="py-2 px-3 text-center">Severity</th>
                        <th className="py-2 px-3 text-right">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedReportModal.defects || []).map((d) => (
                        <tr key={d.id}>
                          <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                            {d.originalDefectName}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800">
                            {d.standardDefectName}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                d.severity === 'Critical'
                                  ? 'bg-rose-100 text-rose-800'
                                  : d.severity === 'Major'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-sky-100 text-sky-800'
                              }`}
                            >
                              {d.severity}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            {d.defectQuantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-3 text-right">
              <button
                onClick={() => setSelectedReportModal(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
