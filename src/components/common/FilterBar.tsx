import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Filter, RotateCcw } from 'lucide-react';
import {
  buildAvailableWeeks,
  formatMonthShort,
  weekOverlapsAnyMonth,
} from '../../utils/dashboardAnalytics';
import { filterReports, normalizeMultiSelect } from '../../utils/oqlCalculator';
import { MultiSelectCheckboxFilter } from './MultiSelectCheckboxFilter';

export const FilterBar: React.FC = () => {
  const { filters, setFilters, resetFilters, defectGroups, reports, settings } = useApp();

  const selectedMonths = useMemo(() => normalizeMultiSelect(filters.month), [filters.month]);
  const selectedWeeks = useMemo(() => normalizeMultiSelect(filters.week), [filters.week]);

  const nonMonthReports = useMemo(
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
    nonMonthReports.forEach((r) => {
      const ym = (r.inspectionDate || '').slice(0, 7) || r.targetMonth || '';
      if (ym) map.set(ym, (map.get(ym) || 0) + 1);
    });
    return map;
  }, [nonMonthReports]);

  const availableMonths = useMemo(() => {
    const set = new Set<string>(['2026-11', '2026-10', '2026-09', '2026-08', '2026-07']);
    reports.forEach((r) => {
      const ym = r.targetMonth || (r.inspectionDate ? r.inspectionDate.slice(0, 7) : '');
      if (ym) set.add(ym);
    });
    selectedMonths.forEach((m) => set.add(m));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [reports, selectedMonths]);

  const availableWeeksAll = useMemo(
    () => buildAvailableWeeks(reports, settings.financialYearStartMonth, 'ALL'),
    [reports, settings.financialYearStartMonth]
  );

  const availableWeeks = useMemo(() => {
    const sourceReports = nonMonthReports.length > 0 ? nonMonthReports : reports;
    return buildAvailableWeeks(sourceReports, settings.financialYearStartMonth, selectedMonths);
  }, [nonMonthReports, reports, settings.financialYearStartMonth, selectedMonths]);

  const toggleMonthSelection = (ym: string) => {
    const exists = selectedMonths.includes(ym);
    const nextMonths = exists ? selectedMonths.filter((m) => m !== ym) : [...selectedMonths, ym];
    setFilters((prev) => {
      const curWeeks = normalizeMultiSelect(prev.week);
      if (nextMonths.length === 0 || curWeeks.length === 0) {
        return { ...prev, month: nextMonths.length > 0 ? nextMonths : 'ALL' };
      }
      const keptWeeks = curWeeks.filter((wkKey) => {
        const wk = availableWeeksAll.find((w) => w.weekKey === wkKey);
        return wk ? weekOverlapsAnyMonth(wk, nextMonths) : false;
      });
      return {
        ...prev,
        month: nextMonths,
        week: keptWeeks.length > 0 ? keptWeeks : 'ALL',
      };
    });
  };

  const toggleWeekSelection = (weekKey: string) => {
    const exists = selectedWeeks.includes(weekKey);
    const nextWeeks = exists ? selectedWeeks.filter((w) => w !== weekKey) : [...selectedWeeks, weekKey];
    setFilters((prev) => ({
      ...prev,
      week: nextWeeks.length > 0 ? nextWeeks : 'ALL',
    }));
  };

  const styles = Array.from(new Set(reports.map((r) => r.styleNumber))).filter(Boolean);
  const orders = Array.from(
    new Set(
      reports.flatMap((r) => {
        const full = r.orderNumber;
        const individual = full.split(/\s*[\+,]\s*/).map((s) => s.trim()).filter(Boolean);
        return [full, ...individual];
      })
    )
  ).filter(Boolean);

  const hasBuyerFilter = Array.isArray(filters.buyer)
    ? filters.buyer.length > 0 && !filters.buyer.includes('ALL')
    : filters.buyer !== 'ALL';

  const hasActiveFilters =
    hasBuyerFilter ||
    (Array.isArray(filters.floors) && filters.floors.length > 0) ||
    (Array.isArray(filters.financialYear)
      ? filters.financialYear.length > 0 && !filters.financialYear.includes('ALL')
      : filters.financialYear !== 'ALL') ||
    selectedMonths.length > 0 ||
    selectedWeeks.length > 0 ||
    filters.dateFrom !== '' ||
    filters.dateTo !== '' ||
    filters.orderNumber !== '' ||
    filters.styleNumber !== '' ||
    filters.defectGroup !== 'ALL' ||
    filters.defectSeverity !== 'ALL' ||
    filters.inspectionResult !== 'ALL' ||
    filters.searchQuery !== '';

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-2.5 shadow-xs transition-colors">
      <div className="flex flex-wrap items-center gap-2.5 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-bold mr-1 shrink-0">
          <Filter className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          <span>Filters:</span>
        </div>

        {/* Multi-Select Month Checkbox Filter */}
        <MultiSelectCheckboxFilter
          label="Month"
          allLabel="All Months"
          headerTitle="Select Months (Multi-Check)"
          ariaLabel="Filter by Months"
          allCount={nonMonthReports.length}
          selectedValues={selectedMonths}
          options={availableMonths.map((m) => ({
            value: m,
            label: formatMonthShort(m),
            count: monthReportCounts.get(m) || 0,
          }))}
          onToggle={toggleMonthSelection}
          onSelectAll={() => setFilters((prev) => ({ ...prev, month: 'ALL' }))}
          buttonSummary={
            selectedMonths.length === 0
              ? 'All Months'
              : selectedMonths.length === 1
              ? formatMonthShort(selectedMonths[0])
              : `${selectedMonths.slice(0, 2).map(formatMonthShort).join(', ')}${
                  selectedMonths.length > 2 ? ` +${selectedMonths.length - 2}` : ''
                }`
          }
          maxWidthClass="max-w-[140px]"
          menuWidthClass="w-60"
        />

        {/* Multi-Select Week Checkbox Filter (Monday–Sunday ISO Schedule) */}
        <MultiSelectCheckboxFilter
          label="Week"
          allLabel="All Weeks"
          headerTitle="ISO Weeks (Mon–Sun)"
          ariaLabel="Filter by Weeks"
          allCount={availableWeeks.reduce((s, w) => s + w.reportCount, 0)}
          selectedValues={selectedWeeks}
          options={availableWeeks.map((w) => ({
            value: w.weekKey,
            label: w.optionLabel,
            count: w.reportCount,
          }))}
          onToggle={toggleWeekSelection}
          onSelectAll={() => setFilters((prev) => ({ ...prev, week: 'ALL' }))}
          buttonSummary={
            selectedWeeks.length === 0
              ? 'All Weeks'
              : selectedWeeks.length === 1
              ? availableWeeksAll.find((w) => w.weekKey === selectedWeeks[0])?.optionLabel || selectedWeeks[0]
              : `${selectedWeeks.length} Weeks`
          }
          maxWidthClass="max-w-[175px]"
          menuWidthClass="w-72"
        />

        {/* Style Selector */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1">
          <span className="text-slate-400 dark:text-slate-500 font-medium">Style No:</span>
          <select
            value={filters.styleNumber}
            onChange={(e) => setFilters((prev) => ({ ...prev, styleNumber: e.target.value }))}
            className="bg-transparent text-slate-800 dark:text-slate-100 font-semibold focus:outline-none cursor-pointer max-w-[150px] truncate"
          >
            <option value="" className="dark:bg-slate-800">All Styles</option>
            {styles.map((s) => (
              <option key={s} value={s} className="dark:bg-slate-800">
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Order / PO No Selector */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1">
          <span className="text-slate-400 dark:text-slate-500 font-medium">Order / PO No:</span>
          <select
            value={filters.orderNumber}
            onChange={(e) => setFilters((prev) => ({ ...prev, orderNumber: e.target.value }))}
            className="bg-transparent text-slate-800 dark:text-slate-100 font-semibold focus:outline-none cursor-pointer max-w-[180px] truncate"
          >
            <option value="" className="dark:bg-slate-800">All Orders / POs</option>
            {orders.map((o) => (
              <option key={o} value={o} className="dark:bg-slate-800">
                {o}
              </option>
            ))}
          </select>
        </div>

        {/* Defect Group */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1">
          <span className="text-slate-400 dark:text-slate-500 font-medium">Group:</span>
          <select
            value={filters.defectGroup}
            onChange={(e) => setFilters((prev) => ({ ...prev, defectGroup: e.target.value }))}
            className="bg-transparent text-slate-800 dark:text-slate-100 font-semibold focus:outline-none cursor-pointer max-w-[160px] truncate"
          >
            <option value="ALL" className="dark:bg-slate-800">All Defect Groups</option>
            {defectGroups.map((g) => (
              <option key={g.id} value={g.id} className="dark:bg-slate-800">
                {g.groupName}
              </option>
            ))}
          </select>
        </div>

        {/* Inspection Result */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1">
          <span className="text-slate-400 dark:text-slate-500 font-medium">Result:</span>
          <select
            value={filters.inspectionResult}
            onChange={(e) => setFilters((prev) => ({ ...prev, inspectionResult: e.target.value }))}
            className="bg-transparent text-slate-800 dark:text-slate-100 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="ALL" className="dark:bg-slate-800">All Results</option>
            <option value="PASSED" className="dark:bg-slate-800">Passed</option>
            <option value="FAILED" className="dark:bg-slate-800">Failed</option>
            <option value="PENDING" className="dark:bg-slate-800">Pending</option>
            <option value="RE-INSPECTION" className="dark:bg-slate-800">Re-Inspection</option>
          </select>
        </div>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium ml-auto"
          >
            <RotateCcw className="w-3 h-3 text-slate-500 dark:text-slate-400" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
