import React, { useState } from 'react';
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
} from 'recharts';
import { calculateAggregatedOql, getFinancialYear } from '../../utils/oqlCalculator';

type TrendViewMode = 'monthly' | 'daily' | 'financial_year' | 'buyer' | 'style';

export const OqlAnalyticsView: React.FC = () => {
  const { filteredReports, settings, kpiMetrics } = useApp();
  const [viewMode, setViewMode] = useState<TrendViewMode>('monthly');

  // Compute Daily OQL data
  const dailyMap = new Map<string, { inspected: number; defects: number }>();
  filteredReports.forEach((r) => {
    const day = r.inspectionDate;
    const cur = dailyMap.get(day) || { inspected: 0, defects: 0 };
    cur.inspected += Number(r.inspectedQuantity) || 0;
    cur.defects += Number(r.totalDefectQuantity) || 0;
    dailyMap.set(day, cur);
  });
  const dailyChartData = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({
      label: date,
      actualOql: d.inspected > 0 ? Number(((d.defects / d.inspected) * 100).toFixed(2)) : 0,
      targetOql: settings.targetOql,
      defects: d.defects,
      inspected: d.inspected,
    }));

  // Compute Monthly OQL data
  const monthlyMap = new Map<string, { inspected: number; defects: number }>();
  filteredReports.forEach((r) => {
    const month = r.inspectionDate.slice(0, 7);
    const cur = monthlyMap.get(month) || { inspected: 0, defects: 0 };
    cur.inspected += Number(r.inspectedQuantity) || 0;
    cur.defects += Number(r.totalDefectQuantity) || 0;
    monthlyMap.set(month, cur);
  });
  const monthlyChartData = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, d]) => ({
      label: month,
      actualOql: d.inspected > 0 ? Number(((d.defects / d.inspected) * 100).toFixed(2)) : 0,
      targetOql: settings.targetOql,
      defects: d.defects,
      inspected: d.inspected,
    }));

  // Compute Financial Year OQL data
  const fyMap = new Map<string, { inspected: number; defects: number }>();
  filteredReports.forEach((r) => {
    const fy = getFinancialYear(r.inspectionDate, settings.financialYearStartMonth);
    const cur = fyMap.get(fy) || { inspected: 0, defects: 0 };
    cur.inspected += Number(r.inspectedQuantity) || 0;
    cur.defects += Number(r.totalDefectQuantity) || 0;
    fyMap.set(fy, cur);
  });
  const fyChartData = Array.from(fyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fy, d]) => ({
      label: fy,
      actualOql: d.inspected > 0 ? Number(((d.defects / d.inspected) * 100).toFixed(2)) : 0,
      targetOql: settings.targetOql,
      defects: d.defects,
      inspected: d.inspected,
    }));

  // Compute Buyer-wise OQL data
  const buyerMap = new Map<string, { inspected: number; defects: number }>();
  filteredReports.forEach((r) => {
    const b = r.buyer || 'Unknown';
    const cur = buyerMap.get(b) || { inspected: 0, defects: 0 };
    cur.inspected += Number(r.inspectedQuantity) || 0;
    cur.defects += Number(r.totalDefectQuantity) || 0;
    buyerMap.set(b, cur);
  });
  const buyerChartData = Array.from(buyerMap.entries()).map(([buyer, d]) => ({
    label: buyer,
    actualOql: d.inspected > 0 ? Number(((d.defects / d.inspected) * 100).toFixed(2)) : 0,
    targetOql: settings.targetOql,
    defects: d.defects,
    inspected: d.inspected,
  }));

  // Compute Style-wise OQL data
  const styleMap = new Map<string, { inspected: number; defects: number }>();
  filteredReports.forEach((r) => {
    const s = r.styleNumber || 'Unknown';
    const cur = styleMap.get(s) || { inspected: 0, defects: 0 };
    cur.inspected += Number(r.inspectedQuantity) || 0;
    cur.defects += Number(r.totalDefectQuantity) || 0;
    styleMap.set(s, cur);
  });
  const styleChartData = Array.from(styleMap.entries()).map(([style, d]) => ({
    label: style,
    actualOql: d.inspected > 0 ? Number(((d.defects / d.inspected) * 100).toFixed(2)) : 0,
    targetOql: settings.targetOql,
    defects: d.defects,
    inspected: d.inspected,
  }));

  // Active chart dataset based on selected view mode
  const currentChartData =
    viewMode === 'monthly'
      ? monthlyChartData
      : viewMode === 'daily'
      ? dailyChartData
      : viewMode === 'financial_year'
      ? fyChartData
      : viewMode === 'buyer'
      ? buyerChartData
      : styleChartData;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Title & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Observed Quality Level (OQL) Trend Analytics
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
              Aggregated Formula
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistical tracking of factory observed quality levels across daily, monthly, financial years (Aug-Jul cycle), and styles.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              viewMode === 'monthly'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Trend
          </button>
          <button
            onClick={() => setViewMode('daily')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              viewMode === 'daily'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily Trend
          </button>
          <button
            onClick={() => setViewMode('financial_year')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              viewMode === 'financial_year'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Financial Year (FY)
          </button>
          <button
            onClick={() => setViewMode('style')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              viewMode === 'style'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Style-wise
          </button>
          <button
            onClick={() => setViewMode('buyer')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              viewMode === 'buyer'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Buyer-wise
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Overall Aggregated OQL
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {kpiMetrics.aggregatedOql.toFixed(2)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            ({kpiMetrics.totalDefects} defects &divide; {kpiMetrics.totalInspectedQuantity} inspected) &times; 100
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Target OQL
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {settings.targetOql.toFixed(2)}%
          </div>
          <div className="text-[10px] text-emerald-600 mt-1 font-medium">
            Configurable BESTSELLER threshold
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Variance from Target
          </div>
          <div
            className={`text-2xl font-black mt-1 ${
              kpiMetrics.oqlDifference <= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {kpiMetrics.oqlDifference > 0 ? `+${kpiMetrics.oqlDifference}%` : `${kpiMetrics.oqlDifference}%`}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {kpiMetrics.oqlDifference <= 0 ? 'Acceptable performance' : 'Excess defect threshold'}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Period Trend Direction
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1 flex items-center gap-1.5">
            {kpiMetrics.trendDirection === 'down' ? (
              <>
                <TrendingDown className="w-6 h-6 text-emerald-600" />
                <span className="text-emerald-600 text-lg">Improving</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-6 h-6 text-rose-600" />
                <span className="text-rose-600 text-lg">Degrading</span>
              </>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Compared to baseline (4.85%)
          </div>
        </div>
      </div>

      {/* Main Interactive Trend Chart */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 capitalize">
              {viewMode.replace('_', ' ')} OQL Performance Curve
            </h3>
            <p className="text-xs text-slate-500">
              Aggregated defect density (%) vs horizontal target line at {settings.targetOql.toFixed(2)}%
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <span className="w-3 h-0.5 bg-sky-600" /> Actual OQL
            </span>
            <span className="flex items-center gap-1.5 text-rose-600 font-medium">
              <span className="w-3 h-0.5 bg-rose-600 border-t border-dashed" /> Target ({settings.targetOql}%)
            </span>
            <span className="flex items-center gap-1.5 text-slate-400 font-medium">
              <span className="w-3 h-3 bg-sky-100 rounded" /> Defect Volume
            </span>
          </div>
        </div>

        {currentChartData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Info className="w-8 h-8 text-sky-500 mb-2" />
            <p className="text-sm font-bold text-slate-800">No inspection records match current filter criteria</p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Upload PDF inspection reports or adjust the filters (Month, Style, Order / PO No) above to view quality curves.
            </p>
          </div>
        ) : (
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={currentChartData} margin={{ top: 20, right: 25, bottom: 10, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  yAxisId="left"
                  unit="%"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  domain={[0, (dataMax: number) => Math.max(8, Math.ceil(dataMax + 1))]}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  formatter={(val: any, name: any) => {
                    if (name === 'Actual OQL') return [`${Number(val).toFixed(2)}%`, name];
                    if (name === 'Target OQL') return [`${Number(val).toFixed(2)}%`, name];
                    return [val, name];
                  }}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, fontSize: 12, border: '1px solid #cbd5e1' }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                <ReferenceLine
                  yAxisId="left"
                  y={settings.targetOql}
                  label={{ value: `Target OQL (${settings.targetOql}%)`, fill: '#dc2626', fontSize: 11, position: 'insideTopLeft' }}
                  stroke="#dc2626"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
                <Bar
                  yAxisId="right"
                  dataKey="defects"
                  name="Total Defects"
                  fill="#e0f2fe"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="actualOql"
                  name="Actual OQL"
                  stroke="#0284c7"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#0284c7' }}
                  activeDot={{ r: 7 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Tabular Aggregated Data Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Aggregated Quality Table ({currentChartData.length} Intervals)
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Period / Category</th>
                <th className="py-2.5 px-4 text-right">Sample Inspected</th>
                <th className="py-2.5 px-4 text-right">Total Defects</th>
                <th className="py-2.5 px-4 text-right">Aggregated OQL (%)</th>
                <th className="py-2.5 px-4 text-right">Target OQL (%)</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentChartData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="py-2 px-4 font-bold text-slate-800">{row.label}</td>
                  <td className="py-2 px-4 text-right font-medium text-slate-600">
                    {row.inspected.toLocaleString()}
                  </td>
                  <td className="py-2 px-4 text-right font-bold text-slate-900">{row.defects}</td>
                  <td className="py-2 px-4 text-right font-black">
                    <span
                      className={
                        row.actualOql <= settings.targetOql ? 'text-emerald-600' : 'text-rose-600'
                      }
                    >
                      {row.actualOql.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-2 px-4 text-right text-slate-500 font-medium">
                    {row.targetOql.toFixed(2)}%
                  </td>
                  <td className="py-2 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.actualOql <= settings.targetOql
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {row.actualOql <= settings.targetOql ? 'PASS (<= Target)' : 'EXCEED (> Target)'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
