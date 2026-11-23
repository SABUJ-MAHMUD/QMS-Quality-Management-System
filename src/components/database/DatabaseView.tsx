import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { InspectionReport, ReportSource } from '../../types';
import {
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  Edit2,
  FileText,
  AlertTriangle,
  X,
  ArrowUpDown,
  ChevronDown,
  Check,
  ChevronsRight,
  ChevronsLeft,
  Copy,
} from 'lucide-react';
import { findDuplicateReportIds } from '../../utils/dashboardAnalytics';
import { getReportOql, getReportOqlDefects, getReportSource, normalizeFloorName } from '../../utils/oqlCalculator';
import {
  DatabaseColumnFilterState,
  DEFAULT_DATABASE_FILTERS,
  DefectCountFilterMode,
  OqlFilterMode,
  analyzeRepeatedStyleAndPo,
  countActiveDatabaseFilters,
  filterDatabaseReports,
  getReportBrandLabel,
  getReportStageLabel,
} from '../../utils/databaseFiltering';
import { ExpandablePanel } from '../common/ExpandablePanel';

type ActiveColumnPopoverKey =
  | 'stageSource'
  | 'floor'
  | 'brand'
  | 'style'
  | 'crit'
  | 'maj'
  | 'min'
  | 'oql'
  | 'result';

interface PopoverAnchor {
  key: ActiveColumnPopoverKey;
  top: number;
  left: number;
  width: number;
}

export const DatabaseView: React.FC = () => {
  const {
    reports,
    filteredReports,
    deleteInspectionReport,
    updateInspectionReport,
    removeDuplicateReports,
    clearAllData,
    canManageData,
    canUpload,
    settings,
    setActiveTab,
    isFirebaseConnected,
  } = useApp();

  const [sortField, setSortField] = useState<keyof InspectionReport>('inspectionDate');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<InspectionReport | null>(null);
  const [editingReport, setEditingReport] = useState<InspectionReport | null>(null);
  const [previewPdfReport, setPreviewPdfReport] = useState<InspectionReport | null>(null);
  const [columnFilters, setColumnFilters] = useState<DatabaseColumnFilterState>(DEFAULT_DATABASE_FILTERS);
  const [styleSearchTerm, setStyleSearchTerm] = useState<string>('');
  const [activePopover, setActivePopover] = useState<PopoverAnchor | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<InspectionReport | null>(null);
  const [showWipeConfirm, setShowWipeConfirm] = useState<boolean>(false);
  const [showDuplicatesModal, setShowDuplicatesModal] = useState<boolean>(false);
  const [isReportNoExpanded, setIsReportNoExpanded] = useState<boolean>(false);

  const popoverRef = useRef<HTMLDivElement | null>(null);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);

  const handleWipeAll = async () => {
    await clearAllData();
    setSelectedIds([]);
    setShowWipeConfirm(false);
  };

  // Duplicate IDs across the repository (exact accidental duplicates)
  const duplicateIds = useMemo(() => findDuplicateReportIds(reports), [reports]);
  const duplicateIdSet = useMemo(() => new Set(duplicateIds), [duplicateIds]);
  const duplicateReportsList = useMemo(
    () => reports.filter((r) => duplicateIdSet.has(r.id)),
    [reports, duplicateIdSet]
  );

  // Repeated Style Number or PO / Order Number uploads within active filteredReports
  const repeatedAnalysis = useMemo(
    () => analyzeRepeatedStyleAndPo(filteredReports, duplicateIds),
    [filteredReports, duplicateIds]
  );

  // Summary counts inside the active filteredReports slice
  const distinctStyleOptions = useMemo(() => {
    const map = new Map<string, { style: string; count: number; brand: string }>();
    filteredReports.forEach((r) => {
      const style = (r.styleNumber || '').trim();
      if (!style) return;
      const existing = map.get(style);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(style, { style, count: 1, brand: getReportBrandLabel(r) });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.style.localeCompare(b.style));
  }, [filteredReports]);

  const distinctBrandOptions = useMemo(() => {
    const map = new Map<string, number>();
    filteredReports.forEach((r) => {
      const brand = getReportBrandLabel(r);
      map.set(brand, (map.get(brand) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredReports]);

  const distinctStageOptions = useMemo(() => {
    const map = new Map<string, number>();
    filteredReports.forEach((r) => {
      const stage = getReportStageLabel(r);
      map.set(stage, (map.get(stage) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredReports]);

  const floorCounts = useMemo(() => {
    const map = new Map<string, number>();
    filteredReports.forEach((r) => {
      const f = normalizeFloorName(r.floor || r.section);
      map.set(f, (map.get(f) || 0) + 1);
    });
    return map;
  }, [filteredReports]);

  const resultCounts = useMemo(() => {
    const map = new Map<string, number>();
    filteredReports.forEach((r) => {
      const res = (r.inspectionResult || 'PASSED').toUpperCase();
      map.set(res, (map.get(res) || 0) + 1);
    });
    return map;
  }, [filteredReports]);

  const distinctStyleCount = distinctStyleOptions.length;
  const finalCount = useMemo(
    () => filteredReports.filter((r) => getReportStageLabel(r).toLowerCase() === 'final').length,
    [filteredReports]
  );
  const inlineCount = useMemo(
    () => filteredReports.filter((r) => getReportStageLabel(r).toLowerCase() === 'inline').length,
    [filteredReports]
  );
  const bsqcCount = useMemo(
    () => filteredReports.filter((r) => getReportSource(r) === 'BSQC').length,
    [filteredReports]
  );
  const aqcCount = useMemo(
    () => filteredReports.filter((r) => getReportSource(r) === 'AQC').length,
    [filteredReports]
  );

  const uploadBatchDates = useMemo(() => {
    const counts = new Map<string, number>();
    filteredReports.forEach((r) => {
      const day = (r.createdAt || r.updatedAt || '').slice(0, 10);
      if (day) counts.set(day, (counts.get(day) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredReports]);

  useEffect(() => {
    if (
      columnFilters.uploadDateFilter !== 'ALL' &&
      !uploadBatchDates.some(([day]) => day === columnFilters.uploadDateFilter)
    ) {
      setColumnFilters((prev) => ({ ...prev, uploadDateFilter: 'ALL' }));
    }
  }, [columnFilters.uploadDateFilter, uploadBatchDates]);

  useEffect(() => {
    if (columnFilters.duplicatesOnly && duplicateIds.length === 0) {
      setColumnFilters((prev) => ({ ...prev, duplicatesOnly: false }));
    }
  }, [columnFilters.duplicatesOnly, duplicateIds.length]);

  // Close column filter popover on outside click, Escape, or outer scroll
  useEffect(() => {
    if (!activePopover) return;
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (popoverRef.current?.contains(target)) return;
      if (target?.closest('[data-db-popover-trigger="true"]')) return;
      setActivePopover(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActivePopover(null);
    };
    const handleScroll = (e: Event) => {
      const target = e.target as Node | null;
      if (target && popoverRef.current?.contains(target)) return;
      setActivePopover(null);
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [activePopover]);

  const openPopoverAtButton = (key: ActiveColumnPopoverKey, btnEl: HTMLElement, width = 230) => {
    if (activePopover?.key === key) {
      setActivePopover(null);
      return;
    }
    const rect = btnEl.getBoundingClientRect();
    const clampedLeft = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    const estimatedHeight = key === 'style' || key === 'brand' ? 300 : 250;
    const openUpward = rect.bottom + estimatedHeight > window.innerHeight - 12 && rect.top > estimatedHeight;
    const top = openUpward ? Math.max(8, rect.top - estimatedHeight - 4) : rect.bottom + 6;
    if (key === 'style') setStyleSearchTerm('');
    setActivePopover({ key, top, left: clampedLeft, width });
  };

  // Apply column & badge filters then sort
  const filteredByColumns = useMemo(
    () =>
      filterDatabaseReports(filteredReports, columnFilters, {
        targetOql: settings.targetOql,
        oqlDecimals: settings.oqlDecimals,
        duplicateIdSet,
        repeatedIdSet: repeatedAnalysis.repeatedIdSet,
      }),
    [
      filteredReports,
      columnFilters,
      settings.targetOql,
      settings.oqlDecimals,
      duplicateIdSet,
      repeatedAnalysis.repeatedIdSet,
    ]
  );

  const displayReports = useMemo(() => {
    return [...filteredByColumns].sort((a, b) => {
      if (sortField === 'oql') {
        const aOql = getReportOql(a, settings.oqlDecimals);
        const bOql = getReportOql(b, settings.oqlDecimals);
        return sortAsc ? aOql - bOql : bOql - aOql;
      }
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'string' || typeof bVal === 'string') {
        const aStr = String(aVal || '');
        const bStr = String(bVal || '');
        return sortAsc ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
      }
      return sortAsc
        ? (Number(aVal) || 0) - (Number(bVal) || 0)
        : (Number(bVal) || 0) - (Number(aVal) || 0);
    });
  }, [filteredByColumns, sortField, sortAsc, settings.oqlDecimals]);

  const activeFilterCount = useMemo(
    () => countActiveDatabaseFilters(columnFilters),
    [columnFilters]
  );

  const allDisplayedSelected =
    displayReports.length > 0 && displayReports.every((r) => selectedIds.includes(r.id));

  const toggleSelectAllDisplayed = () => {
    if (allDisplayedSelected) {
      const displaySet = new Set(displayReports.map((r) => r.id));
      setSelectedIds((prev) => prev.filter((id) => !displaySet.has(id)));
    } else {
      const merged = new Set([...selectedIds, ...displayReports.map((r) => r.id)]);
      setSelectedIds(Array.from(merged));
    }
  };

  const toggleRowSelected = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0 || !canManageData) return;
    selectedIds.forEach((id) => deleteInspectionReport(id));
    setSelectedIds([]);
  };

  const handleSort = (field: keyof InspectionReport, explicitAsc?: boolean) => {
    if (typeof explicitAsc === 'boolean') {
      setSortField(field);
      setSortAsc(explicitAsc);
      return;
    }
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport) return;
    updateInspectionReport(editingReport.id, editingReport);
    setEditingReport(null);
  };

  const clearAllDatabaseFilters = () => {
    setColumnFilters(DEFAULT_DATABASE_FILTERS);
    setSortField('inspectionDate');
    setSortAsc(false);
    setActivePopover(null);
  };

  const toggleRepeatedDuplicatesFilter = () => {
    setColumnFilters((prev) => {
      const next = !prev.repeatedOnly;
      if (next) {
        setSortField('styleNumber');
        setSortAsc(true);
      } else if (sortField === 'styleNumber') {
        setSortField('inspectionDate');
        setSortAsc(false);
      }
      return { ...prev, repeatedOnly: next };
    });
  };

  // Exact Freeze-Pane horizontal sticky offsets (Checkbox + Date/Uploaded + Report No)
  const dateStickyLeft = canManageData ? 'left-[40px]' : 'left-0';
  const reportStickyLeft = canManageData ? 'left-[172px]' : 'left-[132px]';
  const reportColWidthClass = isReportNoExpanded
    ? 'w-[440px] min-w-[440px] max-w-[440px]'
    : 'w-[225px] min-w-[225px] max-w-[225px]';
  const frozenShadowClass =
    'border-r border-slate-200 dark:border-slate-700 shadow-[4px_0_8px_-4px_rgba(15,23,42,0.16)]';

  const activeFilterChips = useMemo(() => {
    const chips: { key: keyof DatabaseColumnFilterState; label: string }[] = [];
    if (columnFilters.repeatedOnly) chips.push({ key: 'repeatedOnly', label: 'Same Style / PO Duplicates' });
    if (columnFilters.duplicatesOnly) chips.push({ key: 'duplicatesOnly', label: 'Exact Duplicates Only' });
    if (columnFilters.stageFilter !== 'ALL') chips.push({ key: 'stageFilter', label: `Stage: ${columnFilters.stageFilter}` });
    if (columnFilters.sourceFilter !== 'ALL') chips.push({ key: 'sourceFilter', label: `Source: ${columnFilters.sourceFilter}` });
    if (columnFilters.floorFilter !== 'ALL') chips.push({ key: 'floorFilter', label: `Floor: ${columnFilters.floorFilter}` });
    if (columnFilters.brandFilter !== 'ALL') chips.push({ key: 'brandFilter', label: `Brand: ${columnFilters.brandFilter}` });
    if (columnFilters.styleFilter !== 'ALL') chips.push({ key: 'styleFilter', label: `Style: ${columnFilters.styleFilter}` });
    if (columnFilters.uploadDateFilter !== 'ALL') chips.push({ key: 'uploadDateFilter', label: `Uploaded: ${columnFilters.uploadDateFilter}` });
    if (columnFilters.critFilter !== 'ALL') chips.push({ key: 'critFilter', label: `Crit: ${columnFilters.critFilter === 'GT_ZERO' ? '> 0' : '= 0'}` });
    if (columnFilters.majFilter !== 'ALL') chips.push({ key: 'majFilter', label: `Maj: ${columnFilters.majFilter === 'GT_ZERO' ? '> 0' : '= 0'}` });
    if (columnFilters.minFilter !== 'ALL') chips.push({ key: 'minFilter', label: `Min: ${columnFilters.minFilter === 'GT_ZERO' ? '> 0' : '= 0'}` });
    if (columnFilters.oqlFilter !== 'ALL') {
      const oqlLabel =
        columnFilters.oqlFilter === 'ABOVE_TARGET'
          ? `OQL > ${settings.targetOql}%`
          : columnFilters.oqlFilter === 'WITHIN_TARGET'
          ? `OQL ≤ ${settings.targetOql}%`
          : 'OQL = 0.00%';
      chips.push({ key: 'oqlFilter', label: oqlLabel });
    }
    if (columnFilters.resultFilter !== 'ALL') chips.push({ key: 'resultFilter', label: `Result: ${columnFilters.resultFilter}` });
    return chips;
  }, [columnFilters, settings.targetOql]);

  const filteredStyleOptions = useMemo(() => {
    const q = styleSearchTerm.trim().toLowerCase();
    if (!q) return distinctStyleOptions;
    return distinctStyleOptions.filter(
      (item) => item.style.toLowerCase().includes(q) || item.brand.toLowerCase().includes(q)
    );
  }, [distinctStyleOptions, styleSearchTerm]);

  const defectModeLabel = (mode: DefectCountFilterMode) =>
    mode === 'GT_ZERO' ? '> 0 Defects' : mode === 'ZERO' ? '0 Defects' : 'All';

  const oqlModeLabel = (mode: OqlFilterMode) =>
    mode === 'ABOVE_TARGET'
      ? `Above Target (> ${settings.targetOql}%)`
      : mode === 'WITHIN_TARGET'
      ? `Within Target (≤ ${settings.targetOql}%)`
      : mode === 'ZERO'
      ? 'Zero OQL (0.00%)'
      : 'All OQL';

  return (
    <div className="h-full flex flex-col overflow-y-auto md:overflow-hidden p-3 sm:p-4 gap-3">
      {/* Top Header & Clickable Quick Filters */}
      <div className="shrink-0 flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
        <div className="min-w-0">
          <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex flex-wrap items-center gap-1.5">
            <h2 className="mr-1">Inspection Database</h2>

            <button
              type="button"
              data-testid="db-total-badge"
              onClick={clearAllDatabaseFilters}
              title={activeFilterCount > 0 ? 'Click to reset all database column filters' : 'Total reports in active global filter'}
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                activeFilterCount === 0
                  ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-800 dark:border-slate-100 shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Reports: {filteredReports.length}
            </button>

            <button
              type="button"
              data-testid="db-styles-badge"
              data-db-popover-trigger="true"
              onClick={(e) => openPopoverAtButton('style', e.currentTarget, 260)}
              title="Click to pick and inspect any individual Style Number"
              className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                columnFilters.styleFilter !== 'ALL'
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/70'
              }`}
            >
              <span>
                Styles: {distinctStyleCount}
                {columnFilters.styleFilter !== 'ALL' ? ` (${columnFilters.styleFilter})` : ''}
              </span>
              <ChevronDown className="w-3 h-3" />
            </button>

            <button
              type="button"
              data-testid="db-final-badge"
              onClick={() =>
                setColumnFilters((prev) => ({
                  ...prev,
                  stageFilter: prev.stageFilter === 'Final' ? 'ALL' : 'Final',
                }))
              }
              title="Click to filter Final inspections only"
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                columnFilters.stageFilter === 'Final'
                  ? 'bg-sky-600 text-white border-sky-700 shadow-xs ring-2 ring-sky-300 dark:ring-sky-800'
                  : 'bg-sky-50 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/70'
              }`}
            >
              Final: {finalCount}
            </button>

            <button
              type="button"
              data-testid="db-inline-badge"
              onClick={() =>
                setColumnFilters((prev) => ({
                  ...prev,
                  stageFilter: prev.stageFilter === 'Inline' ? 'ALL' : 'Inline',
                }))
              }
              title="Click to filter Inline inspections only"
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                columnFilters.stageFilter === 'Inline'
                  ? 'bg-violet-600 text-white border-violet-700 shadow-xs ring-2 ring-violet-300 dark:ring-violet-800'
                  : 'bg-violet-50 dark:bg-violet-950/70 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-800 hover:bg-violet-100 dark:hover:bg-violet-900/70'
              }`}
            >
              Inline: {inlineCount}
            </button>

            <div className="inline-flex items-center rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/70 p-0.5 text-[11px] font-bold">
              <button
                type="button"
                data-testid="db-bsqc-badge"
                onClick={() =>
                  setColumnFilters((prev) => ({
                    ...prev,
                    sourceFilter: prev.sourceFilter === 'BSQC' ? 'ALL' : 'BSQC',
                  }))
                }
                title="Click to filter BSQC reports"
                className={`px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                  columnFilters.sourceFilter === 'BSQC'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                }`}
              >
                BSQC: {bsqcCount}
              </button>
              <span className="text-emerald-400 px-0.5">&bull;</span>
              <button
                type="button"
                data-testid="db-aqc-badge"
                onClick={() =>
                  setColumnFilters((prev) => ({
                    ...prev,
                    sourceFilter: prev.sourceFilter === 'AQC' ? 'ALL' : 'AQC',
                  }))
                }
                title="Click to filter AQC reports"
                className={`px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                  columnFilters.sourceFilter === 'AQC'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                }`}
              >
                AQC: {aqcCount}
              </button>
            </div>

            {isFirebaseConnected && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Firestore Live
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            Central repository of approved buyer OQL inspection reports, defect breakdowns, and audit trails. Click any summary pill or column header arrow to filter.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Upload Batch Date Filter */}
          {uploadBatchDates.length > 1 && (
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 bg-white dark:bg-slate-800 text-xs font-semibold">
              <span className="text-slate-400">Uploaded:</span>
              <select
                value={columnFilters.uploadDateFilter}
                onChange={(e) =>
                  setColumnFilters((prev) => ({ ...prev, uploadDateFilter: e.target.value }))
                }
                aria-label="Filter by Upload Date"
                className="bg-transparent font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Batches ({filteredReports.length})</option>
                {uploadBatchDates.map(([day, cnt]) => (
                  <option key={day} value={day}>
                    {day} ({cnt})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* BSQC / AQC Source Filter */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            {(['ALL', 'BSQC', 'AQC'] as const).map((src) => (
              <button
                key={src}
                type="button"
                data-testid={`db-source-btn-${src}`}
                onClick={() => setColumnFilters((prev) => ({ ...prev, sourceFilter: src }))}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  columnFilters.sourceFilter === src
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {src === 'ALL' ? 'All Sources' : src}
              </button>
            ))}
          </div>

          {/* Floor / Section Filter + Same Style / PO Duplicates Button */}
          <div className="inline-flex flex-wrap items-center gap-1.5">
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
              {['ALL', 'SEW-1', 'SEW-2', 'SEW-3'].map((fl) => (
                <button
                  key={fl}
                  type="button"
                  data-testid={`db-floor-btn-${fl}`}
                  onClick={() =>
                    setColumnFilters((prev) => ({
                      ...prev,
                      floorFilter: prev.floorFilter === fl && fl !== 'ALL' ? 'ALL' : fl,
                    }))
                  }
                  title={
                    fl === 'ALL'
                      ? `Show all floors (${filteredReports.length})`
                      : `Filter ${fl} (${floorCounts.get(fl) || 0} reports)`
                  }
                  className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                    columnFilters.floorFilter === fl
                      ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {fl === 'ALL' ? 'All Floors' : fl}
                </button>
              ))}
            </div>

            <button
              type="button"
              data-testid="db-repeated-duplicates-btn"
              onClick={toggleRepeatedDuplicatesFilter}
              title="Show only reports with the same Style Number or PO / Order Number uploaded multiple times"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                columnFilters.repeatedOnly
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-300 dark:ring-amber-800'
                  : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/70 dark:hover:bg-amber-900/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicates ({repeatedAnalysis.repeatedIdSet.size})</span>
            </button>
          </div>

          {selectedIds.length > 0 && canManageData && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected ({selectedIds.length})
            </button>
          )}

          {duplicateIds.length > 0 && canManageData && (
            <button
              type="button"
              data-testid="db-clean-duplicates-btn"
              onClick={() => setShowDuplicatesModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/70 dark:hover:bg-amber-900/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              title="Inspect duplicate inspection reports or remove accidental duplicate copies"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Clean {duplicateIds.length} Duplicates
            </button>
          )}

          {filteredReports.length > 0 && canManageData && (
            <button
              type="button"
              onClick={() => setShowWipeConfirm(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Delete all inspection data and start fresh from zero"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              Reset to Zero
            </button>
          )}

          <button
            type="button"
            onClick={async () => {
              const { exportReportsToExcel } = await import('../../utils/exportUtils');
              exportReportsToExcel(displayReports);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            Export to Excel
          </button>

          {canUpload && (
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              New Inspection Report
            </button>
          )}
        </div>
      </div>

      {/* Main Excel-Style One-Screen Database Table with Freeze Panes & Always-Visible Scrollbar */}
      <ExpandablePanel
        title="Inspection Database Records"
        buttonTone="on-light"
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col flex-1 min-h-0"
      >
        {({ expandControls }) => (
          <>
            <div className="shrink-0 px-3 sm:px-4 py-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  Inspection Database Records ({displayReports.length}
                  {displayReports.length !== filteredReports.length ? ` of ${filteredReports.length}` : ''})
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  Freeze: Date / Uploaded &amp; Report No
                </span>

                {activeFilterChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => {
                      if (chip.key === 'repeatedOnly') {
                        toggleRepeatedDuplicatesFilter();
                        return;
                      }
                      setColumnFilters((prev) => ({
                        ...prev,
                        [chip.key]: chip.key === 'duplicatesOnly' ? false : 'ALL',
                      }));
                    }}
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 cursor-pointer"
                    title="Click to remove filter"
                  >
                    <span>{chip.label}</span>
                    <X className="w-2.5 h-2.5" />
                  </button>
                ))}

                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    data-testid="db-clear-filters-btn"
                    onClick={clearAllDatabaseFilters}
                    className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer px-1"
                  >
                    Clear All
                  </button>
                )}
              </div>
              {expandControls}
            </div>

            <div
              ref={tableScrollRef}
              data-testid="db-table-scroll-container"
              className="flex-1 min-h-0 overflow-auto relative"
            >
              <table className="w-full text-xs text-left border-separate border-spacing-0">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold select-none">
                  <tr>
                    {canManageData && (
                      <th className="sticky top-0 left-0 z-40 w-[40px] min-w-[40px] max-w-[40px] bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-2.5 px-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={allDisplayedSelected}
                          onChange={toggleSelectAllDisplayed}
                          aria-label="Select all visible reports"
                          className="w-3.5 h-3.5 rounded accent-sky-600 cursor-pointer"
                        />
                      </th>
                    )}

                    {/* Frozen Column 1: Date / Uploaded */}
                    <th
                      data-testid="db-col-header-date"
                      onClick={() => handleSort('inspectionDate')}
                      className={`sticky top-0 ${dateStickyLeft} z-40 w-[132px] min-w-[132px] max-w-[132px] bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-2.5 px-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/80 whitespace-nowrap`}
                    >
                      <div className="flex items-center gap-1">
                        <span>Date / Uploaded</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
                      </div>
                    </th>

                    {/* Frozen Column 2: Report No (expandable via header button or right freeze border click) */}
                    <th
                      data-testid="db-col-header-reportNo"
                      onClick={() => handleSort('reportNumber')}
                      className={`sticky top-0 ${reportStickyLeft} z-40 ${reportColWidthClass} bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 ${frozenShadowClass} py-2.5 pl-3 pr-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/80 whitespace-nowrap`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <span>Report No</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />
                        </div>
                        <button
                          type="button"
                          data-testid="db-reportno-expand-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsReportNoExpanded((prev) => !prev);
                          }}
                          title={
                            isReportNoExpanded
                              ? 'Collapse Report No column back to compact width'
                              : 'Expand Report No column to see full report numbers'
                          }
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900 text-[10px] font-bold cursor-pointer shrink-0"
                        >
                          {isReportNoExpanded ? (
                            <>
                              <ChevronsLeft className="w-3 h-3" />
                              <span>Compact</span>
                            </>
                          ) : (
                            <>
                              <span>Full</span>
                              <ChevronsRight className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      </div>
                      <div
                        role="button"
                        tabIndex={0}
                        aria-label={isReportNoExpanded ? 'Collapse Report No column' : 'Expand Report No column'}
                        data-testid="db-reportno-resize-handle"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsReportNoExpanded((prev) => !prev);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsReportNoExpanded((prev) => !prev);
                          }
                        }}
                        title="Click right freeze edge to expand / collapse full Report No"
                        className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-sky-400/35 active:bg-sky-500/50 transition-colors"
                      />
                    </th>

                    {/* Filterable: Stage / Source */}
                    <th className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-2.5 px-3 whitespace-nowrap">
                      <button
                        type="button"
                        data-testid="db-col-filter-stageSource"
                        data-db-popover-trigger="true"
                        onClick={(e) => openPopoverAtButton('stageSource', e.currentTarget, 230)}
                        className={`inline-flex items-center gap-1 font-semibold cursor-pointer hover:text-sky-700 dark:hover:text-sky-300 ${
                          columnFilters.stageFilter !== 'ALL' || columnFilters.sourceFilter !== 'ALL'
                            ? 'text-indigo-700 dark:text-indigo-300'
                            : ''
                        }`}
                      >
                        <span>Stage / Source</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 ${
                            columnFilters.stageFilter !== 'ALL' || columnFilters.sourceFilter !== 'ALL'
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-sky-600 dark:text-sky-400'
                          }`}
                        />
                      </button>
                    </th>

                    {/* Filterable: Floor / Section */}
                    <th className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-2.5 px-3 whitespace-nowrap">
                      <button
                        type="button"
                        data-testid="db-col-filter-floor"
                        data-db-popover-trigger="true"
                        onClick={(e) => openPopoverAtButton('floor', e.currentTarget, 200)}
                        className={`inline-flex items-center gap-1 font-semibold cursor-pointer hover:text-sky-700 dark:hover:text-sky-300 ${
                          columnFilters.floorFilter !== 'ALL' ? 'text-indigo-700 dark:text-indigo-300' : ''
                        }`}
                      >
                        <span>Floor / Section</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 ${
                            columnFilters.floorFilter !== 'ALL'
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-sky-600 dark:text-sky-400'
                          }`}
                        />
                      </button>
                    </th>

                    {/* Filterable: Brand */}
                    <th className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-2.5 px-3 whitespace-nowrap">
                      <button
                        type="button"
                        data-testid="db-col-filter-brand"
                        data-db-popover-trigger="true"
                        onClick={(e) => openPopoverAtButton('brand', e.currentTarget, 220)}
                        className={`inline-flex items-center gap-1 font-semibold cursor-pointer hover:text-sky-700 dark:hover:text-sky-300 ${
                          columnFilters.brandFilter !== 'ALL' ? 'text-indigo-700 dark:text-indigo-300' : ''
                        }`}
                      >
                        <span>Brand</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 ${
                            columnFilters.brandFilter !== 'ALL'
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-sky-600 dark:text-sky-400'
                          }`}
                        />
                      </button>
                    </th>

                    <th className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-2.5 px-3 whitespace-nowrap">
                      Order / PO No
                    </th>

                    {/* Filterable: Style Number */}
                    <th className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-2.5 px-3 whitespace-nowrap">
                      <button
                        type="button"
                        data-testid="db-col-filter-style"
                        data-db-popover-trigger="true"
                        onClick={(e) => openPopoverAtButton('style', e.currentTarget, 260)}
                        className={`inline-flex items-center gap-1 font-semibold cursor-pointer hover:text-sky-700 dark:hover:text-sky-300 ${
                          columnFilters.styleFilter !== 'ALL' ? 'text-indigo-700 dark:text-indigo-300' : ''
                        }`}
                      >
                        <span>Style Number</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 ${
                            columnFilters.styleFilter !== 'ALL'
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-sky-600 dark:text-sky-400'
                          }`}
                        />
                      </button>
                    </th>

                    <th
                      onClick={() => handleSort('orderQuantity')}
                      className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/80 whitespace-nowrap"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Order Qty</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>

                    <th
                      onClick={() => handleSort('inspectedQuantity')}
                      className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/80 whitespace-nowrap"
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Inspected</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>

                    {/* Filterable + Sortable: Crit */}
                    <th className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-2.5 px-2 text-center text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      <button
                        type="button"
                        data-testid="db-col-filter-crit"
                        data-db-popover-trigger="true"
                        onClick={(e) => openPopoverAtButton('crit', e.currentTarget, 210)}
                        className={`inline-flex items-center justify-center gap-0.5 font-bold cursor-pointer hover:underline ${
                          columnFilters.critFilter !== 'ALL' ? 'underline' : ''
                        }`}
                      >
                        <span>Crit</span>
                        <ChevronDown className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      </button>
                    </th>

                    {/* Filterable + Sortable: Maj */}
                    <th className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-2.5 px-2 text-center text-amber-600 dark:text-amber-400 whitespace-nowrap">
                      <button
                        type="button"
                        data-testid="db-col-filter-maj"
                        data-db-popover-trigger="true"
                        onClick={(e) => openPopoverAtButton('maj', e.currentTarget, 210)}
                        className={`inline-flex items-center justify-center gap-0.5 font-bold cursor-pointer hover:underline ${
                          columnFilters.majFilter !== 'ALL' ? 'underline' : ''
                        }`}
                      >
                        <span>Maj</span>
                        <ChevronDown className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      </button>
                    </th>

                    {/* Filterable + Sortable: Min */}
                    <th className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-2.5 px-2 text-center text-sky-600 dark:text-sky-400 whitespace-nowrap">
                      <button
                        type="button"
                        data-testid="db-col-filter-min"
                        data-db-popover-trigger="true"
                        onClick={(e) => openPopoverAtButton('min', e.currentTarget, 210)}
                        className={`inline-flex items-center justify-center gap-0.5 font-bold cursor-pointer hover:underline ${
                          columnFilters.minFilter !== 'ALL' ? 'underline' : ''
                        }`}
                      >
                        <span>Min</span>
                        <ChevronDown className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      </button>
                    </th>

                    <th
                      onClick={() => handleSort('totalDefectQuantity')}
                      className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-2.5 px-2 text-center font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/80 whitespace-nowrap"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Total</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>

                    {/* Filterable + Sortable: OQL (%) */}
                    <th className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        data-testid="db-col-filter-oql"
                        data-db-popover-trigger="true"
                        onClick={(e) => openPopoverAtButton('oql', e.currentTarget, 230)}
                        className={`inline-flex items-center justify-end gap-1 font-semibold cursor-pointer hover:text-sky-700 dark:hover:text-sky-300 ${
                          columnFilters.oqlFilter !== 'ALL' ? 'text-indigo-700 dark:text-indigo-300' : ''
                        }`}
                      >
                        <span>OQL (%)</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 ${
                            columnFilters.oqlFilter !== 'ALL'
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-sky-600 dark:text-sky-400'
                          }`}
                        />
                      </button>
                    </th>

                    {/* Filterable: Result */}
                    <th className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-2.5 px-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        data-testid="db-col-filter-result"
                        data-db-popover-trigger="true"
                        onClick={(e) => openPopoverAtButton('result', e.currentTarget, 210)}
                        className={`inline-flex items-center justify-center gap-1 font-semibold cursor-pointer hover:text-sky-700 dark:hover:text-sky-300 ${
                          columnFilters.resultFilter !== 'ALL' ? 'text-indigo-700 dark:text-indigo-300' : ''
                        }`}
                      >
                        <span>Result</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 ${
                            columnFilters.resultFilter !== 'ALL'
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-sky-600 dark:text-sky-400'
                          }`}
                        />
                      </button>
                    </th>

                    <th className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-2.5 px-3 text-center whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {displayReports.length === 0 ? (
                    <tr>
                      <td colSpan={canManageData ? 17 : 16} className="py-12 text-center border-b border-slate-100 dark:border-slate-800">
                        <div className="max-w-md mx-auto space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800 flex items-center justify-center mx-auto shadow-2xs">
                            <FileText className="w-6 h-6" />
                          </div>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            {activeFilterCount > 0
                              ? 'No Matching Inspection Records'
                              : 'Clean Database Ready (0 Records)'}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {activeFilterCount > 0
                              ? 'No reports match the selected column/badge filters. Clear one or more filters to view all records.'
                              : 'No inspection records exist in the database. Upload factory PDF inspection reports to start tracking OQL metrics and defect rankings from zero.'}
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            {activeFilterCount > 0 && (
                              <button
                                type="button"
                                onClick={clearAllDatabaseFilters}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                              >
                                <Filter className="w-3.5 h-3.5" />
                                Clear Database Filters
                              </button>
                            )}
                            {canUpload && activeFilterCount === 0 && (
                              <button
                                type="button"
                                onClick={() => setActiveTab('upload')}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                              >
                                <FileText className="w-4 h-4" />
                                Upload First PDF Report
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayReports.map((r) => {
                      const isRowSelected = selectedIds.includes(r.id);
                      const isDuplicate = duplicateIdSet.has(r.id);
                      const rowStickyBg = isRowSelected
                        ? 'bg-rose-50 dark:bg-rose-950'
                        : 'bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800';
                      const stageLabel = getReportStageLabel(r);
                      const sourceLabel = getReportSource(r);
                      const floorLabel = normalizeFloorName(r.floor || r.section);
                      const brandLabel = getReportBrandLabel(r);

                      return (
                        <tr
                          key={r.id}
                          className={`group transition-colors ${
                            isRowSelected
                              ? 'bg-rose-50/70 dark:bg-rose-950/50'
                              : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/70'
                          }`}
                        >
                          {canManageData && (
                            <td
                              className={`sticky left-0 z-20 w-[40px] min-w-[40px] max-w-[40px] ${rowStickyBg} border-b border-slate-100 dark:border-slate-800 py-2.5 px-2.5 text-center transition-colors`}
                            >
                              <input
                                type="checkbox"
                                checked={isRowSelected}
                                onChange={() => toggleRowSelected(r.id)}
                                aria-label={`Select report ${r.reportNumber}`}
                                className="w-3.5 h-3.5 rounded accent-sky-600 cursor-pointer"
                              />
                            </td>
                          )}

                          {/* Frozen Column 1: Date / Uploaded */}
                          <td
                            className={`sticky ${dateStickyLeft} z-20 w-[132px] min-w-[132px] max-w-[132px] ${rowStickyBg} border-b border-slate-100 dark:border-slate-800 py-2.5 px-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap transition-colors`}
                          >
                            <div>{r.inspectionDate}</div>
                            {r.createdAt && (
                              <div className="text-[10px] text-slate-400">
                                Up: {r.createdAt.slice(0, 10)}
                              </div>
                            )}
                          </td>

                          {/* Frozen Column 2: Report No (click right freeze border to expand full width) */}
                          <td
                            className={`sticky ${reportStickyLeft} z-20 ${reportColWidthClass} ${rowStickyBg} border-b border-slate-100 dark:border-slate-800 ${frozenShadowClass} py-2.5 pl-3 pr-4 font-bold text-sky-800 dark:text-sky-300 transition-colors`}
                          >
                            <div
                              className={`flex items-center gap-1.5 min-w-0 ${
                                isReportNoExpanded ? 'max-w-[410px]' : 'max-w-[198px]'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => setSelectedReport(r)}
                                title={r.reportNumber}
                                className={`min-w-0 ${
                                  isReportNoExpanded ? 'whitespace-normal break-words leading-snug' : 'truncate'
                                } text-left hover:underline cursor-pointer`}
                              >
                                {r.reportNumber}
                              </button>
                              {columnFilters.repeatedOnly && (() => {
                                const meta = repeatedAnalysis.metaById.get(r.id);
                                if (!meta) return null;
                                return (
                                  <>
                                    {meta.styleCount > 1 && (
                                      <span
                                        className="shrink-0 text-[9px] px-1.5 py-0.2 rounded bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-800 font-bold"
                                        title={`Style uploaded ${meta.styleCount} times`}
                                      >
                                        Style &times;{meta.styleCount}
                                      </span>
                                    )}
                                    {meta.maxPoCount > 1 && (
                                      <span
                                        className="shrink-0 text-[9px] px-1.5 py-0.2 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-bold"
                                        title={`PO / Order uploaded ${meta.maxPoCount} times`}
                                      >
                                        PO &times;{meta.maxPoCount}
                                      </span>
                                    )}
                                  </>
                                );
                              })()}
                              {isDuplicate && (
                                <span
                                  className="shrink-0 text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 font-extrabold"
                                  title="Exact duplicate copy detected"
                                >
                                  DUP
                                </span>
                              )}
                              {r.isDemo && (
                                <span className="shrink-0 text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                  DEMO
                                </span>
                              )}
                            </div>
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsReportNoExpanded((prev) => !prev);
                              }}
                              title={
                                isReportNoExpanded
                                  ? 'Click right freeze edge to collapse Report No column'
                                  : 'Click right freeze edge to expand full Report No'
                              }
                              className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-sky-400/35 active:bg-sky-500/50 transition-colors"
                            />
                          </td>

                          {/* Stage / Source (click pills to filter) */}
                          <td className="border-b border-slate-100 dark:border-slate-800 py-2.5 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setColumnFilters((prev) => ({
                                    ...prev,
                                    stageFilter:
                                      prev.stageFilter.toLowerCase() === stageLabel.toLowerCase()
                                        ? 'ALL'
                                        : stageLabel,
                                  }))
                                }
                                title={`Filter by Stage: ${stageLabel}`}
                                className="font-bold text-slate-800 dark:text-slate-100 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-sky-400 text-[10px] cursor-pointer"
                              >
                                {stageLabel}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setColumnFilters((prev) => ({
                                    ...prev,
                                    sourceFilter: prev.sourceFilter === sourceLabel ? 'ALL' : sourceLabel,
                                  }))
                                }
                                title={`Filter by Source: ${sourceLabel}`}
                                className={`font-black px-1.5 py-0.5 rounded text-[10px] border cursor-pointer ${
                                  sourceLabel === 'AQC'
                                    ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400'
                                    : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400'
                                }`}
                              >
                                {sourceLabel}
                              </button>
                            </div>
                          </td>

                          {/* Floor / Section */}
                          <td className="border-b border-slate-100 dark:border-slate-800 py-2.5 px-3 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() =>
                                setColumnFilters((prev) => ({
                                  ...prev,
                                  floorFilter: prev.floorFilter === floorLabel ? 'ALL' : floorLabel,
                                }))
                              }
                              title={`Filter by Floor: ${floorLabel}`}
                              className="font-bold text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 text-xs cursor-pointer"
                            >
                              {floorLabel}
                            </button>
                          </td>

                          {/* Brand */}
                          <td className="border-b border-slate-100 dark:border-slate-800 py-2.5 px-3 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() =>
                                setColumnFilters((prev) => ({
                                  ...prev,
                                  brandFilter:
                                    prev.brandFilter.toLowerCase() === brandLabel.toLowerCase()
                                      ? 'ALL'
                                      : brandLabel,
                                }))
                              }
                              title={`Filter by Brand: ${brandLabel}`}
                              className="font-bold text-sky-800 dark:text-sky-300 px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 hover:border-sky-400 text-xs cursor-pointer"
                            >
                              {brandLabel}
                            </button>
                          </td>

                          {/* Order / PO No */}
                          <td className="border-b border-slate-100 dark:border-slate-800 py-2.5 px-3">
                            <div className="flex flex-wrap gap-1 max-w-[220px]">
                              {r.orderNumber.includes('+') ? (
                                r.orderNumber.split('+').map((o, idx) => (
                                  <span
                                    key={idx}
                                    className="font-mono text-[10px] font-bold bg-sky-50 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-800/60"
                                  >
                                    #{o.trim()}
                                  </span>
                                ))
                              ) : (
                                <div className="font-bold font-mono text-slate-800 dark:text-slate-100">
                                  {r.orderNumber}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Style Number */}
                          <td className="border-b border-slate-100 dark:border-slate-800 py-2.5 px-3 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() =>
                                setColumnFilters((prev) => ({
                                  ...prev,
                                  styleFilter:
                                    prev.styleFilter === (r.styleNumber || '').trim()
                                      ? 'ALL'
                                      : (r.styleNumber || '').trim(),
                                }))
                              }
                              title={`Filter by Style: ${r.styleNumber}`}
                              className="font-semibold text-slate-900 dark:text-slate-200 font-mono hover:text-sky-700 dark:hover:text-sky-300 hover:underline cursor-pointer"
                            >
                              {r.styleNumber}
                            </button>
                          </td>

                          <td className="border-b border-slate-100 dark:border-slate-800 py-2.5 px-3 text-right font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                            {r.orderQuantity?.toLocaleString()}
                          </td>

                          <td className="border-b border-slate-100 dark:border-slate-800 py-2.5 px-3 text-right font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                            {r.inspectedQuantity?.toLocaleString()}
                          </td>

                          <td className="border-b border-slate-100 dark:border-slate-800 py-2.5 px-2 text-center font-bold text-rose-600 dark:text-rose-400">
                            {r.criticalDefectQuantity}
                          </td>

                          <td className="border-b border-slate-100 dark:border-slate-800 py-2.5 px-2 text-center font-bold text-amber-600 dark:text-amber-400">
                            {r.majorDefectQuantity}
                          </td>

                          <td className="border-b border-slate-100 dark:border-slate-800 py-2.5 px-2 text-center font-bold text-sky-600 dark:text-sky-400">
                            {r.minorDefectQuantity}
                          </td>

                          <td className="border-b border-slate-100 dark:border-slate-800 py-2.5 px-2 text-center font-extrabold text-slate-900 dark:text-slate-100 bg-slate-50/70 dark:bg-slate-800/40">
                            {r.totalDefectQuantity}
                          </td>

                          <td className="border-b border-slate-100 dark:border-slate-800 py-2.5 px-3 text-right font-black whitespace-nowrap">
                            <span
                              className={
                                getReportOql(r, settings.oqlDecimals) <= settings.targetOql
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }
                            >
                              {getReportOql(r, settings.oqlDecimals).toFixed(2)}%
                            </span>
                          </td>

                          <td className="border-b border-slate-100 dark:border-slate-800 py-2.5 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() =>
                                setColumnFilters((prev) => ({
                                  ...prev,
                                  resultFilter:
                                    prev.resultFilter.toUpperCase() === r.inspectionResult.toUpperCase()
                                      ? 'ALL'
                                      : r.inspectionResult,
                                }))
                              }
                              title={`Filter by Result: ${r.inspectionResult}`}
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                r.inspectionResult === 'PASSED'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              }`}
                            >
                              {r.inspectionResult}
                            </button>
                          </td>

                          <td className="border-b border-slate-100 dark:border-slate-800 py-2.5 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedReport(r)}
                                className="p-1 rounded text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/60 transition-colors cursor-pointer"
                                title="View Details & Defect Breakdown"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setPreviewPdfReport(r)}
                                className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-colors cursor-pointer"
                                title="View Simulated Original PDF"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>

                              {canManageData && (
                                <button
                                  type="button"
                                  onClick={() => setEditingReport({ ...r })}
                                  className="p-1 rounded text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition-colors cursor-pointer"
                                  title="Edit Report"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {canManageData && (
                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget(r)}
                                  className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors cursor-pointer"
                                  title="Delete Report"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </ExpandablePanel>

      {/* Portal-anchored Excel Column Filter Popover */}
      {activePopover &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            data-testid={`db-popover-${activePopover.key}`}
            style={{
              position: 'fixed',
              top: activePopover.top,
              left: activePopover.left,
              width: activePopover.width,
            }}
            className="z-[120] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 text-xs text-slate-800 dark:text-slate-100 max-h-[310px] flex flex-col gap-1.5"
          >
            {activePopover.key === 'stageSource' && (
              <div className="space-y-2 overflow-y-auto pr-0.5">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1">
                    Inspection Stage
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setColumnFilters((p) => ({ ...p, stageFilter: 'ALL' }));
                      setActivePopover(null);
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left cursor-pointer ${
                      columnFilters.stageFilter === 'ALL'
                        ? 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>All Stages ({filteredReports.length})</span>
                    {columnFilters.stageFilter === 'ALL' && <Check className="w-3.5 h-3.5" />}
                  </button>
                  {distinctStageOptions.map(([stage, count]) => (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => {
                        setColumnFilters((p) => ({ ...p, stageFilter: stage }));
                        setActivePopover(null);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left cursor-pointer ${
                        columnFilters.stageFilter.toLowerCase() === stage.toLowerCase()
                          ? 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{stage}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{count}</span>
                    </button>
                  ))}
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1">
                    Report Source
                  </div>
                  {(['ALL', 'BSQC', 'AQC'] as const).map((src) => {
                    const cnt =
                      src === 'ALL' ? filteredReports.length : src === 'BSQC' ? bsqcCount : aqcCount;
                    return (
                      <button
                        key={src}
                        type="button"
                        onClick={() => {
                          setColumnFilters((p) => ({ ...p, sourceFilter: src }));
                          setActivePopover(null);
                        }}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left cursor-pointer ${
                          columnFilters.sourceFilter === src
                            ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>{src === 'ALL' ? 'All Sources' : src}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{cnt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activePopover.key === 'floor' && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  Floor / Section
                </div>
                {['ALL', 'SEW-1', 'SEW-2', 'SEW-3'].map((fl) => {
                  const cnt = fl === 'ALL' ? filteredReports.length : floorCounts.get(fl) || 0;
                  return (
                    <button
                      key={fl}
                      type="button"
                      onClick={() => {
                        setColumnFilters((p) => ({ ...p, floorFilter: fl }));
                        setActivePopover(null);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left cursor-pointer ${
                        columnFilters.floorFilter === fl
                          ? 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{fl === 'ALL' ? 'All Floors' : fl}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{cnt}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {activePopover.key === 'brand' && (
              <div className="space-y-1 overflow-y-auto pr-0.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  Filter by Brand
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setColumnFilters((p) => ({ ...p, brandFilter: 'ALL' }));
                    setActivePopover(null);
                  }}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left cursor-pointer ${
                    columnFilters.brandFilter === 'ALL'
                      ? 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>All Brands</span>
                  <span className="text-[10px] text-slate-400 font-semibold">{filteredReports.length}</span>
                </button>
                {distinctBrandOptions.map(([brand, cnt]) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => {
                      setColumnFilters((p) => ({ ...p, brandFilter: brand }));
                      setActivePopover(null);
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left cursor-pointer ${
                      columnFilters.brandFilter.toLowerCase() === brand.toLowerCase()
                        ? 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{brand}</span>
                    <span className="text-[10px] text-slate-400 font-semibold ml-2">{cnt}</span>
                  </button>
                ))}
              </div>
            )}

            {activePopover.key === 'style' && (
              <div className="flex flex-col min-h-0 gap-1.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={styleSearchTerm}
                    onChange={(e) => setStyleSearchTerm(e.target.value)}
                    placeholder="Search style or brand..."
                    autoFocus
                    className="w-full pl-7 pr-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div className="overflow-y-auto space-y-0.5 pr-0.5 max-h-[220px]">
                  <button
                    type="button"
                    onClick={() => {
                      setColumnFilters((p) => ({ ...p, styleFilter: 'ALL' }));
                      setActivePopover(null);
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left cursor-pointer ${
                      columnFilters.styleFilter === 'ALL'
                        ? 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>All Styles ({distinctStyleCount})</span>
                    {columnFilters.styleFilter === 'ALL' && <Check className="w-3.5 h-3.5" />}
                  </button>
                  {filteredStyleOptions.map((item) => (
                    <button
                      key={item.style}
                      type="button"
                      onClick={() => {
                        setColumnFilters((p) => ({ ...p, styleFilter: item.style }));
                        setActivePopover(null);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left cursor-pointer ${
                        columnFilters.styleFilter === item.style
                          ? 'bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-mono font-semibold truncate">{item.style}</div>
                        <div className="text-[10px] text-slate-400 truncate">{item.brand}</div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-bold ml-2 shrink-0">
                        {item.count}
                      </span>
                    </button>
                  ))}
                  {filteredStyleOptions.length === 0 && (
                    <div className="text-center text-[11px] text-slate-400 py-3">No matching style</div>
                  )}
                </div>
              </div>
            )}

            {(activePopover.key === 'crit' ||
              activePopover.key === 'maj' ||
              activePopover.key === 'min') && (
              <div className="space-y-2">
                {(() => {
                  const key = activePopover.key;
                  const filterProp =
                    key === 'crit' ? 'critFilter' : key === 'maj' ? 'majFilter' : 'minFilter';
                  const sortProp: keyof InspectionReport =
                    key === 'crit'
                      ? 'criticalDefectQuantity'
                      : key === 'maj'
                      ? 'majorDefectQuantity'
                      : 'minorDefectQuantity';
                  const title =
                    key === 'crit'
                      ? 'Critical Defects'
                      : key === 'maj'
                      ? 'Major Defects'
                      : 'Minor Defects';
                  const currentMode = columnFilters[filterProp];
                  return (
                    <>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1">
                          Filter {title}
                        </div>
                        {(['ALL', 'GT_ZERO', 'ZERO'] as DefectCountFilterMode[]).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => {
                              setColumnFilters((p) => ({ ...p, [filterProp]: mode }));
                              setActivePopover(null);
                            }}
                            className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left cursor-pointer ${
                              currentMode === mode
                                ? 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <span>{defectModeLabel(mode)}</span>
                            {currentMode === mode && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-slate-200 dark:border-slate-700 pt-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1">
                          Sort Order
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            handleSort(sortProp, false);
                            setActivePopover(null);
                          }}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left cursor-pointer ${
                            sortField === sortProp && !sortAsc
                              ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span>Highest First (High &rarr; Low)</span>
                          {sortField === sortProp && !sortAsc && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleSort(sortProp, true);
                            setActivePopover(null);
                          }}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left cursor-pointer ${
                            sortField === sortProp && sortAsc
                              ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span>Lowest First (Low &rarr; High)</span>
                          {sortField === sortProp && sortAsc && <Check className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {activePopover.key === 'oql' && (
              <div className="space-y-2">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1">
                    Filter OQL (%)
                  </div>
                  {(['ALL', 'ABOVE_TARGET', 'WITHIN_TARGET', 'ZERO'] as OqlFilterMode[]).map(
                    (mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setColumnFilters((p) => ({ ...p, oqlFilter: mode }));
                          setActivePopover(null);
                        }}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left cursor-pointer ${
                          columnFilters.oqlFilter === mode
                            ? 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>{oqlModeLabel(mode)}</span>
                        {columnFilters.oqlFilter === mode && <Check className="w-3.5 h-3.5" />}
                      </button>
                    )
                  )}
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1">
                    Sort OQL (%)
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleSort('oql', false);
                      setActivePopover(null);
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left cursor-pointer ${
                      sortField === 'oql' && !sortAsc
                        ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>Highest OQL First</span>
                    {sortField === 'oql' && !sortAsc && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSort('oql', true);
                      setActivePopover(null);
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left cursor-pointer ${
                      sortField === 'oql' && sortAsc
                        ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>Lowest OQL First</span>
                    {sortField === 'oql' && sortAsc && <Check className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {activePopover.key === 'result' && (
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  Inspection Result
                </div>
                {['ALL', 'PASSED', 'FAILED', 'PENDING', 'RE-INSPECTION'].map((res) => {
                  const cnt = res === 'ALL' ? filteredReports.length : resultCounts.get(res) || 0;
                  return (
                    <button
                      key={res}
                      type="button"
                      onClick={() => {
                        setColumnFilters((p) => ({ ...p, resultFilter: res }));
                        setActivePopover(null);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left cursor-pointer ${
                        columnFilters.resultFilter === res
                          ? 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{res === 'ALL' ? 'All Results' : res}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{cnt}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>,
          document.body
        )}

      {/* View Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <span>Inspection Report: {selectedReport.reportNumber}</span>
                  {selectedReport.isDemo && (
                    <span className="text-[10px] bg-amber-500/30 text-amber-300 border border-amber-400 px-1.5 py-0.2 rounded font-bold">
                      DEMO DATA
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedReport.buyer} &bull; {selectedReport.orderNumber} ({selectedReport.styleNumber})
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Inspection Date</span>
                  <span className="font-bold text-slate-800">{selectedReport.inspectionDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Inspected Quantity</span>
                  <span className="font-bold text-slate-800">{selectedReport.inspectedQuantity} pcs</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Defects</span>
                  <span className="font-bold text-slate-800">{selectedReport.totalDefectQuantity}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Official OQL</span>
                  <span
                    className={`font-black text-sm ${
                      getReportOql(selectedReport, settings.oqlDecimals) <= settings.targetOql
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {getReportOql(selectedReport, settings.oqlDecimals).toFixed(2)}% ({selectedReport.inspectionResult})
                  </span>
                </div>
              </div>

              {/* Defect List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Recorded Defects Breakdown ({selectedReport.defects?.length || 0})
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2 px-3">Original Description</th>
                        <th className="py-2 px-3">Standard Defect</th>
                        <th className="py-2 px-3">Severity</th>
                        <th className="py-2 px-3 text-right">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedReport.defects || []).map((d) => (
                        <tr key={d.id}>
                          <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                            {d.originalDefectName}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800">
                            {d.standardDefectName}
                          </td>
                          <td className="py-2 px-3">
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

              {/* Audit Trail */}
              {selectedReport.auditLogs && selectedReport.auditLogs.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Audit Logging History
                  </h4>
                  <div className="space-y-1.5">
                    {selectedReport.auditLogs.map((log, i) => (
                      <div
                        key={i}
                        className="text-xs bg-slate-50 border border-slate-200 p-2 rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-slate-800">{log.action}</span> &bull;{' '}
                          <span className="text-slate-500">{log.details}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleString()} by {log.user}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-3 text-right">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Report Modal */}
      {editingReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Edit Inspection: {editingReport.reportNumber}
              </h3>
              <button type="button" onClick={() => setEditingReport(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Inspection Date</label>
                <input
                  type="date"
                  value={editingReport.inspectionDate}
                  onChange={(e) =>
                    setEditingReport({ ...editingReport, inspectionDate: e.target.value })
                  }
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Order Quantity</label>
                <input
                  type="number"
                  value={editingReport.orderQuantity}
                  onChange={(e) =>
                    setEditingReport({
                      ...editingReport,
                      orderQuantity: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Inspected Sample Quantity</label>
                <input
                  type="number"
                  value={editingReport.inspectedQuantity}
                  onChange={(e) =>
                    setEditingReport({
                      ...editingReport,
                      inspectedQuantity: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-500 mb-1">Report Source</label>
                  <select
                    value={getReportSource(editingReport)}
                    onChange={(e) =>
                      setEditingReport({
                        ...editingReport,
                        reportSource: e.target.value as ReportSource,
                      })
                    }
                    className="w-full border rounded-lg p-2 font-bold"
                  >
                    <option value="BSQC">BSQC</option>
                    <option value="AQC">AQC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Stage</label>
                  <select
                    value={editingReport.inspectionType || 'Final'}
                    onChange={(e) =>
                      setEditingReport({
                        ...editingReport,
                        inspectionType: e.target.value,
                      })
                    }
                    className="w-full border rounded-lg p-2 font-bold"
                  >
                    <option value="Final">Final</option>
                    <option value="Inline">Inline</option>
                    <option value="Pre-Final">Pre-Final</option>
                    <option value="Initial">Initial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Floor</label>
                  <select
                    value={normalizeFloorName(editingReport.floor || editingReport.section)}
                    onChange={(e) =>
                      setEditingReport({
                        ...editingReport,
                        floor: e.target.value,
                        section: e.target.value,
                      })
                    }
                    className="w-full border rounded-lg p-2 font-bold"
                  >
                    <option value="SEW-1">SEW-1</option>
                    <option value="SEW-2">SEW-2</option>
                    <option value="SEW-3">SEW-3</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Inspection Result</label>
                <select
                  value={editingReport.inspectionResult}
                  onChange={(e) =>
                    setEditingReport({
                      ...editingReport,
                      inspectionResult: e.target.value as any,
                    })
                  }
                  className="w-full border rounded-lg p-2 font-bold"
                >
                  <option value="PASSED">PASSED</option>
                  <option value="FAILED">FAILED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="RE-INSPECTION">RE-INSPECTION</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setEditingReport(null)}
                className="px-3 py-1.5 border rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-bold"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Simulated Original PDF Document Preview */}
      {previewPdfReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-300 overflow-hidden">
            <div className="bg-slate-800 text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold tracking-wide">
                  Original Document Preview &bull; {previewPdfReport.pdfFileName || 'BESTSELLER_INSPECTION.pdf'}
                </span>
              </div>
              <button onClick={() => setPreviewPdfReport(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document sheet representation */}
            <div className="p-8 overflow-y-auto bg-slate-100 flex-1">
              <div className="bg-white shadow-md border border-slate-200 p-8 max-w-2xl mx-auto space-y-6 text-xs text-slate-800">
                <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-slate-900">
                      BESTSELLER OBSERVED QUALITY AUDIT
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Official Vendor Inspection Certificate &bull; Northern Fashions Ltd.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold">{previewPdfReport.reportNumber}</div>
                    <div className="text-[10px] text-slate-500">Date: {previewPdfReport.inspectionDate}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border border-slate-200 p-3 bg-slate-50 rounded">
                  <div><strong>Buyer:</strong> {previewPdfReport.buyer}</div>
                  <div><strong>Vendor/Factory:</strong> {previewPdfReport.factory}</div>
                  <div><strong>Inspector:</strong> {previewPdfReport.inspector || 'Rifat Chowdhury'}</div>
                  <div><strong>Order / PO #:</strong> {previewPdfReport.poNumber || previewPdfReport.orderNumber}</div>
                  <div><strong>Style #:</strong> {previewPdfReport.styleNumber}</div>
                  <div><strong>Product:</strong> {previewPdfReport.productDescription}</div>
                  <div><strong>Order Quantity:</strong> {previewPdfReport.orderQuantity.toLocaleString()} pcs</div>
                  <div><strong>Inspected Quantity:</strong> {previewPdfReport.inspectedQuantity} pcs</div>
                  <div><strong>Inspection Level:</strong> {previewPdfReport.inspectionLevel}</div>
                </div>

                <div className="border border-slate-200 rounded overflow-hidden">
                  <div className="bg-slate-200 px-3 py-1.5 font-bold text-[11px]">
                    Defect Findings & Severity Classification
                  </div>
                  <table className="w-full text-[11px]">
                    <thead className="bg-slate-100 border-b">
                      <tr>
                        <th className="p-2 text-left">Inspector Description</th>
                        <th className="p-2 text-left">Standard Defect</th>
                        <th className="p-2 text-center">Severity</th>
                        <th className="p-2 text-right">Defect Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(previewPdfReport.defects || []).map((d, i) => (
                        <tr key={i}>
                          <td className="p-2">{d.originalDefectName}</td>
                          <td className="p-2 font-semibold">{d.standardDefectName}</td>
                          <td className="p-2 text-center">{d.severity}</td>
                          <td className="p-2 text-right font-bold">{d.defectQuantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-sky-50 border border-sky-200 p-4 rounded flex justify-between items-center">
                  <div>
                    <div className="font-bold text-sky-950">
                      Calculated Observed Quality Level (OQL)
                    </div>
                    <div className="text-[10px] text-sky-700">
                      Formula: ({getReportOqlDefects(previewPdfReport)} Maj+Min / {previewPdfReport.inspectedQuantity} inspected) &times; 100 | Total Defects: {previewPdfReport.totalDefectQuantity}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-sky-900">
                      {getReportOql(previewPdfReport, settings.oqlDecimals).toFixed(2)}%
                    </div>
                    <div className="font-bold text-xs uppercase text-slate-800">
                      Verdict: {previewPdfReport.inspectionResult}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t flex justify-between text-[10px] text-slate-400">
                  <div>Inspector: QMS Lead Bangladesh</div>
                  <div>Quality Director: Confirmed</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 border-t border-slate-200 p-3 text-right">
              <button
                onClick={() => setPreviewPdfReport(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Report In-UI Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Inspection Report?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to permanently remove report{' '}
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {deleteTarget.reportNumber}
                </span>{' '}
                ({deleteTarget.orderNumber})? This will update all OQL stats and remove it from Firestore.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetId = deleteTarget.id;
                  setDeleteTarget(null);
                  await deleteInspectionReport(targetId);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Yes, Delete Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset to Zero In-UI Confirmation Modal */}
      {showWipeConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Reset App to Zero (Clean Slate)?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This will wipe all {filteredReports.length} inspection reports, defect records, and audit logs so you can start completely fresh from 0. This cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowWipeConfirm(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleWipeAll}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Yes, Reset All to Zero
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Duplicate Inspection & Cleanup Modal */}
      {showDuplicatesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Duplicate Inspection Reports ({duplicateIds.length})
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Inspect duplicate copies in the table or safely remove exact duplicates.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDuplicatesModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50 dark:bg-slate-950/60 text-xs">
              {duplicateReportsList.map((dup) => (
                <div
                  key={dup.id}
                  className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 dark:text-slate-100 truncate">
                      {dup.reportNumber}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {dup.inspectionDate} &bull; Style {dup.styleNumber} &bull; {getReportStageLabel(dup)}
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Duplicate
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setColumnFilters((prev) => ({ ...prev, duplicatesOnly: true }));
                  setShowDuplicatesModal(false);
                }}
                className="px-3 py-1.5 rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-xs font-bold hover:bg-sky-100 cursor-pointer"
              >
                Show Duplicates in Table
              </button>
              <button
                type="button"
                onClick={() => setShowDuplicatesModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowDuplicatesModal(false);
                  await removeDuplicateReports();
                }}
                className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Delete {duplicateIds.length} Duplicate Copies
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
