import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  ChevronDown,
  Check,
} from 'lucide-react';
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
  ReferenceLine,
} from 'recharts';
import { SpeedometerGauge } from '../common/SpeedometerGauge';
import { DefectAxisTick } from '../common/DefectAxisTick';
import { MultiSelectCheckboxFilter } from '../common/MultiSelectCheckboxFilter';
import { ExpandablePanel } from '../common/ExpandablePanel';
import { MASTER_DEFECT_23_CATEGORIES } from '../../data/defectMasterData';
import { filterReports, getReportSource, normalizeFloorName, normalizeMultiSelect } from '../../utils/oqlCalculator';
import {
  computeTopSingleDefects,
  computeMonthToMonthTopDefects,
  computeWeeklyOqlTrend,
  computeFloorStats,
  computeDynamicCapaRows,
  selectDashboardCapaRows,
  buildAvailableWeeks,
  formatMonthShort,
  formatSelectedPeriodLabel,
  weekOverlapsAnyMonth,
  formatPctText,
} from '../../utils/dashboardAnalytics';
import { ReportSource } from '../../types';

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
    kpiMetrics,
    settings,
    canManageData,
  } = useApp();

  const [showFloorMenu, setShowFloorMenu] = useState(false);
  const floorMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showFloorMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (floorMenuRef.current && !floorMenuRef.current.contains(e.target as Node)) {
        setShowFloorMenu(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowFloorMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [showFloorMenu]);

  const selectedMonths = useMemo(() => normalizeMultiSelect(filters.month), [filters.month]);
  const selectedWeeks = useMemo(() => normalizeMultiSelect(filters.week), [filters.week]);

  // Dynamic Months list from uploaded reports
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      const ym = r.targetMonth || (r.inspectionDate ? r.inspectionDate.slice(0, 7) : '');
      if (ym) set.add(ym);
    });
    selectedMonths.forEach((m) => set.add(m));
    // Add known months if empty
    ['2026-11', '2026-10', '2026-09', '2026-08'].forEach((m) => set.add(m));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [reports, selectedMonths]);

  // Reports matching all filters EXCEPT month & week (for dropdown counts & trend charts)
  const nonMonthFilteredReports = useMemo(
    () =>
      filterReports(
        reports,
        { ...filters, month: 'ALL', week: 'ALL', dateFrom: '', dateTo: '' },
        settings.financialYearStartMonth
      ),
    [reports, filters, settings.financialYearStartMonth]
  );

  const monthReportCounts = useMemo(() => {
    const map = new Map<string, number>();
    nonMonthFilteredReports.forEach((r) => {
      const ym = (r.inspectionDate || '').slice(0, 7) || r.targetMonth || '';
      if (ym) map.set(ym, (map.get(ym) || 0) + 1);
    });
    return map;
  }, [nonMonthFilteredReports]);

  // Dynamic Monday–Sunday ISO weeks derived from uploaded/previous reports (scoped by active slice)
  const fyScopedReports = useMemo(
    () =>
      filterReports(
        reports,
        { financialYear: filters.financialYear },
        settings.financialYearStartMonth
      ),
    [reports, filters.financialYear, settings.financialYearStartMonth]
  );

  const availableWeeksAll = useMemo(
    () => buildAvailableWeeks(fyScopedReports, settings.financialYearStartMonth, 'ALL'),
    [fyScopedReports, settings.financialYearStartMonth]
  );

  const availableWeeks = useMemo(() => {
    const sourceReports = nonMonthFilteredReports.length > 0 ? nonMonthFilteredReports : fyScopedReports;
    return buildAvailableWeeks(sourceReports, settings.financialYearStartMonth, selectedMonths);
  }, [nonMonthFilteredReports, fyScopedReports, settings.financialYearStartMonth, selectedMonths]);

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

  // Dynamic Floors list (always includes SEW-1, SEW-2, SEW-3)
  const availableFloors = useMemo(() => {
    const base = ['SEW-1', 'SEW-2', 'SEW-3'];
    const set = new Set<string>(base);
    reports.forEach((r) => {
      const fl = normalizeFloorName(r.floor || r.section);
      if (fl) set.add(fl);
    });
    return Array.from(set);
  }, [reports]);

  const selectedFloors = useMemo(() => {
    if (!Array.isArray(filters.floors)) return [];
    return filters.floors.filter((f) => f && f !== 'ALL').map((f) => normalizeFloorName(f));
  }, [filters.floors]);

  const toggleFloorSelection = (floorName: string) => {
    const norm = normalizeFloorName(floorName);
    const exists = selectedFloors.includes(norm);
    const next = exists ? selectedFloors.filter((f) => f !== norm) : [...selectedFloors, norm];
    setFilters((prev) => ({
      ...prev,
      floors: next,
    }));
  };

  const floorButtonLabel =
    selectedFloors.length === 0
      ? 'All Floors'
      : selectedFloors.length === 1
      ? selectedFloors[0]
      : `${selectedFloors.slice(0, 2).join(', ')}${selectedFloors.length > 2 ? ` +${selectedFloors.length - 2}` : ''}`;

  // Reports matching all filters EXCEPT floors (used to show floor report & style counts inside the dropdown)
  const nonFloorReports = useMemo(
    () =>
      filterReports(
        reports,
        { ...filters, floors: [] },
        settings.financialYearStartMonth
      ),
    [reports, filters, settings.financialYearStartMonth]
  );

  const nonFloorStats = useMemo(() => computeFloorStats(nonFloorReports), [nonFloorReports]);

  // Reports matching all filters EXCEPT reportSource (used for BSQC/AQC live toggle counts)
  const nonSourceReports = useMemo(
    () =>
      filterReports(
        reports,
        { ...filters, reportSource: 'ALL' },
        settings.financialYearStartMonth
      ),
    [reports, filters, settings.financialYearStartMonth]
  );

  const sourceCounts = useMemo(() => {
    let bsqc = 0;
    let aqc = 0;
    nonSourceReports.forEach((r) => {
      if (getReportSource(r) === 'AQC') aqc += 1;
      else bsqc += 1;
    });
    return {
      all: nonSourceReports.length,
      bsqc,
      aqc,
    };
  }, [nonSourceReports]);

  const activeReportSource: 'ALL' | ReportSource = filters.reportSource || 'ALL';

  const hasBuyerFilter = Array.isArray(filters.buyer)
    ? filters.buyer.length > 0 && !filters.buyer.includes('ALL')
    : filters.buyer !== 'ALL';

  const hasActiveFilters =
    hasBuyerFilter ||
    selectedFloors.length > 0 ||
    selectedMonths.length > 0 ||
    selectedWeeks.length > 0 ||
    filters.styleNumber !== '' ||
    filters.orderNumber !== '' ||
    filters.defectGroup !== 'ALL' ||
    filters.inspectionResult !== 'ALL';

  const toggleMonthSelection = (monthValue: string) => {
    const exists = selectedMonths.includes(monthValue);
    const nextMonths = exists
      ? selectedMonths.filter((m) => m !== monthValue)
      : [...selectedMonths, monthValue];
    setFilters((prev) => {
      const currentWeeks = normalizeMultiSelect(prev.week);
      if (nextMonths.length === 0 || currentWeeks.length === 0) {
        return { ...prev, month: nextMonths.length === 0 ? 'ALL' : nextMonths };
      }
      const keptWeeks = currentWeeks.filter((wkKey) => {
        const wk = availableWeeksAll.find((w) => w.weekKey === wkKey);
        return wk ? weekOverlapsAnyMonth(wk, nextMonths) : false;
      });
      return {
        ...prev,
        month: nextMonths,
        week: keptWeeks.length === 0 ? 'ALL' : keptWeeks,
      };
    });
  };

  const toggleWeekSelection = (weekKey: string) => {
    const exists = selectedWeeks.includes(weekKey);
    const nextWeeks = exists
      ? selectedWeeks.filter((w) => w !== weekKey)
      : [...selectedWeeks, weekKey];
    setFilters((prev) => ({
      ...prev,
      week: nextWeeks.length === 0 ? 'ALL' : nextWeeks,
    }));
  };

  // Top 9 KPI calculations
  const totalReports = filteredReports.length;
  const totalOrderQty = filteredReports.reduce((sum, r) => sum + (r.orderQuantity || 0), 0);
  const totalInspectedQty = filteredReports.reduce((sum, r) => sum + (r.inspectedQuantity || 0), 0);
  const totalCritical = filteredReports.reduce((sum, r) => sum + (r.criticalDefectQuantity || 0), 0);
  const totalMajor = filteredReports.reduce((sum, r) => sum + (r.majorDefectQuantity || 0), 0);
  const totalMinor = filteredReports.reduce((sum, r) => sum + (r.minorDefectQuantity || 0), 0);
  const totalDefects = totalCritical + totalMajor + totalMinor;

  // Defect percentages strictly against Total Inspected Qty: (Defect Qty / Inspected Qty) * 100
  const criticalPct = totalInspectedQty > 0 ? (totalCritical / totalInspectedQty) * 100 : 0;
  const majorPct = totalInspectedQty > 0 ? (totalMajor / totalInspectedQty) * 100 : 0;
  const minorPct = totalInspectedQty > 0 ? (totalMinor / totalInspectedQty) * 100 : 0;

  // Observed Quality Level (OQL) %: (Total Defects ÷ Inspected Qty) × 100
  const calculatedOql = totalInspectedQty > 0 ? (totalDefects / totalInspectedQty) * 100 : 0;

  // Active floor & distinct style breakdown for INSPECTION REPORTS card
  const floorStats = useMemo(() => computeFloorStats(filteredReports), [filteredReports]);

  // Middle Left: Highest Single Defects column chart data (max 5, single defects with official PDF code & % of Inspected Qty)
  const highestDefectsData = useMemo(
    () => computeTopSingleDefects(filteredReports, 5),
    [filteredReports]
  );

  // Middle Center: Weekly OQL Trend (BESTSELLER FY: August = W32 .. W52 -> W01 .. W31)
  const weeklyOqlTrendData = useMemo(
    () => computeWeeklyOqlTrend(nonMonthFilteredReports, settings.financialYearStartMonth),
    [nonMonthFilteredReports, settings.financialYearStartMonth]
  );

  const latestWeekPoint =
    weeklyOqlTrendData.length > 0 ? weeklyOqlTrendData[weeklyOqlTrendData.length - 1] : null;

  // Middle Right: Month wise OQL Performance (OBH Only)
  // Dynamic calculation respecting active FY, Floor, Buyer & BSQC/AQC filters
  const monthlyPerformanceData = useMemo(() => {
    const monthMap = new Map<string, { inspected: number; defects: number; name: string }>();

    nonMonthFilteredReports.forEach((r) => {
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
  }, [nonMonthFilteredReports]);

  const monthComparison = useMemo(
    () => computeMonthToMonthTopDefects(nonMonthFilteredReports, filters.month, new Date(), 5),
    [nonMonthFilteredReports, filters.month]
  );

  // Bottom Right: Root Cause Analysis & CAPA Summary Table
  // Shows defects pushed to Dashboard (+ Push to Dashboard) that occur in the active Dashboard filter slice
  // (Month, Floor, BSQC/AQC, Style, Buyer, FY), dynamically ranked Highest Defects First.
  const dynamicCapaRows = useMemo(
    () => computeDynamicCapaRows(filteredReports, capas),
    [filteredReports, capas]
  );

  const topSliceDefect = dynamicCapaRows.find(
    (r) => (Number(r.capaRecord.defectQuantity) || 0) > 0
  );

  const dashboardCapaList = useMemo(() => {
    return selectDashboardCapaRows(dynamicCapaRows).map((row, index) => ({
      id: row.capaRecord.id,
      existingCapaId: row.existingCapaId,
      isVirtual: row.isVirtual,
      rowKey: row.rowKey,
      isPinnedToDashboard: row.isPinnedToDashboard,
      serial: index + 1,
      defectName: row.capaRecord.defectName,
      defectQuantity: Number(row.capaRecord.defectQuantity) || 0,
      reportNumber: row.capaRecord.reportNumber,
      rootCause:
        row.capaRecord.rootCause || 'Root cause analyzed via 5-Why method in RCA & CAPA module.',
      correctiveAction:
        row.capaRecord.correctiveAction ||
        row.capaRecord.correction ||
        'Immediate containment & lot sorting.',
      preventiveAction:
        row.capaRecord.preventiveAction || 'Machine calibration & operator retraining.',
      responsiblePerson: row.capaRecord.responsiblePerson || 'QA Lead',
      status: row.capaRecord.capaStatus,
    }));
  }, [dynamicCapaRows]);

  return (
    <div className="p-4 space-y-4 max-w-[1700px] mx-auto text-slate-800 dark:text-slate-100">
      {/* Top Header Banner with BSQC / AQC Toggle + Integrated Filters */}
      <div className="bg-[#c6e0b4] dark:bg-emerald-950/70 border border-[#a9d08e] dark:border-emerald-800 px-3.5 py-2.5 rounded-t-md flex flex-col gap-2 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black text-[#dc2626] dark:text-red-500 tracking-wide font-sans shrink-0">
              Dashboard
            </h1>

            {/* BSQC vs AQC Report Classification Toggle */}
            <div
              role="group"
              aria-label="Report Source Toggle"
              className="inline-flex items-center bg-white/90 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-0.5 text-[11px] font-bold shadow-2xs"
            >
              {(
                [
                  { id: 'ALL', label: 'All Reports', count: sourceCounts.all },
                  { id: 'BSQC', label: 'BSQC', count: sourceCounts.bsqc },
                  { id: 'AQC', label: 'AQC', count: sourceCounts.aqc },
                ] as Array<{ id: 'ALL' | ReportSource; label: string; count: number }>
              ).map((opt) => {
                const isActive = activeReportSource === opt.id;
                const activeClass =
                  opt.id === 'AQC'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : opt.id === 'BSQC'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-sky-700 text-white shadow-xs';
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={isActive}
                    data-testid={`report-source-${opt.id.toLowerCase()}`}
                    onClick={() => setFilters((prev) => ({ ...prev, reportSource: opt.id }))}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                      isActive
                        ? activeClass
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {opt.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Integrated Filter Suite (6 Filter Controls + Export + Reset) */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-bold mr-0.5 shrink-0">
              <Filter className="w-3.5 h-3.5 text-sky-700 dark:text-sky-400" />
              <span>Filters:</span>
            </div>

            {/* 1. Multi-Select Month Checkbox Filter */}
            <MultiSelectCheckboxFilter
              testId="dashboard-month-filter"
              label="Month"
              allLabel="All Months"
              headerTitle="Select Months (Multi)"
              ariaLabel="Filter by Month"
              allCount={nonMonthFilteredReports.length}
              selectedValues={selectedMonths}
              options={availableMonths.map((m) => ({
                value: m,
                label: `${formatMonthShort(m)} (${m})`,
                count: monthReportCounts.get(m) || 0,
              }))}
              buttonSummary={
                selectedMonths.length === 0
                  ? 'All Months'
                  : selectedMonths.length === 1
                  ? selectedMonths[0]
                  : `${selectedMonths.length} Months`
              }
              maxWidthClass="max-w-[115px]"
              menuWidthClass="w-64"
              onToggle={toggleMonthSelection}
              onSelectAll={() => setFilters((prev) => ({ ...prev, month: 'ALL', week: 'ALL' }))}
            />

            {/* 2. Multi-Select Week Checkbox Filter (ISO 8601 Monday–Sunday Schedule) */}
            <MultiSelectCheckboxFilter
              testId="dashboard-week-filter"
              label="Week"
              allLabel="All Weeks"
              headerTitle="Select Weeks (Mon–Sun)"
              ariaLabel="Filter by Week"
              allCount={availableWeeks.reduce((s, w) => s + w.reportCount, 0)}
              selectedValues={selectedWeeks}
              options={[
                ...availableWeeks.map((w) => ({
                  value: w.weekKey,
                  label: w.optionLabel,
                  count: w.reportCount,
                })),
                ...selectedWeeks
                  .filter((wk) => !availableWeeks.some((w) => w.weekKey === wk))
                  .map((wk) => ({ value: wk, label: wk })),
              ]}
              buttonSummary={
                selectedWeeks.length === 0
                  ? 'All Weeks'
                  : selectedWeeks.length === 1
                  ? availableWeeksAll.find((w) => w.weekKey === selectedWeeks[0])?.optionLabel ||
                    selectedWeeks[0]
                  : `${selectedWeeks.length} Weeks`
              }
              maxWidthClass="max-w-[180px]"
              menuWidthClass="w-72"
              title="Monday to Sunday ISO Week Schedule (matching BESTSELLER Inspection Portal)"
              onToggle={toggleWeekSelection}
              onSelectAll={() => setFilters((prev) => ({ ...prev, week: 'ALL' }))}
            />

            {/* 2. Multi-Select All Floors Checkbox Filter (SEW-1, SEW-2, SEW-3) */}
            <div className="relative" ref={floorMenuRef}>
              <button
                type="button"
                onClick={() => setShowFloorMenu((prev) => !prev)}
                aria-expanded={showFloorMenu}
                aria-haspopup="listbox"
                aria-label="Filter by Floor"
                className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-sky-500 rounded px-2 py-1 shadow-2xs cursor-pointer transition-colors"
              >
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Floor:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 max-w-[100px] truncate">
                  {floorButtonLabel}
                </span>
                {selectedFloors.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-sky-600 text-white text-[10px] font-black">
                    {selectedFloors.length}
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {showFloorMenu && (
                <div
                  role="listbox"
                  aria-multiselectable="true"
                  className="absolute left-0 mt-1.5 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50 space-y-1"
                >
                  <div className="px-2 py-1 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Select Floors (Multi)
                    </span>
                    {selectedFloors.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFilters((prev) => ({ ...prev, floors: [] }))}
                        className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* All Floors checkbox */}
                  <label className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer text-xs">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedFloors.length === 0}
                        onChange={() => setFilters((prev) => ({ ...prev, floors: [] }))}
                        className="w-3.5 h-3.5 rounded accent-sky-600 cursor-pointer"
                      />
                      <span
                        className={`font-bold ${
                          selectedFloors.length === 0
                            ? 'text-sky-700 dark:text-sky-300'
                            : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        All Floors
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {nonFloorReports.length} rpts
                    </span>
                  </label>

                  <div className="border-t border-slate-100 dark:border-slate-700 pt-1 space-y-0.5 max-h-52 overflow-y-auto">
                    {availableFloors.map((fl) => {
                      const isChecked = selectedFloors.includes(fl);
                      const stat = nonFloorStats.byFloor.find((item) => item.floor === fl);
                      return (
                        <label
                          key={fl}
                          className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer text-xs transition-colors ${
                            isChecked
                              ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 font-bold'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleFloorSelection(fl)}
                              className="w-3.5 h-3.5 rounded accent-sky-600 cursor-pointer"
                            />
                            <span>{fl}</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                            <span>
                              {stat?.reportCount || 0}r &bull; {stat?.styleCount || 0}s
                            </span>
                            {isChecked && <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Style No Filter */}
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

            {/* 4. Order / PO No Filter */}
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

            {/* 5. Defect Group & Sub-Defects Filter */}
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

            {/* 6. Inspection Result Filter */}
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
                const { exportDashboardToPptx } = await import('../../utils/exportUtils');
                const periodLabel = formatSelectedPeriodLabel(
                  filters.month,
                  filters.week,
                  availableWeeksAll
                );
                await exportDashboardToPptx(filteredReports, capas, periodLabel);
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
                title="Reset all filters to defaults (FY and All/BSQC/AQC selections are preserved)"
                className="flex items-center gap-1 px-2 py-1 rounded bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-800 hover:bg-rose-200 cursor-pointer transition-colors shrink-0"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TOP ROW: 9 KPI Cards including OQL & PASS RATE Speedometer Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2.5">
        {/* 1. INSPECTION REPORTS (shows Report Count + Distinct Styles Inspected + Floor Count) */}
        <div
          data-testid="kpi-inspection-reports-card"
          className="bg-[#e2efda] dark:bg-slate-900/90 border-2 border-[#a9d08e] dark:border-emerald-800 rounded-lg p-2.5 flex flex-col justify-between items-center text-center shadow-xs"
        >
          <div className="text-[11px] font-black tracking-wider text-emerald-900 dark:text-emerald-400 uppercase">
            INSPECTION REPORTS
          </div>
          <div className="my-0.5">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
              {totalReports}
            </div>
            <div className="text-[10px] font-extrabold text-sky-800 dark:text-sky-300 mt-0.5">
              {floorStats.distinctStyleCount} Styles Inspected
            </div>
          </div>
          <div className="text-[9.5px] font-bold text-slate-600 dark:text-slate-400 leading-tight">
            {floorStats.byFloor
              .filter((fl) => selectedFloors.length === 0 || selectedFloors.includes(fl.floor))
              .slice(0, 3)
              .map((fl) => `${fl.floor}:${fl.reportCount}`)
              .join(' • ')}
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

        {/* 6. PASS RATE Speedometer Gauge Card */}
        <div
          data-testid="kpi-pass-rate-card"
          className="bg-[#e2efda] dark:bg-slate-900/90 border-2 border-[#a9d08e] dark:border-emerald-800 rounded-lg p-2 flex flex-col justify-between items-center text-center shadow-xs"
        >
          <div className="text-[11px] font-black tracking-wider text-emerald-900 dark:text-emerald-400 uppercase">
            PASS RATE
          </div>
          <div className="w-full flex items-center justify-center my-[-2px]">
            <SpeedometerGauge
              mode="passRate"
              value={kpiMetrics.passRate}
              target={95}
              max={100}
              size="sm"
              decimals={1}
              subLabel={`${kpiMetrics.passedReportsCount}/${totalReports} Passed`}
            />
          </div>
        </div>

        {/* 7. CRITICAL (Count + % of Inspected Qty) */}
        <div
          data-testid="kpi-critical-card"
          className="bg-[#e2efda] dark:bg-slate-900/90 border-2 border-[#a9d08e] dark:border-emerald-800 rounded-lg p-2.5 flex flex-col justify-between items-center text-center shadow-xs"
        >
          <div className="text-[11px] font-black tracking-wider text-emerald-900 dark:text-emerald-400 uppercase">
            CRITICAL
          </div>
          <div className="my-0.5">
            <div className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-400 leading-tight">
              {totalCritical}
            </div>
            <div className="text-[11px] font-extrabold text-red-700 dark:text-red-300">
              ({formatPctText(criticalPct)})
            </div>
          </div>
          <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
            % of Inspected
          </div>
        </div>

        {/* 8. MAJOR (Count + % of Inspected Qty) */}
        <div
          data-testid="kpi-major-card"
          className="bg-[#e2efda] dark:bg-slate-900/90 border-2 border-[#a9d08e] dark:border-emerald-800 rounded-lg p-2.5 flex flex-col justify-between items-center text-center shadow-xs"
        >
          <div className="text-[11px] font-black tracking-wider text-emerald-900 dark:text-emerald-400 uppercase">
            MAJOR
          </div>
          <div className="my-0.5">
            <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 leading-tight">
              {totalMajor}
            </div>
            <div className="text-[11px] font-extrabold text-amber-700 dark:text-amber-300">
              ({formatPctText(majorPct)})
            </div>
          </div>
          <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
            % of Inspected
          </div>
        </div>

        {/* 9. MINOR (Count + % of Inspected Qty) */}
        <div
          data-testid="kpi-minor-card"
          className="bg-[#e2efda] dark:bg-slate-900/90 border-2 border-[#a9d08e] dark:border-emerald-800 rounded-lg p-2.5 flex flex-col justify-between items-center text-center shadow-xs"
        >
          <div className="text-[11px] font-black tracking-wider text-emerald-900 dark:text-emerald-400 uppercase">
            MINOR
          </div>
          <div className="my-0.5">
            <div className="text-xl sm:text-2xl font-black text-sky-600 dark:text-sky-400 leading-tight">
              {totalMinor}
            </div>
            <div className="text-[11px] font-extrabold text-sky-700 dark:text-sky-300">
              ({formatPctText(minorPct)})
            </div>
          </div>
          <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
            % of Inspected
          </div>
        </div>
      </div>

      {/* MIDDLE ROW: Highest Defects Column Chart | Weekly OQL Trend (W32 start) | Month Wise OQL Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left (4 cols): HIGHEST DEFECTS CATEGORY (Top 5 Single Defects with Code, Name, Qty & % of Inspected) */}
        <ExpandablePanel
          title="HIGHEST DEFECTS CATEGORY"
          testId="highest-defects-card"
          className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs flex flex-col"
        >
          {({ isExpanded, expandSize, expandControls }) => (
            <>
              <div className="bg-sky-900 text-white font-black text-sm py-1.5 px-3 uppercase tracking-wider flex items-center justify-between gap-2">
                <span className="truncate">HIGHEST DEFECTS CATEGORY</span>
                {expandControls}
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mb-1 font-semibold">
                  Top 5 Single Defects &mdash; Defect Qty &amp; Rate (% of Inspected Qty)
                </p>
                <div
                  className={
                    isExpanded
                      ? expandSize === 'large'
                        ? 'h-[420px] sm:h-[52vh] w-full'
                        : 'h-[360px] w-full'
                      : 'h-64 w-full'
                  }
                >
                  {highestDefectsData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 mb-2">
                        <BarChart3 className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        No Defects Recorded in Current Slice
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                        Upload factory PDF inspection reports to automatically populate live single-defect rankings.
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={highestDefectsData} margin={{ top: 28, right: 16, left: 10, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis
                          dataKey="codeAndName"
                          interval={0}
                          tick={<DefectAxisTick maxCharsPerLine={isExpanded ? 20 : 13} maxNameLines={2} />}
                          height={58}
                        />
                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} width={32} />
                        <Tooltip
                          formatter={(val: any, _name: any, item: any) => [
                            `${val} defects (${formatPctText(item?.payload?.percentage ?? 0)} of inspected)`,
                            item?.payload?.codeAndName || 'Single Defect',
                          ]}
                        />
                        <Bar dataKey="count" isAnimationActive={false} fill="#0284c7" radius={[4, 4, 0, 0]}>
                          {highestDefectsData.map((_, index) => {
                            const barColors = ['#0284c7', '#ea580c', '#10b981', '#f59e0b', '#8b5cf6'];
                            return <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />;
                          })}
                          <LabelList
                            dataKey="barLabel"
                            position="top"
                            style={{ fontSize: isExpanded ? 11 : 9.5, fontWeight: 'bold', fill: '#0f172a' }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
                {highestDefectsData.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                    {highestDefectsData.map((item, idx) => {
                      const badgeColors = ['#0284c7', '#ea580c', '#10b981', '#f59e0b', '#8b5cf6'];
                      return (
                        <div
                          key={`${item.code}-${idx}`}
                          className="flex items-start justify-between gap-2 text-[11px] leading-snug bg-slate-50 dark:bg-slate-800/60 px-2 py-1 rounded"
                        >
                          <div className="flex items-start gap-1.5 min-w-0">
                            <span
                              className="inline-block px-1.5 py-0.2 rounded text-[10px] font-black text-white shrink-0"
                              style={{ backgroundColor: badgeColors[idx % badgeColors.length] }}
                            >
                              {item.code}
                            </span>
                            <span className="font-semibold text-slate-700 dark:text-slate-200 break-words">
                              {item.name}
                            </span>
                          </div>
                          <span className="font-black text-slate-900 dark:text-white shrink-0">
                            {item.barLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </ExpandablePanel>

        {/* Center (4 cols): WEEKLY OQL TREND (BESTSELLER International Week starting Aug = W32) */}
        <ExpandablePanel
          title="WEEKLY OQL TREND (LAST WEEK OQL)"
          testId="weekly-oql-trend-card"
          className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs flex flex-col"
        >
          {({ isExpanded, expandSize, expandControls }) => (
            <>
              <div className="bg-sky-900 text-white font-black text-sm py-1.5 px-3 uppercase tracking-wider w-full flex items-center justify-between gap-2">
                <span className="truncate">WEEKLY OQL TREND (LAST WEEK OQL)</span>
                {expandControls}
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-[11px] font-black text-slate-700 dark:text-slate-200 whitespace-nowrap">
                    ISO Mon&ndash;Sun (Aug W32 &rarr; Jul W31)
                  </h4>
                  {latestWeekPoint && (
                    <span
                      title={`Mon–Sun: ${latestWeekPoint.dateRangeLabel}`}
                      className="text-[10px] font-black px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shrink-0"
                    >
                      Latest {latestWeekPoint.weekLabel}: {latestWeekPoint.oql.toFixed(2)}%
                    </span>
                  )}
                </div>
                <div
                  className={
                    isExpanded
                      ? expandSize === 'large'
                        ? 'h-[450px] sm:h-[58vh] w-full'
                        : 'h-[380px] w-full'
                      : 'h-72 w-full'
                  }
                >
                  {weeklyOqlTrendData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 mb-2">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        No Weekly OQL Data in Current FY Slice
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                        Upload inspection reports to track Monday&ndash;Sunday weekly OQL progression starting Week 32 (August).
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyOqlTrendData} margin={{ top: 24, right: 18, left: -6, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis
                          dataKey="weekLabel"
                          interval={0}
                          padding={{ left: 16, right: 16 }}
                          angle={!isExpanded && weeklyOqlTrendData.length > 8 ? -35 : 0}
                          textAnchor={!isExpanded && weeklyOqlTrendData.length > 8 ? 'end' : 'middle'}
                          height={!isExpanded && weeklyOqlTrendData.length > 8 ? 36 : 24}
                          tick={{ fontSize: isExpanded ? 11 : 9, fontWeight: 'bold' }}
                        />
                        <YAxis
                          domain={[0, (dataMax: number) => Math.max(9, Math.ceil(((dataMax || 0) + 1) / 3) * 3)]}
                          tickCount={4}
                          tickFormatter={(v) => `${v}%`}
                          tick={{ fontSize: 10 }}
                        />
                        <ReferenceLine
                          y={settings.targetOql || 4.5}
                          stroke="#16a34a"
                          strokeDasharray="4 4"
                          label={{
                            value: `Target ${settings.targetOql || 4.5}%`,
                            position: 'insideTopRight',
                            fill: '#15803d',
                            fontSize: 10,
                            fontWeight: 'bold',
                          }}
                        />
                        <Tooltip
                          formatter={(val: any) => [`${Number(val).toFixed(2)}%`, 'Weekly OQL']}
                          labelFormatter={(label: any, payload: any) => {
                            const row = payload?.[0]?.payload;
                            if (!row) return String(label);
                            return `${label} (Mon–Sun: ${row.dateRangeLabel || `${row.weekStartDate} to ${row.weekEndDate}`}) • ${row.reportCount} rpt(s)`;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="oql"
                          isAnimationActive={false}
                          stroke="#0284c7"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: '#dc2626', stroke: '#0284c7', strokeWidth: 2 }}
                          activeDot={{ r: 6 }}
                        >
                          <LabelList
                            dataKey="oql"
                            content={(props: any) => {
                              const { x, y, value, index } = props;
                              if (x == null || y == null || value == null) return null;
                              const dense = !isExpanded && weeklyOqlTrendData.length > 7;
                              const dy = dense && index % 2 === 1 ? 15 : -9;
                              return (
                                <text
                                  x={x}
                                  y={y + dy}
                                  textAnchor="middle"
                                  fontSize={dense ? 8.5 : 10.5}
                                  fontWeight="bold"
                                  fill="#0369a1"
                                  stroke="#ffffff"
                                  strokeWidth={2.5}
                                  paintOrder="stroke"
                                >
                                  {`${Number(value).toFixed(2)}%`}
                                </text>
                              );
                            }}
                          />
                        </Line>
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </>
          )}
        </ExpandablePanel>

        {/* Right (4 cols): MONTH WISE OQL PERFORMANCE */}
        <ExpandablePanel
          title="MONTH WISE OQL PERFORMANCE"
          testId="monthly-oql-card"
          className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs flex flex-col"
        >
          {({ isExpanded, expandSize, expandControls }) => (
            <>
              <div className="bg-amber-600 dark:bg-amber-700 text-white font-black text-sm py-1.5 px-3 uppercase tracking-wider flex items-center justify-between gap-2">
                <span className="truncate">MONTH WISE OQL PERFORMANCE</span>
                {expandControls}
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 text-center mb-1">
                  Month wise OQL Performance (OBH Only)
                </h4>
                <div
                  className={
                    isExpanded
                      ? expandSize === 'large'
                        ? 'h-[450px] sm:h-[58vh] w-full'
                        : 'h-[380px] w-full'
                      : 'h-72 w-full'
                  }
                >
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
                          tick={{ fontSize: isExpanded ? 12 : 10, fontWeight: 'bold' }}
                        />
                        <YAxis
                          domain={[0, (dataMax: number) => Math.max(9, Math.ceil(((dataMax || 0) + 1) / 3) * 3)]}
                          tickCount={4}
                          tickFormatter={(v) => `${v}%`}
                          tick={{ fontSize: 10 }}
                        />
                        <ReferenceLine
                          y={settings.targetOql || 4.5}
                          stroke="#16a34a"
                          strokeDasharray="4 4"
                        />
                        <Tooltip formatter={(val: any) => [`${val}%`, 'Observed OQL']} />
                        <Line
                          type="monotone"
                          dataKey="oql"
                          isAnimationActive={false}
                          stroke="#dc2626"
                          strokeWidth={3}
                          dot={{ r: 5, fill: '#0284c7', stroke: '#dc2626', strokeWidth: 2 }}
                          activeDot={{ r: 7 }}
                        >
                          <LabelList
                            dataKey="oql"
                            position="top"
                            formatter={(val: any) => `${Number(val).toFixed(2)}%`}
                            style={{ fontSize: isExpanded ? 12 : 11, fontWeight: 'bold', fill: '#b91c1c' }}
                          />
                        </Line>
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </>
          )}
        </ExpandablePanel>
      </div>

      {/* BOTTOM ROW: Month-to-Month TOP Single Defects Comparison | Root Cause Analysis & CAPA Summary Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Left (5 cols): Month-to-Month TOP Single Defects Comparison */}
        <ExpandablePanel
          title="Month-to-Month TOP Defects Comparison"
          testId="month-comparison-card"
          className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs flex flex-col"
        >
          {({ isExpanded, expandSize, expandControls }) => (
            <>
              <div className="bg-sky-900 text-white font-black text-sm py-1.5 px-3 uppercase tracking-wider flex items-center justify-between gap-2">
                <span className="truncate">Month-to-Month TOP Defects Comparison</span>
                {expandControls}
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <p className="text-[11px] font-bold text-center text-red-600 dark:text-red-400 mb-1">
                  {monthComparison.currMonthLabel} vs {monthComparison.prevMonthLabel} &mdash; Single Defect Qty &amp; Rate (% of Inspected Qty)
                </p>
                <div
                  className={
                    isExpanded
                      ? expandSize === 'large'
                        ? 'h-[420px] sm:h-[52vh] w-full'
                        : 'h-[360px] w-full'
                      : 'h-64 w-full'
                  }
                >
                  {monthComparison.items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 mb-2">
                        <Layers className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        No Defect Comparison Available ({monthComparison.currMonthLabel} vs {monthComparison.prevMonthLabel})
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                        Upload inspection reports for consecutive months ({monthComparison.prevMonthLabel} &amp; {monthComparison.currMonthLabel}) to generate single-defect comparisons.
                      </p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthComparison.items} margin={{ top: 28, right: 16, left: 10, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis
                          dataKey="codeAndName"
                          interval={0}
                          tick={<DefectAxisTick maxCharsPerLine={isExpanded ? 20 : 14} maxNameLines={2} />}
                          height={58}
                        />
                        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} width={32} />
                        <Tooltip
                          formatter={(val: any, name: any, item: any) => {
                            const isCurr = String(name).includes(monthComparison.currMonthLabel);
                            const pct = isCurr ? item?.payload?.currentPct : item?.payload?.previousPct;
                            return [`${val} defects (${formatPctText(pct ?? 0)} of inspected)`, name];
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          iconSize={10}
                          wrapperStyle={{ fontSize: 11, fontWeight: 'bold' }}
                        />
                        {/* Current Month: Pink / Magenta */}
                        <Bar
                          dataKey="current"
                          name={`${monthComparison.currMonthLabel} (Current)`}
                          isAnimationActive={false}
                          fill="#ec4899"
                          radius={[3, 3, 0, 0]}
                        >
                          <LabelList
                            dataKey="currentLabel"
                            position="top"
                            style={{ fontSize: isExpanded ? 11 : 9.5, fontWeight: 'bold', fill: '#be185d' }}
                          />
                        </Bar>
                        {/* Previous Month: Yellow / Gold */}
                        <Bar
                          dataKey="previous"
                          name={`${monthComparison.prevMonthLabel} (Previous)`}
                          isAnimationActive={false}
                          fill="#eab308"
                          radius={[3, 3, 0, 0]}
                        >
                          <LabelList
                            dataKey="previousLabel"
                            position="top"
                            style={{ fontSize: isExpanded ? 11 : 9.5, fontWeight: 'bold', fill: '#854d0e' }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
                {monthComparison.items.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                    {monthComparison.items.map((item) => (
                      <div
                        key={item.code}
                        className="flex items-start justify-between gap-2 text-[11px] leading-snug bg-slate-50 dark:bg-slate-800/60 px-2 py-1 rounded"
                      >
                        <div className="flex items-start gap-1.5 min-w-0">
                          <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-black bg-indigo-600 text-white shrink-0">
                            {item.code}
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200 break-words">
                            {item.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 font-bold">
                          <span className="text-pink-600 dark:text-pink-400">
                            {monthComparison.currMonthLabel.split(' ')[0]}: {item.current} ({formatPctText(item.currentPct)})
                          </span>
                          <span className="text-amber-700 dark:text-amber-400">
                            {monthComparison.prevMonthLabel.split(' ')[0]}: {item.previous} ({formatPctText(item.previousPct)})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </ExpandablePanel>

        {/* Right (7 cols): Root Cause Analysis & CAPA Summary Table */}
        <ExpandablePanel
          title="Root Cause Analysis & CAPA (RCA & CAPA)"
          testId="dashboard-capa-card"
          className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs flex flex-col"
        >
          {({ expandControls }) => (
            <>
              <div className="bg-emerald-700 text-white font-black text-sm py-1.5 uppercase tracking-wider flex flex-wrap items-center justify-between gap-2 px-3">
                <div className="flex items-center gap-2">
                  <span>Root Cause Analysis &amp; CAPA (RCA &amp; CAPA)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-100 border border-emerald-500/40 normal-case">
                    On Dashboard: {dashboardCapaList.length} ({totalReports} Reports &bull; Highest First)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setActiveTab('capa')}
                    className="text-[10px] bg-white text-emerald-800 font-extrabold px-2.5 py-1 rounded shadow-xs hover:bg-emerald-50 cursor-pointer"
                  >
                    Manage in RCA &amp; CAPA Page &rarr;
                  </button>
                  {expandControls}
                </div>
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
                              {topSliceDefect
                                ? 'No Pinned CAPA Items in Current Filter Slice'
                                : 'No Defects Recorded for Current Filter Slice'}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {topSliceDefect
                                ? `Highest defect in this slice is "${topSliceDefect.capaRecord.defectName}" (Qty: ${topSliceDefect.capaRecord.defectQuantity}). Use "+ Push to Dashboard" in RCA & CAPA to pin defects here.`
                                : 'The selected Month, Floor, BSQC/AQC, or Style slice currently has 0 defects.'}
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
                          key={row.rowKey}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="p-1.5 text-center font-bold text-slate-500">
                            {row.serial}
                          </td>
                          <td className="p-1.5 font-bold text-slate-800 dark:text-slate-100">
                            <div>{row.defectName}</div>
                            <div className="text-[10px] font-black text-rose-600 dark:text-rose-400">
                              Total Qty: {row.defectQuantity}
                              {row.reportNumber ? (
                                <span className="text-slate-400 dark:text-slate-500 font-semibold ml-1">
                                  &bull; {row.reportNumber}
                                </span>
                              ) : null}
                            </div>
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
                            <div className="inline-flex items-center gap-1">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                {row.status}
                              </span>
                              {canManageData && !row.isVirtual && row.existingCapaId && (
                                <button
                                  type="button"
                                  onClick={() => updateCapa(row.existingCapaId!, { showOnDashboard: false })}
                                  title="Unpin from Dashboard"
                                  className="px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 cursor-pointer"
                                >
                                  &minus;
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </ExpandablePanel>
      </div>
    </div>
  );
};
