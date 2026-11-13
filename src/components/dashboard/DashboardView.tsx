import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  TrendingUp,
  Filter,
  RotateCcw,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  BarChart3,
  Edit2,
  Save,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { exportDashboardToPptx } from '../../utils/exportUtils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
  LabelList,
} from 'recharts';
import { SpeedometerGauge } from '../common/SpeedometerGauge';
import { MASTER_DEFECT_23_CATEGORIES } from '../../data/defectMasterData';

interface InlineCapaRow {
  serial: number;
  defectName: string;
  count: number;
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  responsiblePerson: string;
}

export const DashboardView: React.FC = () => {
  const {
    reports,
    capas,
    addCapa,
    updateCapa,
    setActiveTab,
    filters,
    setFilters,
    resetFilters,
    defectGroups,
    filteredReports,
  } = useApp();

  // Dynamic Months list from uploaded reports
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      const ym = r.targetMonth || (r.inspectionDate ? r.inspectionDate.slice(0, 7) : '');
      if (ym) set.add(ym);
    });
    // Add known months if empty
    ['2026-11', '2026-10', '2026-09', '2026-08'].forEach((m) => set.add(m));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [reports]);

  // Dynamic Styles list from uploaded reports
  const availableStyles = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      if (r.styleNumber) set.add(r.styleNumber);
    });
    return Array.from(set).sort();
  }, [reports]);

  // Dynamic Orders / NOF Serials from uploaded reports
  const availableOrders = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      if (r.orderNumber) {
        r.orderNumber.split(/\s*[\+,]\s*/).forEach((tok) => {
          if (tok.trim()) set.add(tok.trim());
        });
        set.add(r.orderNumber.trim());
      }
    });
    return Array.from(set).sort();
  }, [reports]);

  const hasActiveFilters =
    filters.month !== 'ALL' ||
    filters.styleNumber !== '' ||
    filters.orderNumber !== '' ||
    filters.defectGroup !== 'ALL' ||
    filters.inspectionResult !== 'ALL';

  // Top 8 KPI calculations
  const totalReports = filteredReports.length;
  const totalOrderQty = filteredReports.reduce((sum, r) => sum + (r.orderQuantity || 0), 0);
  const totalInspectedQty = filteredReports.reduce((sum, r) => sum + (r.inspectedQuantity || 0), 0);
  const totalCritical = filteredReports.reduce((sum, r) => sum + (r.criticalDefectQuantity || 0), 0);
  const totalMajor = filteredReports.reduce((sum, r) => sum + (r.majorDefectQuantity || 0), 0);
  const totalMinor = filteredReports.reduce((sum, r) => sum + (r.minorDefectQuantity || 0), 0);
  const totalDefects = totalCritical + totalMajor + totalMinor;

  // Observed Quality Level (OQL) %: (Total Defects ÷ Inspected Qty) × 100
  const calculatedOql = totalInspectedQty > 0 ? (totalDefects / totalInspectedQty) * 100 : 0;

  // Last Week OQL Calculation (Sun to Sat cycle)
  const lastWeekOql = useMemo(() => {
    if (reports.length === 0) return 0;
    // Calculate week range for last completed week or latest week in records
    // Baseline sample is 8.5% if in sample preview, or dynamic calculation
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday
    // Previous Sunday
    const prevSunday = new Date(now);
    prevSunday.setDate(now.getDate() - dayOfWeek - 7);
    prevSunday.setHours(0, 0, 0, 0);

    const prevSaturday = new Date(prevSunday);
    prevSaturday.setDate(prevSunday.getDate() + 6);
    prevSaturday.setHours(23, 59, 59, 999);

    const prevSundayStr = prevSunday.toISOString().slice(0, 10);
    const prevSaturdayStr = prevSaturday.toISOString().slice(0, 10);

    const lastWeekReports = reports.filter((r) => {
      const d = r.inspectionDate || '';
      return d >= prevSundayStr && d <= prevSaturdayStr;
    });

    if (lastWeekReports.length > 0) {
      const ins = lastWeekReports.reduce((s, r) => s + (r.inspectedQuantity || 0), 0);
      const def = lastWeekReports.reduce((s, r) => s + (r.totalDefectQuantity || 0), 0);
      return ins > 0 ? (def / ins) * 100 : 0;
    }

    // If active month is filtered and has OQL, return calculated or 0
    return calculatedOql > 0 ? calculatedOql : 0;
  }, [reports, calculatedOql]);

  // Middle Left: Highest Defects Category column chart data
  const highestDefectsData = useMemo(() => {
    const map = new Map<string, number>();

    filteredReports.forEach((r) => {
      if (r.defects && r.defects.length > 0) {
        r.defects.forEach((d) => {
          const name = d.standardDefectName || d.originalDefectName;
          map.set(name, (map.get(name) || 0) + (d.defectQuantity || 1));
        });
      }
    });

    // If zero reports uploaded, return empty array
    if (map.size === 0) {
      return [];
    }

    const totalDefectSum = Array.from(map.values()).reduce((a, b) => a + b, 0);
    const sorted = Array.from(map.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalDefectSum > 0 ? Math.round((count / totalDefectSum) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return sorted;
  }, [filteredReports]);

  // Middle Right: Month wise OQL Performance (OBH Only)
  // 100% Dynamic calculation from actual uploaded monthly reports!
  const monthlyPerformanceData = useMemo(() => {
    const monthMap = new Map<string, { inspected: number; defects: number; name: string }>();

    // Group actual reports by month from database
    reports.forEach((r) => {
      const ym = r.targetMonth || (r.inspectionDate ? r.inspectionDate.slice(0, 7) : '');
      if (ym && ym.length === 7) {
        const curr = monthMap.get(ym) || { inspected: 0, defects: 0, name: '' };
        curr.inspected += Number(r.inspectedQuantity) || 0;
        curr.defects += Number(r.totalDefectQuantity) || 0;
        if (!curr.name) {
          const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December',
          ];
          const mIdx = parseInt(ym.slice(5, 7), 10) - 1;
          curr.name = monthNames[mIdx] || ym;
        }
        monthMap.set(ym, curr);
      }
    });

    return Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([ym, data]) => ({
        monthKey: ym,
        month: data.name,
        oql: data.inspected > 0 ? Number(((data.defects / data.inspected) * 100).toFixed(2)) : 0,
      }));
  }, [reports]);

  // Bottom Left: Month-to-Month TOP Single Defects Comparison
  // 100% Dynamic comparison based on uploaded reports for consecutive months
  const monthComparisonData = useMemo(() => {
    const sortedMonths = [...availableMonths];
    if (sortedMonths.length === 0) return [];

    const currMonthKey = filters.month !== 'ALL' ? filters.month : sortedMonths[0];
    const currIdx = sortedMonths.indexOf(currMonthKey);
    const prevMonthKey = sortedMonths[currIdx + 1] || sortedMonths[1] || '';

    const getMonthSingleDefects = (monthKey: string) => {
      const map = new Map<string, number>();
      if (!monthKey) return map;
      reports
        .filter((r) => (r.targetMonth === monthKey) || (r.inspectionDate && r.inspectionDate.startsWith(monthKey)))
        .forEach((r) => {
          r.defects?.forEach((d) => {
            const name = d.standardDefectName || d.originalDefectName;
            map.set(name, (map.get(name) || 0) + (Number(d.defectQuantity) || 1));
          });
        });
      return map;
    };

    const currMap = getMonthSingleDefects(currMonthKey);
    const prevMap = getMonthSingleDefects(prevMonthKey);

    const allDefectKeys = Array.from(new Set([...Array.from(currMap.keys()), ...Array.from(prevMap.keys())]));
    if (allDefectKeys.length === 0) {
      return [];
    }

    return allDefectKeys
      .map((defect) => ({
        defect,
        current: currMap.get(defect) || 0,
        previous: prevMap.get(defect) || 0,
        total: (currMap.get(defect) || 0) + (prevMap.get(defect) || 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(({ defect, current, previous }) => ({ defect, current, previous }));
  }, [reports, availableMonths, filters.month]);

  // Bottom Right: Root Cause Analysis & CAPA Summary Table
  // User Requirement: Automatically reflects records saved in RCA & CAPA module with "Push to Dashboard" switch
  const dashboardCapaList = useMemo(() => {
    // Check if user specifically toggled CAPAs to show on dashboard
    const toggled = capas.filter((c) => c.showOnDashboard === true);
    const sourceList = toggled.length > 0 ? toggled : capas.slice(0, 5);

    return sourceList.map((c, index) => ({
      serial: index + 1,
      defectName: c.defectName,
      rootCause: c.rootCause || 'Root cause analyzed via 5-Why method in RCA & CAPA module.',
      correctiveAction: c.correctiveAction || c.correction || 'Immediate containment & lot sorting.',
      preventiveAction: c.preventiveAction || 'Machine calibration & operator retraining.',
      responsiblePerson: c.responsiblePerson || 'QA Lead',
      status: c.capaStatus,
    }));
  }, [capas]);

  return (
    <div className="p-4 space-y-4 max-w-[1700px] mx-auto text-slate-800 dark:text-slate-100">
      {/* Top Header Banner matching Excel Mockup with Integrated Filters */}
      <div className="bg-[#c6e0b4] dark:bg-emerald-950/70 border border-[#a9d08e] dark:border-emerald-800 px-3.5 py-2 rounded-t-md flex flex-wrap items-center justify-between gap-2.5 shadow-xs">
        <h1 className="text-3xl font-black text-[#dc2626] dark:text-red-500 tracking-wide font-sans shrink-0">
          Dashbord
        </h1>

        {/* Integrated Filter Suite matching user request */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold mr-0.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
            <span>Filters:</span>
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 shadow-2xs">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Month:</span>
            <select
              value={filters.month}
              onChange={(e) => setFilters((prev) => ({ ...prev, month: e.target.value }))}
              className="bg-transparent font-bold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Style No Filter */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 shadow-2xs">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Style No:</span>
            <select
              value={filters.styleNumber}
              onChange={(e) => setFilters((prev) => ({ ...prev, styleNumber: e.target.value }))}
              className="bg-transparent font-bold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer max-w-[130px] truncate"
            >
              <option value="">All Styles</option>
              {availableStyles.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Order / PO No Filter */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 shadow-2xs">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Order / PO No:</span>
            <select
              value={filters.orderNumber}
              onChange={(e) => setFilters((prev) => ({ ...prev, orderNumber: e.target.value }))}
              className="bg-transparent font-bold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer max-w-[150px] truncate"
            >
              <option value="">All Orders / POs</option>
              {availableOrders.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          {/* Defect Group & Sub-Defects Filter */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 shadow-2xs">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Group / Defect:</span>
            <select
              value={filters.defectGroup}
              onChange={(e) => setFilters((prev) => ({ ...prev, defectGroup: e.target.value }))}
              className="bg-transparent font-bold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer max-w-[170px] truncate"
              title="Filter dashboard metrics and charts by Master Defect Category or Individual Defect"
            >
              <option value="ALL">All Defect Groups</option>

              {/* 23 Master Defect Categories */}
              <optgroup label="── 23 Master Defect Groups ──">
                {MASTER_DEFECT_23_CATEGORIES.map((cat) => (
                  <option key={cat.code} value={cat.name}>
                    [{cat.code}] {cat.name}
                  </option>
                ))}
              </optgroup>

              {/* Sub-defects for top categories */}
              {MASTER_DEFECT_23_CATEGORIES.map((cat) => (
                <optgroup key={`opt-${cat.code}`} label={`── ${cat.name} Defects ──`}>
                  {cat.subDefects.map((sub) => (
                    <option key={sub.code} value={sub.name}>
                      {sub.code}: {sub.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Inspection Result Filter */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 shadow-2xs">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Result:</span>
            <select
              value={filters.inspectionResult}
              onChange={(e) => setFilters((prev) => ({ ...prev, inspectionResult: e.target.value }))}
              className="bg-transparent font-bold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Results</option>
              <option value="PASSED">Passed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {/* Export PPT Presentation Button */}
          <button
            onClick={async () => {
              await exportDashboardToPptx(
                filteredReports,
                capas,
                filters.month !== 'ALL' ? filters.month : undefined
              );
            }}
            title="Download full quality audit PowerPoint (.pptx) presentation"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-orange-600 hover:bg-orange-700 text-white font-bold border border-orange-700 shadow-xs cursor-pointer transition-colors shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export PPT</span>
          </button>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              title="Reset all filters to defaults"
              className="flex items-center gap-1 px-2 py-1 rounded bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-800 hover:bg-rose-200 cursor-pointer transition-colors shrink-0"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* TOP ROW: 8 KPI Cards matching Excel Mockup */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {/* 1. INSPECTION REPORTS */}
        <div className="bg-[#e2efda] dark:bg-slate-900/90 border-2 border-[#a9d08e] dark:border-emerald-800 rounded-lg p-2.5 flex flex-col justify-between items-center text-center shadow-xs">
          <div className="text-[11px] font-black tracking-wider text-emerald-900 dark:text-emerald-400 uppercase">
            INSPECTION REPORTS
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white my-1">
            {totalReports}
          </div>
          <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
            Reports in slice
          </div>
        </div>

        {/* 2. ORDER Qty */}
        <div className="bg-[#e2efda] dark:bg-slate-900/90 border-2 border-[#a9d08e] dark:border-emerald-800 rounded-lg p-2.5 flex flex-col justify-between items-center text-center shadow-xs">
          <div className="text-[11px] font-black tracking-wider text-emerald-900 dark:text-emerald-400 uppercase">
            ORDER Qty
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white my-1">
            {totalOrderQty.toLocaleString()}
          </div>
          <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
            Total units
          </div>
        </div>

        {/* 3. INSPECTED Qty */}
        <div className="bg-[#e2efda] dark:bg-slate-900/90 border-2 border-[#a9d08e] dark:border-emerald-800 rounded-lg p-2.5 flex flex-col justify-between items-center text-center shadow-xs">
          <div className="text-[11px] font-black tracking-wider text-emerald-900 dark:text-emerald-400 uppercase">
            INSPECTED Qty
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white my-1">
            {totalInspectedQty.toLocaleString()}
          </div>
          <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
            Sample scope
          </div>
        </div>

        {/* 4. TOTAL DEFECTS */}
        <div className="bg-[#e2efda] dark:bg-slate-900/90 border-2 border-[#a9d08e] dark:border-emerald-800 rounded-lg p-2.5 flex flex-col justify-between items-center text-center shadow-xs">
          <div className="text-[11px] font-black tracking-wider text-emerald-900 dark:text-emerald-400 uppercase">
            TOTAL DEFECTS
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white my-1">
            {totalDefects}
          </div>
          <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
            Defect items
          </div>
        </div>

        {/* 5. OQL Speedometer Gauge Card */}
        <div className="bg-[#e2efda] dark:bg-slate-900/90 border-2 border-[#a9d08e] dark:border-emerald-800 rounded-lg p-2 flex flex-col justify-between items-center text-center shadow-xs">
          <div className="text-[11px] font-black tracking-wider text-emerald-900 dark:text-emerald-400 uppercase">
            OQL
          </div>
          <div className="w-full flex items-center justify-center my-[-2px]">
            <SpeedometerGauge
              value={calculatedOql}
              target={4.5}
              max={12.0}
              size="sm"
              subLabel="Target: 4.50%"
            />
          </div>
        </div>

        {/* 6. CRITICAL */}
        <div className="bg-[#e2efda] dark:bg-slate-900/90 border-2 border-[#a9d08e] dark:border-emerald-800 rounded-lg p-2.5 flex flex-col justify-between items-center text-center shadow-xs">
          <div className="text-[11px] font-black tracking-wider text-emerald-900 dark:text-emerald-400 uppercase">
            CRITICAL
          </div>
          <div className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-400 my-1">
            {totalCritical}
          </div>
          <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
            Defects
          </div>
        </div>

        {/* 7. MAJOR */}
        <div className="bg-[#e2efda] dark:bg-slate-900/90 border-2 border-[#a9d08e] dark:border-emerald-800 rounded-lg p-2.5 flex flex-col justify-between items-center text-center shadow-xs">
          <div className="text-[11px] font-black tracking-wider text-emerald-900 dark:text-emerald-400 uppercase">
            MAJOR
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 my-1">
            {totalMajor}
          </div>
          <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
            Defects
          </div>
        </div>

        {/* 8. MINOR */}
        <div className="bg-[#e2efda] dark:bg-slate-900/90 border-2 border-[#a9d08e] dark:border-emerald-800 rounded-lg p-2.5 flex flex-col justify-between items-center text-center shadow-xs">
          <div className="text-[11px] font-black tracking-wider text-emerald-900 dark:text-emerald-400 uppercase">
            MINOR
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400 my-1">
            {totalMinor}
          </div>
          <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
            Defects
          </div>
        </div>
      </div>

      {/* MIDDLE ROW: Highest Defects Column Chart | Last Week OQL Gauge | Month Wise OQL Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left (5 cols): HIGHEST DEFECTS CATEGORY */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs flex flex-col">
          <div className="bg-sky-900 text-white font-black text-center text-sm py-1.5 uppercase tracking-wider">
            HIGHEST DEFECTS CATEGORY
          </div>
          <div className="p-3 flex-1 flex flex-col">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mb-1 font-semibold">
              Defect breakdown with item quantity &amp; percentage contribution
            </p>
            <div className="h-72 w-full">
              {highestDefectsData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 mb-2">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No Defects Recorded in Current Slice
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                    Upload factory PDF inspection reports to automatically populate live defect rankings.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={highestDefectsData} margin={{ top: 25, right: 10, left: -10, bottom: 45 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis
                      dataKey="name"
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      tick={{ fontSize: 9.5, fontWeight: 'bold', fill: '#334155' }}
                      height={70}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        name === 'count' ? `${val} defects` : `${val}%`,
                        name === 'count' ? 'Quantity' : 'Share',
                      ]}
                    />
                    <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]}>
                      {highestDefectsData.map((entry, index) => {
                        const barColors = ['#0284c7', '#ea580c', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
                        return <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />;
                      })}
                      <LabelList
                        dataKey="percentage"
                        position="top"
                        formatter={(val: any) => (Number(val) > 0 ? `${val}%` : '')}
                        style={{ fontSize: 11, fontWeight: 'bold', fill: '#0f172a' }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Center (3 cols): LAST WEEK OQL (Speedometer Gauge) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs flex flex-col items-center">
          <div className="bg-sky-900 text-white font-black text-center text-sm py-1.5 uppercase tracking-wider w-full">
            LAST WEEK OQL
          </div>
          <div className="p-4 flex-1 flex flex-col items-center justify-center">
            <SpeedometerGauge
              value={lastWeekOql}
              target={4.5}
              max={12.0}
              size="lg"
              subLabel="Week Cycle: Sun - Sat"
            />
            <div className="mt-2 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
              International ISO Apparel Standard (OBH)
            </div>
          </div>
        </div>

        {/* Right (4 cols): MONTH WISE OQL PERFORMANCE */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs flex flex-col">
          <div className="bg-amber-600 dark:bg-amber-700 text-white font-black text-center text-sm py-1.5 uppercase tracking-wider">
            MONTH WISE OQL PERFORMANCE
          </div>
          <div className="p-3 flex-1 flex flex-col">
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 text-center mb-1">
              Month wise OQL Performance (OBH Only)
            </h4>
            <div className="h-72 w-full">
              {monthlyPerformanceData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 mb-2">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No Monthly Inspection Data Uploaded
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                    Upload monthly PDF reports (e.g. October, November) to generate live OQL performance trend.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyPerformanceData} margin={{ top: 25, right: 25, left: -5, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="month"
                      padding={{ left: 35, right: 25 }}
                      tick={{ fontSize: 10, fontWeight: 'bold' }}
                    />
                    <YAxis
                      domain={[3.5, 9.0]}
                      ticks={[3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.0]}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip formatter={(val: any) => [`${val}%`, 'Observed OQL']} />
                    <Line
                      type="monotone"
                      dataKey="oql"
                      stroke="#dc2626"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#0284c7', stroke: '#dc2626', strokeWidth: 2 }}
                      activeDot={{ r: 7 }}
                    >
                      <LabelList
                        dataKey="oql"
                        position="top"
                        formatter={(val: any) => `${Number(val).toFixed(2)}%`}
                        style={{ fontSize: 11, fontWeight: 'bold', fill: '#b91c1c' }}
                      />
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: Month-to-Month TOP Single Defects Comparison | Root Cause Analysis & CAPA Summary Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left (5 cols): Month-to-Month TOP Single Defects Comparison */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs flex flex-col">
          <div className="bg-sky-900 text-white font-black text-center text-sm py-1.5 uppercase tracking-wider">
            Month-to-Month TOP Defects Comparison
          </div>
          <div className="p-3 flex-1 flex flex-col">
            <p className="text-[11px] font-bold text-center text-red-600 dark:text-red-400 mb-1">
              Comparison of Highest Single Defects (Quantity Affected)
            </p>
            <div className="h-72 w-full">
              {monthComparisonData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 mb-2">
                    <Layers className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No Defect Comparison Available
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                    Upload inspection reports for consecutive months (e.g. October &amp; November) to generate dynamic defect comparisons.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthComparisonData} margin={{ top: 20, right: 10, left: -10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="defect"
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      tick={{ fontSize: 9.5, fontWeight: 'bold' }}
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend
                      verticalAlign="bottom"
                      iconSize={10}
                      wrapperStyle={{ fontSize: 11, fontWeight: 'bold' }}
                    />
                    {/* Current Month: Pink / Magenta */}
                    <Bar dataKey="current" name="Current Month" fill="#ec4899" radius={[3, 3, 0, 0]}>
                      <LabelList
                        dataKey="current"
                        position="top"
                        style={{ fontSize: 10, fontWeight: 'bold', fill: '#be185d' }}
                      />
                    </Bar>
                    {/* Previous Month: Yellow / Gold */}
                    <Bar dataKey="previous" name="Previous Month" fill="#eab308" radius={[3, 3, 0, 0]}>
                      <LabelList
                        dataKey="previous"
                        position="top"
                        style={{ fontSize: 10, fontWeight: 'bold', fill: '#854d0e' }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Right (7 cols): Root Cause Analysis & CAPA Summary Table */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs flex flex-col">
          <div className="bg-emerald-700 text-white font-black text-center text-sm py-1.5 uppercase tracking-wider flex items-center justify-between px-3">
            <span>Root Cause Analysis &amp; CAPA (RCA &amp; CAPA)</span>
            <button
              onClick={() => setActiveTab('capa')}
              className="text-[10px] bg-white text-emerald-800 font-extrabold px-2.5 py-1 rounded shadow-xs hover:bg-emerald-50 cursor-pointer"
            >
              Manage in RCA &amp; CAPA Page &rarr;
            </button>
          </div>
          <div className="p-2 flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-slate-700 text-[10px] font-black uppercase">
                  <th className="p-1.5 w-8 text-center">SL</th>
                  <th className="p-1.5 min-w-[120px]">Defect Name</th>
                  <th className="p-1.5 min-w-[140px]">Root Cause</th>
                  <th className="p-1.5 min-w-[140px]">Corrective Action</th>
                  <th className="p-1.5 min-w-[140px]">Preventive Action</th>
                  <th className="p-1.5 min-w-[100px]">Responsible Person</th>
                  <th className="p-1.5 w-16 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {dashboardCapaList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center">
                      <div className="max-w-md mx-auto space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 mx-auto">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          No CAPA Plans Toggled for Dashboard
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Go to the RCA &amp; CAPA page, review highest defects, and switch "Push to Dashboard" on any plan to display it here.
                        </p>
                        <button
                          onClick={() => setActiveTab('capa')}
                          className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                        >
                          Open RCA &amp; CAPA Page &rarr;
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  dashboardCapaList.map((row) => (
                    <tr
                      key={row.serial}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-1.5 text-center font-bold text-slate-500">
                        {row.serial}
                      </td>
                      <td className="p-1.5 font-bold text-slate-800 dark:text-slate-100">
                        {row.defectName}
                      </td>
                      <td className="p-1.5 text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                        {row.rootCause}
                      </td>
                      <td className="p-1.5 text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                        {row.correctiveAction}
                      </td>
                      <td className="p-1.5 text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                        {row.preventiveAction}
                      </td>
                      <td className="p-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                        {row.responsiblePerson}
                      </td>
                      <td className="p-1.5 text-center whitespace-nowrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
