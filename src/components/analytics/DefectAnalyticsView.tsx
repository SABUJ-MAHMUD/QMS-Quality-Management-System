import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  PieChart as PieIcon,
  BarChart3,
  Layers,
  Flame,
  TrendingUp,
  Download,
  Calendar,
  ArrowUpDown,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
} from 'recharts';
import { computeParetoAnalysis } from '../../utils/oqlCalculator';

export const DefectAnalyticsView: React.FC = () => {
  const { filteredReports, defectGroups } = useApp();

  // Month-wise Column Chart display mode
  const [columnChartMode, setColumnChartMode] = useState<'by_group' | 'two_month_compare'>('by_group');

  // Extract all individual defects from filtered reports
  const allFilteredDefects = filteredReports.flatMap((r) => r.defects || []);

  // 1. Pareto analysis
  const paretoData = computeParetoAnalysis(allFilteredDefects, defectGroups);

  // 2. Defect Group Distribution
  const groupCountMap = new Map<string, number>();
  defectGroups.forEach((g) => groupCountMap.set(g.id, 0));

  allFilteredDefects.forEach((d) => {
    const gid = d.defectGroupId || 'dg-12';
    groupCountMap.set(gid, (groupCountMap.get(gid) || 0) + (Number(d.defectQuantity) || 0));
  });

  const groupChartData = defectGroups
    .map((g) => ({
      id: g.id,
      name: g.groupName,
      value: groupCountMap.get(g.id) || 0,
      color: g.color || '#3b82f6',
    }))
    .filter((g) => g.value > 0)
    .sort((a, b) => b.value - a.value);

  // 3. Severity Distribution
  const severityMap = {
    Critical: 0,
    Major: 0,
    Minor: 0,
  };
  allFilteredDefects.forEach((d) => {
    if (d.severity === 'Critical') severityMap.Critical += Number(d.defectQuantity) || 0;
    else if (d.severity === 'Major') severityMap.Major += Number(d.defectQuantity) || 0;
    else if (d.severity === 'Minor') severityMap.Minor += Number(d.defectQuantity) || 0;
  });

  const severityPieData = [
    { name: 'Critical', value: severityMap.Critical, color: '#dc2626' },
    { name: 'Major', value: severityMap.Major, color: '#ea580c' },
    { name: 'Minor', value: severityMap.Minor, color: '#0284c7' },
  ].filter((d) => d.value > 0);

  // 4. Top 10 Recurring Defects
  const top10Defects = paretoData.slice(0, 10);

  // 5. Unique Months available in reports
  const availableMonths = Array.from(new Set(filteredReports.map((r) => r.inspectionDate.slice(0, 7)))).sort();

  const [compareMonthA, setCompareMonthA] = useState<string>(availableMonths[availableMonths.length - 2] || '2026-09');
  const [compareMonthB, setCompareMonthB] = useState<string>(availableMonths[availableMonths.length - 1] || '2026-10');

  // Multi-Month Defect Group Comparison Column Chart Data
  const monthComparisonByGroupData = defectGroups.map((g) => {
    const row: any = { groupName: g.groupName };
    availableMonths.forEach((m) => {
      const monthReps = filteredReports.filter((r) => r.inspectionDate.startsWith(m));
      const count = monthReps
        .flatMap((r) => r.defects || [])
        .filter((d) => d.defectGroupId === g.id)
        .reduce((sum, d) => sum + (Number(d.defectQuantity) || 0), 0);
      row[m] = count;
    });
    return row;
  }).filter((row) => {
    return availableMonths.some((m) => row[m] > 0);
  });

  // Direct 2-Month Comparative Column Chart Data
  const twoMonthComparisonData = defectGroups.map((g) => {
    const repsA = filteredReports.filter((r) => r.inspectionDate.startsWith(compareMonthA));
    const repsB = filteredReports.filter((r) => r.inspectionDate.startsWith(compareMonthB));

    const countA = repsA
      .flatMap((r) => r.defects || [])
      .filter((d) => d.defectGroupId === g.id)
      .reduce((s, d) => s + (Number(d.defectQuantity) || 0), 0);

    const countB = repsB
      .flatMap((r) => r.defects || [])
      .filter((d) => d.defectGroupId === g.id)
      .reduce((s, d) => s + (Number(d.defectQuantity) || 0), 0);

    const diff = countB - countA;

    return {
      name: g.groupName,
      [compareMonthA]: countA,
      [compareMonthB]: countB,
      difference: diff,
    };
  }).filter((row) => Number(row[compareMonthA]) > 0 || Number(row[compareMonthB]) > 0);

  const MONTH_COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Defect Analysis &amp; Month-wise Intelligence
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
              Column Chart &amp; Pareto
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Month-wise Defect Comparison Column Chart, quality group classification, and 80/20 Pareto distribution analysis.
          </p>
        </div>
      </div>

      {/* FEATURE: DEDICATED MONTH-WISE DEFECT COMPARISON COLUMN CHART */}
      <div className="bg-white rounded-2xl p-5 border border-sky-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600 animate-pulse" />
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-sky-600" />
                Month-wise Defect Comparison Column Chart
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Side-by-side column comparison of defects across inspection months for each defect group.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setColumnChartMode('by_group')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                columnChartMode === 'by_group'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Months Column View
            </button>
            <button
              onClick={() => setColumnChartMode('two_month_compare')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                columnChartMode === 'two_month_compare'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Direct Two-Month Comparison
            </button>
          </div>
        </div>

        {/* How-to guide in English */}
        <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-3 flex items-start gap-2 text-xs text-sky-900">
          <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <strong>How it works:</strong> Whenever you upload an inspection report under a target month (e.g. October 2026 or September 2026) in the <em>&ldquo;PDF Report Upload&rdquo;</em> tab, its defects are automatically categorized and reflected side-by-side in this Column Chart.
          </div>
        </div>

        {/* Two-Month Selector controls if in compare mode */}
        {columnChartMode === 'two_month_compare' && (
          <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
            <span className="font-bold text-slate-700">Select Months to Compare:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Base Month:</span>
              <select
                value={compareMonthA}
                onChange={(e) => setCompareMonthA(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2.5 py-1 font-bold text-slate-800"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-slate-400 font-bold">&harr;</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Comparison Month:</span>
              <select
                value={compareMonthB}
                onChange={(e) => setCompareMonthB(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2.5 py-1 font-bold text-slate-800"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* The Recharts Column Chart */}
        <div className="h-80 w-full pt-2">
          {columnChartMode === 'by_group' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthComparisonByGroupData}
                margin={{ top: 20, right: 25, bottom: 35, left: -10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="groupName"
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 11, fill: '#475569' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  label={{
                    value: 'Defect Quantity',
                    angle: -90,
                    position: 'insideLeft',
                    fontSize: 11,
                    fill: '#64748b',
                  }}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} defects`, `Month: ${name}`]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: 8,
                    fontSize: 12,
                    border: '1px solid #cbd5e1',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                {availableMonths.map((month, idx) => (
                  <Bar
                    key={month}
                    dataKey={month}
                    name={month}
                    fill={MONTH_COLORS[idx % MONTH_COLORS.length]}
                    radius={[4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={twoMonthComparisonData}
                margin={{ top: 20, right: 25, bottom: 35, left: -10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 11, fill: '#475569' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  label={{
                    value: 'Defect Quantity',
                    angle: -90,
                    position: 'insideLeft',
                    fontSize: 11,
                    fill: '#64748b',
                  }}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} defects`, `Month: ${name}`]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: 8,
                    fontSize: 12,
                    border: '1px solid #cbd5e1',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar
                  dataKey={compareMonthA}
                  name={`${compareMonthA} (Base)`}
                  fill="#0284c7"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey={compareMonthB}
                  name={`${compareMonthB} (Compare)`}
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* CHART A: Defect Pareto Chart (Dual-Axis Composed Chart) */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sky-600" />
              Chart A: Defect Pareto Chart (80/20 Rule)
            </h3>
            <p className="text-xs text-slate-500">
              Columns represent defect counts in descending order; red curve represents cumulative percentage (%).
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-600">
            Target top 80% defect categories via RCA &amp; CAPA
          </div>
        </div>

        <div className="h-80 w-full">
          {paretoData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              No defect data found for the current filters.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={paretoData} margin={{ top: 20, right: 30, bottom: 25, left: -5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                  height={50}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  label={{ value: 'Defect Qty', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#64748b' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  unit="%"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#dc2626' }}
                  label={{ value: 'Cumulative %', angle: 90, position: 'insideRight', fontSize: 11, fill: '#dc2626' }}
                />
                <Tooltip
                  formatter={(val: any, name: any) => {
                    if (name === 'Cumulative %') return [`${val}%`, name];
                    if (name === 'Defect Percentage') return [`${val}%`, name];
                    return [val, name];
                  }}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, fontSize: 12, border: '1px solid #cbd5e1' }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Bar yAxisId="left" dataKey="quantity" name="Defect Quantity" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="cumulativePercentage"
                  name="Cumulative %"
                  stroke="#dc2626"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#dc2626' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Row of Charts B, C, and E */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHART B: Defect Group Distribution Pie */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <PieIcon className="w-4 h-4 text-indigo-600" />
              Chart B: Defect Group Distribution
            </h3>
            <p className="text-xs text-slate-500">Percentage distribution across 12 QMS groups</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={groupChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {groupChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} defects`, name]}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, fontSize: 12, border: '1px solid #cbd5e1' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1.5 text-xs pr-1">
            {groupChartData.map((g) => (
              <div key={g.id} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-700 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                  {g.name}
                </span>
                <span className="font-bold text-slate-900">{g.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CHART C: Critical / Major / Minor Pie */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-rose-600" />
              Chart C: Severity Breakdown
            </h3>
            <p className="text-xs text-slate-500">AQL severity classification proportions</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {severityPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} defects`, name]}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, fontSize: 12, border: '1px solid #cbd5e1' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 text-xs pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> Critical Defects
              </span>
              <span className="font-bold text-rose-700">{severityMap.Critical}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600" /> Major Defects
              </span>
              <span className="font-bold text-amber-700">{severityMap.Major}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600" /> Minor Defects
              </span>
              <span className="font-bold text-sky-700">{severityMap.Minor}</span>
            </div>
          </div>
        </div>

        {/* CHART E: Top 10 Defects Chart */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Chart E: Top 10 Recurring Defects
            </h3>
            <p className="text-xs text-slate-500">Highest frequency quality defect items</p>
          </div>
          <div className="space-y-2 pt-1 max-h-72 overflow-y-auto">
            {top10Defects.map((def, i) => (
              <div key={def.name} className="text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-800 truncate max-w-[170px]">
                    <span className="font-bold text-slate-400 mr-1.5">#{i + 1}</span>
                    {def.name}
                  </span>
                  <span className="font-bold text-slate-900">{def.quantity} ({def.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-600 h-full rounded-full"
                    style={{
                      width: `${(def.quantity / (top10Defects[0]?.quantity || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
