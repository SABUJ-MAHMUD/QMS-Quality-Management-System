import React from 'react';
import { useApp } from '../../context/AppContext';
import { Filter, RotateCcw } from 'lucide-react';

export const FilterBar: React.FC = () => {
  const { filters, setFilters, resetFilters, defectGroups, reports } = useApp();

  const styles = Array.from(new Set(reports.map((r) => r.styleNumber))).filter(Boolean);
  const orders = Array.from(new Set(reports.map((r) => r.orderNumber))).filter(Boolean);

  const hasActiveFilters =
    filters.buyer !== 'ALL' ||
    filters.financialYear !== 'ALL' ||
    filters.month !== 'ALL' ||
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

        {/* Month Selector */}
        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1">
          <span className="text-slate-400 dark:text-slate-500 font-medium">Month:</span>
          <select
            value={filters.month}
            onChange={(e) => setFilters((prev) => ({ ...prev, month: e.target.value }))}
            className="bg-transparent text-slate-800 dark:text-slate-100 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="ALL" className="dark:bg-slate-800">All Months</option>
            <option value="2026-10" className="dark:bg-slate-800">October 2026</option>
            <option value="2026-09" className="dark:bg-slate-800">September 2026</option>
            <option value="2026-08" className="dark:bg-slate-800">August 2026</option>
            <option value="2026-07" className="dark:bg-slate-800">July 2026</option>
          </select>
        </div>

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
