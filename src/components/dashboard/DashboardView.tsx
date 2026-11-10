import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Boxes,
  PackageCheck,
  Search,
  AlertOctagon,
  AlertTriangle,
  Info,
  TrendingDown,
  TrendingUp,
  Percent,
  CheckCircle,
  XCircle,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  BarChart3,
  UserCheck,
  UploadCloud,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
  BarChart,
} from 'recharts';

export const DashboardView: React.FC = () => {
  const { kpiMetrics, settings, filteredReports, setActiveTab, capas } = useApp();

  // Monthly aggregated trend data
  const monthlyDataMap = new Map<string, { inspected: number; defects: number }>();
  filteredReports.forEach((r) => {
    const monthKey = r.inspectionDate.slice(0, 7); // YYYY-MM
    const current = monthlyDataMap.get(monthKey) || { inspected: 0, defects: 0 };
    current.inspected += Number(r.inspectedQuantity) || 0;
    current.defects += Number(r.totalDefectQuantity) || 0;
    monthlyDataMap.set(monthKey, current);
  });

  const monthlyChartData = Array.from(monthlyDataMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => {
      const oql = data.inspected > 0 ? Number(((data.defects / data.inspected) * 100).toFixed(2)) : 0;
      return {
        month,
        actualOql: oql,
        targetOql: settings.targetOql,
        defects: data.defects,
        inspected: data.inspected,
      };
    });

  // Inspector Performance Chart Data
  const inspectorMap = new Map<string, { audits: number; inspected: number; defects: number; passed: number; failed: number }>();
  filteredReports.forEach((r) => {
    const insp = r.inspector || 'Rifat Chowdhury';
    const cur = inspectorMap.get(insp) || { audits: 0, inspected: 0, defects: 0, passed: 0, failed: 0 };
    cur.audits += 1;
    cur.inspected += Number(r.inspectedQuantity) || 0;
    cur.defects += Number(r.totalDefectQuantity) || 0;
    if (r.inspectionResult === 'PASSED') cur.passed += 1;
    else cur.failed += 1;
    inspectorMap.set(insp, cur);
  });

  const inspectorChartData = Array.from(inspectorMap.entries()).map(([inspector, d]) => ({
    inspector,
    audits: d.audits,
    inspected: d.inspected,
    defects: d.defects,
    oql: d.inspected > 0 ? Number(((d.defects / d.inspected) * 100).toFixed(2)) : 0,
    passRate: d.audits > 0 ? Number(((d.passed / d.audits) * 100).toFixed(1)) : 100,
  }));

  const openCapas = capas.filter((c) => c.capaStatus === 'Open' || c.capaStatus === 'In Progress');

  return (
    <div className="p-4 sm:p-5 space-y-4 max-w-7xl mx-auto">
      {/* Page Header: Clean & Exact without extra tags */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Quality Management System Dashboard
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Real-time Observed Quality Level
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('upload')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Upload PDF Report
          </button>
          <button
            onClick={() => setActiveTab('inspection_summary')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            Summary &amp; Records
          </button>
        </div>
      </div>

      {/* 10 Required KPI Cards - Clean & Compact */}
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
        {/* 1. Reports */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Reports</span>
            <FileText className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white leading-none mt-1">
            {kpiMetrics.totalReports}
          </div>
          <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 font-medium truncate">Audited Files</div>
        </div>

        {/* 2. Orders */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Orders</span>
            <Boxes className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white leading-none mt-1">
            {kpiMetrics.totalOrders}
          </div>
          <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 font-medium truncate">Active Orders</div>
        </div>

        {/* 3. Order Qty */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Order Qty</span>
            <PackageCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white leading-none mt-1 truncate">
            {kpiMetrics.totalOrderQuantity.toLocaleString()}
          </div>
          <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 font-medium truncate">Scope Quantity</div>
        </div>

        {/* 4. Inspected Qty */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Inspected</span>
            <Search className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white leading-none mt-1 truncate">
            {kpiMetrics.totalInspectedQuantity.toLocaleString()}
          </div>
          <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 font-medium truncate">Sample Scope</div>
        </div>

        {/* 5. Total Defects */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Defects</span>
            <AlertOctagon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white leading-none mt-1">
            {kpiMetrics.totalDefects}
          </div>
          <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 font-medium truncate">Total Found</div>
        </div>

        {/* 6. Critical */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-rose-100 dark:border-rose-950/80 bg-rose-50/20 dark:bg-rose-950/20 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Critical</span>
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-xl font-black text-rose-700 dark:text-rose-400 leading-none mt-1">
            {kpiMetrics.criticalDefects}
          </div>
          <div className="text-[9px] text-rose-500 dark:text-rose-400/80 mt-1 font-medium truncate">Zero Tolerance</div>
        </div>

        {/* 7. Major */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-amber-100 dark:border-amber-950/80 bg-amber-50/20 dark:bg-amber-950/20 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Major</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-700 dark:text-amber-400 leading-none mt-1">
            {kpiMetrics.majorDefects}
          </div>
          <div className="text-[9px] text-amber-600 dark:text-amber-400/80 mt-1 font-medium truncate">AQL Functional</div>
        </div>

        {/* 8. Minor */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-sky-100 dark:border-sky-950/80 bg-sky-50/20 dark:bg-sky-950/20 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-sky-700 dark:text-sky-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Minor</span>
            <Info className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="text-xl font-black text-sky-700 dark:text-sky-400 leading-none mt-1">
            {kpiMetrics.minorDefects}
          </div>
          <div className="text-[9px] text-sky-500 dark:text-sky-400/80 mt-1 font-medium truncate">Workmanship</div>
        </div>

        {/* 9. Observed OQL */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-3 shadow-xs border border-slate-700 dark:border-slate-700">
          <div className="flex items-center justify-between text-slate-300 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">OQL (%)</span>
            <Percent className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-xl font-black text-white leading-none mt-1">
            {kpiMetrics.aggregatedOql.toFixed(2)}%
          </div>
          <div className="text-[9px] text-slate-300 mt-1 font-medium truncate">
            Target {settings.targetOql.toFixed(1)}%
          </div>
        </div>

        {/* 10. Pass Rate */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pass Rate</span>
            {kpiMetrics.passRate >= 80 ? (
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            )}
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white leading-none mt-1">
            {kpiMetrics.passRate}%
          </div>
          <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 font-medium truncate">Audits Passed</div>
        </div>
      </div>

      {/* Fresh State Guidance Card when 0 Reports */}
      {filteredReports.length === 0 && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center mx-auto">
            <UploadCloud className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Fresh System &bull; No Inspection Reports Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-0.5">
              Your database has been cleared completely. Upload your PDF report or inspection screenshots to view real-time OQL analytics and defect charts.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('upload')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Upload PDF Inspection Report
          </button>
        </div>
      )}

      {/* Executive Charts Row: Monthly OQL Trend Curve & Inspector Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly OQL Trend Curve vs Target */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Monthly Observed OQL (%) vs Target ({settings.targetOql.toFixed(2)}%)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Formula: (Sum of Defects ÷ Sum of Inspected) × 100
              </p>
            </div>
            <button
              onClick={() => setActiveTab('oql_analytics')}
              className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              Full Analytics &rarr;
            </button>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyChartData} margin={{ top: 10, right: 15, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis unit="%" tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  formatter={(value: any, name: any) => [`${Number(value).toFixed(2)}%`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: 8, fontSize: 11, border: '1px solid #334155', color: '#f8fafc' }}
                />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
                <ReferenceLine
                  y={settings.targetOql}
                  label={{ value: `Target: ${settings.targetOql}%`, fill: '#dc2626', fontSize: 10, position: 'insideTopLeft' }}
                  stroke="#dc2626"
                  strokeDasharray="4 4"
                />
                <Bar dataKey="defects" name="Total Defects" fill="#38bdf8" radius={[3, 3, 0, 0]} opacity={0.6} />
                <Line
                  type="monotone"
                  dataKey="actualOql"
                  name="Actual OQL"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0284c7' }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inspector Performance & Audits Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Inspector Audit Volume &amp; Defect Detection
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Audits, sample scope, and detected defects per inspector
              </p>
            </div>
            <button
              onClick={() => setActiveTab('inspection_summary')}
              className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              Category Analysis &rarr;
            </button>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inspectorChartData} margin={{ top: 10, right: 15, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
                <XAxis dataKey="inspector" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  formatter={(val: any, name: any) => [val, name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: 8, fontSize: 11, border: '1px solid #334155', color: '#f8fafc' }}
                />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
                <Bar dataKey="audits" name="Audits" fill="#6366f1" radius={[3, 3, 0, 0]} />
                <Bar dataKey="defects" name="Defects" fill="#f43f5e" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards & Active CAPA Alerts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Card 1: Go to Inspection Summary & Records */}
        <div
          onClick={() => setActiveTab('inspection_summary')}
          className="bg-white dark:bg-slate-900 hover:bg-sky-50/50 dark:hover:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-600 transition-all cursor-pointer shadow-2xs flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-sky-700 dark:group-hover:text-sky-300">
                Inspection Summary &amp; Records
              </h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Defect ranking column chart &amp; individual inspection sheets
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 transition-transform group-hover:translate-x-0.5" />
        </div>

        {/* Card 2: Upload PDF */}
        <div
          onClick={() => setActiveTab('upload')}
          className="bg-white dark:bg-slate-900 hover:bg-sky-50/50 dark:hover:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-emerald-600 transition-all cursor-pointer shadow-2xs flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                PDF Report Upload
              </h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Upload factory PDF or screenshots with auto NOF extraction
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5" />
        </div>

        {/* Card 3: CAPA & Root Cause */}
        <div
          onClick={() => setActiveTab('capa')}
          className="bg-white dark:bg-slate-900 hover:bg-amber-50/50 dark:hover:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-600 transition-all cursor-pointer shadow-2xs flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300">
                RCA &amp; CAPA Management
              </h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                {openCapas.length} active corrective actions pending
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </div>
  );
};
