import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  Calendar,
  Layers,
  Building,
  Target,
  ArrowUpRight,
  TrendingDown,
  Info,
  BarChart3,
  PieChart as PieIcon,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  Filter,
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
  PieChart,
  Pie,
  Cell,
  LabelList,
} from 'recharts';
import { getFinancialYear } from '../../utils/oqlCalculator';
import { getCanonicalDefectInfo } from '../../data/defectMasterData';
import { formatQtyAndPct } from '../../utils/dashboardAnalytics';
import { DefectAxisTick } from '../common/DefectAxisTick';

const SEVERITY_COLORS = {
  Critical: '#ef4444',
  Major: '#f59e0b',
  Minor: '#0284c7',
};

const CHART_COLORS = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#64748b'];

export const OqlAnalyticsView: React.FC = () => {
  const { filteredReports, settings, kpiMetrics, defectGroups } = useApp();

  const [activeTab, setActiveTab] = useState<'trend' | 'defect_chart' | 'style_matrix' | 'performance'>('trend');
  const [trendMode, setTrendMode] = useState<'monthly' | 'daily' | 'financial_year' | 'style'>('monthly');

  // Month data
  const monthlyChartData = useMemo(() => {
    const map = new Map<string, { inspected: number; defects: number; passed: number; failed: number }>();
    filteredReports.forEach((r) => {
      const month = r.inspectionDate.slice(0, 7);
      const cur = map.get(month) || { inspected: 0, defects: 0, passed: 0, failed: 0 };
      cur.inspected += Number(r.inspectedQuantity) || 0;
      cur.defects += Number(r.totalDefectQuantity) || 0;
      if (r.inspectionResult === 'PASSED') cur.passed++;
      else cur.failed++;
      map.set(month, cur);
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, d]) => ({
        label,
        actualOql: d.inspected > 0 ? Number(((d.defects / d.inspected) * 100).toFixed(2)) : 0,
        targetOql: settings.targetOql,
        defects: d.defects,
        inspected: d.inspected,
        passRate: d.passed + d.failed > 0 ? Number(((d.passed / (d.passed + d.failed)) * 100).toFixed(1)) : 100,
      }));
  }, [filteredReports, settings.targetOql]);

  // Defect-wise column chart data with canonical PDF Code, Name, Qty & %
  const defectWiseData = useMemo(() => {
    const map = new Map<
      string,
      {
        code: string;
        defectName: string;
        codeAndName: string;
        quantity: number;
        severity: string;
        group: string;
      }
    >();
    let totalD = 0;

    filteredReports.forEach((r) => {
      r.defects?.forEach((d) => {
        const qty = Number(d.defectQuantity) || 0;
        if (qty <= 0) return;
        const info = getCanonicalDefectInfo(d);
        const key = `${info.code}::${info.name.toLowerCase()}`;
        const cur = map.get(key) || {
          code: info.code,
          defectName: info.name,
          codeAndName: `${info.code}: ${info.name}`,
          quantity: 0,
          severity: d.severity || 'Major',
          group: info.categoryName,
        };
        cur.quantity += qty;
        totalD += qty;
        map.set(key, cur);
      });
    });

    return Array.from(map.values())
      .map((d) => {
        const percentage = totalD > 0 ? Number(((d.quantity / totalD) * 100).toFixed(1)) : 0;
        return {
          ...d,
          percentage,
          barLabel: formatQtyAndPct(d.quantity, percentage),
        };
      })
      .sort((a, b) => b.quantity - a.quantity);
  }, [filteredReports]);

  // Style-wise defect percentage data (User Requirement 4: "স্টাইল ওয়াইজ ডিফেক্ট পান্সেটিজ")
  const styleWiseData = useMemo(() => {
    const map = new Map<
      string,
      {
        styleNumber: string;
        styleName: string;
        brand: string;
        orderNumber: string;
        inspected: number;
        defects: number;
        critical: number;
        major: number;
        minor: number;
        passed: number;
        failed: number;
      }
    >();

    filteredReports.forEach((r) => {
      const s = r.styleNumber || 'Unknown';
      const cur = map.get(s) || {
        styleNumber: s,
        styleName: r.styleName || r.productDescription || s,
        brand: r.brand || r.buyer || 'ONLY&SONS',
        orderNumber: r.orderNumber,
        inspected: 0,
        defects: 0,
        critical: 0,
        major: 0,
        minor: 0,
        passed: 0,
        failed: 0,
      };
      cur.inspected += Number(r.inspectedQuantity) || 0;
      cur.defects += Number(r.totalDefectQuantity) || 0;
      cur.critical += Number(r.criticalDefectQuantity) || 0;
      cur.major += Number(r.majorDefectQuantity) || 0;
      cur.minor += Number(r.minorDefectQuantity) || 0;
      if (r.inspectionResult === 'PASSED') cur.passed++;
      else cur.failed++;
      map.set(s, cur);
    });

    const totalSystemDefects = filteredReports.reduce((s, r) => s + (Number(r.totalDefectQuantity) || 0), 0);

    return Array.from(map.values()).map((d) => {
      const oql = d.inspected > 0 ? Number(((d.defects / d.inspected) * 100).toFixed(2)) : 0;
      const defectShare = totalSystemDefects > 0 ? Number(((d.defects / totalSystemDefects) * 100).toFixed(1)) : 0;
      return {
        ...d,
        oql,
        defectShare,
        status: oql <= settings.targetOql ? 'PASSED' : 'ALERT',
      };
    }).sort((a, b) => b.defects - a.defects);
  }, [filteredReports, settings.targetOql]);

  // Severity Distribution
  const severityData = useMemo(() => {
    const crit = filteredReports.reduce((s, r) => s + (Number(r.criticalDefectQuantity) || 0), 0);
    const maj = filteredReports.reduce((s, r) => s + (Number(r.majorDefectQuantity) || 0), 0);
    const min = filteredReports.reduce((s, r) => s + (Number(r.minorDefectQuantity) || 0), 0);
    const total = crit + maj + min;

    return [
      { name: 'Critical', value: crit, color: '#ef4444', percent: total > 0 ? ((crit / total) * 100).toFixed(1) : 0 },
      { name: 'Major', value: maj, color: '#f59e0b', percent: total > 0 ? ((maj / total) * 100).toFixed(1) : 0 },
      { name: 'Minor', value: min, color: '#0284c7', percent: total > 0 ? ((min / total) * 100).toFixed(1) : 0 },
    ];
  }, [filteredReports]);

  // Inspection Performance Metrics
  const passedAudits = filteredReports.filter((r) => r.inspectionResult === 'PASSED').length;
  const failedAudits = filteredReports.filter((r) => r.inspectionResult === 'FAILED').length;
  const passRate = filteredReports.length > 0 ? Number(((passedAudits / filteredReports.length) * 100).toFixed(1)) : 100;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Observed Quality Level (OQL) Analytics &amp; Performance
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              BESTSELLER Standard 4.5%
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Defect-wise column charts, inspection performance metrics, style-wise defect percentages, and quality curves.
          </p>
        </div>

        {/* Analytics Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setActiveTab('trend')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'trend'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            OQL Trend
          </button>
          <button
            onClick={() => setActiveTab('defect_chart')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'defect_chart'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Defect-wise Column Chart
          </button>
          <button
            onClick={() => setActiveTab('style_matrix')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'style_matrix'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Style-wise Defect %
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'performance'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Inspection Performance
          </button>
        </div>
      </div>

      {/* Summary Scorecards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Aggregated OQL</span>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-0.5">
            {kpiMetrics.aggregatedOql.toFixed(2)}%
          </div>
          <span className="text-[9px] text-slate-400">Target Benchmark: {settings.targetOql}%</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Pass Rate</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            {passRate}%
          </div>
          <span className="text-[9px] text-slate-400">{passedAudits} Passed / {filteredReports.length} Audited</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Inspected</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            {kpiMetrics.totalInspectedQuantity.toLocaleString()}
          </div>
          <span className="text-[9px] text-slate-400">Total samples inspected</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Defects</span>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
            {kpiMetrics.totalDefects}
          </div>
          <span className="text-[9px] text-slate-400">Defects identified</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Audited Styles</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
            {styleWiseData.length}
          </div>
          <span className="text-[9px] text-slate-400">Active style numbers</span>
        </div>
      </div>

      {/* TAB 1: DEFECT-WISE COLUMN CHART (User Requirement 4) */}
      {(activeTab === 'defect_chart' || activeTab === 'trend') && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-600" />
                Defect-wise Column Chart &amp; Share (%)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Frequency and percentage share of individual defects across all inspected orders.
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              {defectWiseData.length} Defect Categories
            </span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={defectWiseData} margin={{ top: 28, right: 20, left: 12, bottom: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                <XAxis
                  dataKey="codeAndName"
                  tick={<DefectAxisTick maxCharsPerLine={15} maxNameLines={2} />}
                  height={58}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} width={34} />
                <Tooltip
                  formatter={(val: any, _name: any, item: any) => [
                    `${val} defects (${item.payload.percentage}%)`,
                    item.payload.codeAndName,
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="quantity" isAnimationActive={false} fill="#0284c7" radius={[6, 6, 0, 0]}>
                  {defectWiseData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                  <LabelList
                    dataKey="barLabel"
                    position="top"
                    style={{ fontSize: 10, fontWeight: 'bold', fill: '#0f172a' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {defectWiseData.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              {defectWiseData.map((d, i) => (
                <div
                  key={`${d.code}-${i}`}
                  className="flex items-center justify-between gap-2 text-[11px] bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded"
                >
                  <span className="truncate font-semibold text-slate-700 dark:text-slate-200">
                    <strong className="text-sky-700 dark:text-sky-400">[{d.code}]</strong> {d.defectName}
                  </span>
                  <span className="font-black text-slate-900 dark:text-white shrink-0">{d.barLabel}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STYLE-WISE DEFECT PERCENTAGE (User Requirement 4) */}
      {(activeTab === 'style_matrix' || activeTab === 'trend') && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                Style-wise Defect Percentage &amp; OQL Performance Matrix
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detailed audit parameters, defect counts, defect percentage of total, and compliance per style.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Brand</th>
                  <th className="py-2.5 px-3">Style Number</th>
                  <th className="py-2.5 px-3">Style Description</th>
                  <th className="py-2.5 px-3 text-right">Inspected Qty</th>
                  <th className="py-2.5 px-3 text-right">Defects</th>
                  <th className="py-2.5 px-3 text-right">Defect Share (%)</th>
                  <th className="py-2.5 px-3 text-right">Observed OQL (%)</th>
                  <th className="py-2.5 px-3 text-center">Benchmark Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {styleWiseData.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60">
                    <td className="py-2 px-3 font-bold text-sky-800 dark:text-sky-300">
                      {s.brand}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                      {s.styleNumber}
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300 truncate max-w-xs">
                      {s.styleName}
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-slate-700 dark:text-slate-300">
                      {s.inspected}
                    </td>
                    <td className="py-2 px-3 text-right font-black text-amber-600 dark:text-amber-400">
                      {s.defects}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-sky-600 dark:text-sky-400">
                      {s.defectShare}%
                    </td>
                    <td className="py-2 px-3 text-right font-black">
                      <span className={s.oql <= settings.targetOql ? 'text-emerald-600' : 'text-rose-600'}>
                        {s.oql.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.status === 'PASSED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {s.status === 'PASSED' ? 'PASSED (<= 4.5%)' : 'EXCEEDED (> 4.5%)'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: INSPECTION PERFORMANCE (Pass/Fail Rate & Severity) */}
      {(activeTab === 'performance' || activeTab === 'trend') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Inspection Performance &amp; Pass Rate
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase">Passed Audits</span>
                <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{passedAudits}</div>
                <span className="text-[10px] text-emerald-600">{passRate}% Pass Rate</span>
              </div>
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-center">
                <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase">Failed Audits</span>
                <div className="text-3xl font-black text-rose-700 dark:text-rose-400 mt-1">{failedAudits}</div>
                <span className="text-[10px] text-rose-600">{(100 - passRate).toFixed(1)}% Rejection Rate</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Total Inspected Garments:</span>
                <strong className="text-slate-900 dark:text-white">{kpiMetrics.totalInspectedQuantity} pcs</strong>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Factory Target OQL:</span>
                <strong className="text-emerald-600">{settings.targetOql}%</strong>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Observed Quality Level:</span>
                <strong className="text-sky-600">{kpiMetrics.aggregatedOql.toFixed(2)}%</strong>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Defect Severity Distribution
            </h3>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    dataKey="value"
                    nameKey="name"
                    isAnimationActive={false}
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    innerRadius={40}
                    label={(entry) => `${entry.name}: ${entry.percent}%`}
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`sev-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
