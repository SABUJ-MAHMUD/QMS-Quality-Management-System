import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Boxes,
  PackageCheck,
  Search,
  AlertOctagon,
  TrendingDown,
  TrendingUp,
  Percent,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart as PieIcon,
  Sparkles,
  Maximize2,
  Minimize2,
  Filter,
  RotateCcw,
  CheckSquare,
  Square,
  Layers,
  ShieldAlert,
  ArrowRight,
  Calendar,
  Tag,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { calculateReportOql } from '../../utils/oqlCalculator';

const COLORS = [
  '#0284c7', // Sky blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Rose red
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

export const DashboardView: React.FC = () => {
  const { reports, settings, setActiveTab, defectGroups } = useApp();

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.warn('Exit fullscreen failed:', err);
        });
      }
    }
  };

  // 1. Month Slicer state
  // Available unique months from all reports sorted descending
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      if (r.inspectionDate) {
        set.add(r.inspectionDate.slice(0, 7)); // YYYY-MM
      }
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [reports]);

  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  // Reports filtered by selected month
  const monthFilteredReports = useMemo(() => {
    if (selectedMonth === 'ALL') return reports;
    return reports.filter((r) => r.inspectionDate.startsWith(selectedMonth));
  }, [reports, selectedMonth]);

  // 2. Multi-Select Style Number Slicer
  // Styles available in the selected month
  const availableStylesInMonth = useMemo(() => {
    const map = new Map<string, { styleNumber: string; styleName: string; brand: string }>();
    monthFilteredReports.forEach((r) => {
      const sNum = r.styleNumber || 'Unknown';
      if (!map.has(sNum)) {
        map.set(sNum, {
          styleNumber: sNum,
          styleName: r.styleName || r.productDescription || sNum,
          brand: r.brand || r.buyer || 'ONLY&SONS',
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.styleNumber.localeCompare(b.styleNumber));
  }, [monthFilteredReports]);

  // Multi-selected style numbers (empty array means ALL styles selected)
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);

  // When month changes, reset or clean selectedStyles that are no longer present
  useEffect(() => {
    if (selectedStyles.length > 0) {
      const availableSet = new Set(availableStylesInMonth.map((s) => s.styleNumber));
      const validSelected = selectedStyles.filter((s) => availableSet.has(s));
      if (validSelected.length !== selectedStyles.length) {
        setSelectedStyles(validSelected);
      }
    }
  }, [availableStylesInMonth]);

  const toggleStyleSelection = (styleNum: string) => {
    setSelectedStyles((prev) => {
      if (prev.includes(styleNum)) {
        return prev.filter((s) => s !== styleNum);
      } else {
        return [...prev, styleNum];
      }
    });
  };

  const handleSelectAllStyles = () => {
    if (selectedStyles.length === availableStylesInMonth.length) {
      setSelectedStyles([]);
    } else {
      setSelectedStyles(availableStylesInMonth.map((s) => s.styleNumber));
    }
  };

  const handleResetFilters = () => {
    setSelectedMonth('ALL');
    setSelectedStyles([]);
  };

  // 3. Final Active Filtered Reports (Slices across Month & Selected Styles)
  const activeReports = useMemo(() => {
    return monthFilteredReports.filter((r) => {
      if (selectedStyles.length === 0) return true;
      return selectedStyles.includes(r.styleNumber);
    });
  }, [monthFilteredReports, selectedStyles]);

  // Active Defect Group filter tab for drilling down into individual defects
  const [selectedGroupTab, setSelectedGroupTab] = useState<string>('ALL');

  // 4. Power BI Aggregated Metrics for the slice
  const totalReportsCount = activeReports.length;
  const totalOrdersCount = new Set(
    activeReports.flatMap((r) => r.orderNumber.split(/\s*[\+,]\s*/).map((s) => s.trim()).filter(Boolean))
  ).size;
  const totalOrderQty = activeReports.reduce((s, r) => s + (Number(r.orderQuantity) || 0), 0);
  const totalInspectedQty = activeReports.reduce((s, r) => s + (Number(r.inspectedQuantity) || 0), 0);
  const totalDefectsCount = activeReports.reduce((s, r) => s + (Number(r.totalDefectQuantity) || 0), 0);
  const criticalDefects = activeReports.reduce((s, r) => s + (Number(r.criticalDefectQuantity) || 0), 0);
  const majorDefects = activeReports.reduce((s, r) => s + (Number(r.majorDefectQuantity) || 0), 0);
  const minorDefects = activeReports.reduce((s, r) => s + (Number(r.minorDefectQuantity) || 0), 0);

  const aggregatedOql = totalInspectedQty > 0
    ? Number(((totalDefectsCount / totalInspectedQty) * 100).toFixed(2))
    : 0;

  const passedReports = activeReports.filter((r) => r.inspectionResult === 'PASSED').length;
  const passRate = totalReportsCount > 0 ? Number(((passedReports / totalReportsCount) * 100).toFixed(1)) : 100;

  // 5. Defect Group Analytics
  // Mapping defectGroupId -> groupName
  const groupNameLookup = useMemo(() => {
    const map = new Map<string, string>();
    defectGroups.forEach((g) => map.set(g.id, g.groupName));
    map.set('dg-1', 'Stitching & Workmanship');
    map.set('dg-2', 'Cleanness');
    map.set('dg-3', 'Measurement');
    map.set('dg-4', 'Finishing & Pressing');
    map.set('dg-5', 'Trims & Accessories');
    map.set('dg-6', 'Fabric & Material');
    return map;
  }, [defectGroups]);

  // Aggregate defects by Group for active slice
  const defectGroupStats = useMemo(() => {
    const groupMap = new Map<string, { groupName: string; quantity: number }>();

    activeReports.forEach((r) => {
      r.defects?.forEach((d) => {
        const gId = d.defectGroupId || 'dg-2';
        const gName = groupNameLookup.get(gId) || d.defectGroupId || 'Cleanness';
        const cur = groupMap.get(gId) || { groupName: gName, quantity: 0 };
        cur.quantity += Number(d.defectQuantity) || 0;
        groupMap.set(gId, cur);
      });
    });

    const list = Array.from(groupMap.entries()).map(([groupId, data]) => {
      const percentage = totalDefectsCount > 0
        ? Number(((data.quantity / totalDefectsCount) * 100).toFixed(1))
        : 0;
      return {
        groupId,
        groupName: data.groupName,
        quantity: data.quantity,
        percentage,
      };
    });

    return list.sort((a, b) => b.quantity - a.quantity);
  }, [activeReports, groupNameLookup, totalDefectsCount]);

  // 6. Individual Defect Names Analytics
  const individualDefectStats = useMemo(() => {
    const defMap = new Map<
      string,
      {
        defectName: string;
        standardName: string;
        groupName: string;
        groupId: string;
        severity: string;
        quantity: number;
      }
    >();

    activeReports.forEach((r) => {
      r.defects?.forEach((d) => {
        const gId = d.defectGroupId || 'dg-2';
        const gName = groupNameLookup.get(gId) || 'Cleanness';
        const key = d.originalDefectName || d.standardDefectName;
        const cur = defMap.get(key) || {
          defectName: key,
          standardName: d.standardDefectName || key,
          groupName: gName,
          groupId: gId,
          severity: d.severity || 'Major',
          quantity: 0,
        };
        cur.quantity += Number(d.defectQuantity) || 0;
        defMap.set(key, cur);
      });
    });

    let list = Array.from(defMap.values()).map((d) => {
      const percentage = totalDefectsCount > 0
        ? Number(((d.quantity / totalDefectsCount) * 100).toFixed(1))
        : 0;
      return {
        ...d,
        percentage,
      };
    });

    if (selectedGroupTab !== 'ALL') {
      list = list.filter((d) => d.groupId === selectedGroupTab || d.groupName === selectedGroupTab);
    }

    return list.sort((a, b) => b.quantity - a.quantity);
  }, [activeReports, groupNameLookup, totalDefectsCount, selectedGroupTab]);

  return (
    <div
      className={`p-4 sm:p-6 space-y-5 max-w-7xl mx-auto transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 overflow-y-auto p-6 max-w-none' : ''
      }`}
    >
      {/* Power BI Header & Fullscreen Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-white shadow-xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Quality Management System Dashboard
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 uppercase tracking-wider">
                  Power BI Interactive View
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Real-time Observed Quality Level &bull; Sliced by Month, Style &amp; Defect Classification
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
            title={isFullscreen ? 'Exit Full Screen' : 'View Full Screen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />}
            <span>{isFullscreen ? 'Exit Full Screen' : 'Full Screen'}</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Upload PDF
          </button>
        </div>
      </div>

      {/* POWER BI INTERACTIVE SLICERS PANEL (User Requirement 2) */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Interactive Dashboard Slicers (Power BI Engine)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {(selectedMonth !== 'ALL' || selectedStyles.length > 0) && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-amber-400" />
                Reset All Slicers
              </button>
            )}
            <span className="text-xs text-slate-400">
              Active Scope: <strong className="text-white">{activeReports.length}</strong> Reports
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* SLICER 1: Month Selector (User Requirement 2: "এবং যদি মাস সিলেক্ট করি শুধু যে মাস সিলেক্ট করব শুধু সেই মাসের ডেটা এন্ট্রি হয়েছে সেটাই ভিজিবল হবে") */}
          <div className="lg:col-span-4 space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              1. Inspection Month Slicer:
            </label>
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 cursor-pointer"
              >
                <option value="ALL">All Inspection Months (Complete Archive)</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m === '2026-11' ? 'November 2026 (Active Inspection)' : m === '2026-10' ? 'October 2026' : m}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Selecting a month locks all metrics and filters the Style Slicer to only styles audited in that month.
            </p>
          </div>

          {/* SLICER 2: Multi-Select Style Number Slicer (User Requirement 2: "একসাথে যেন একাধিক স্টাইল সিলেক্ট করা যায়") */}
          <div className="lg:col-span-8 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                2. Style Number Multi-Select Slicer ({availableStylesInMonth.length} Available):
              </label>
              <button
                type="button"
                onClick={handleSelectAllStyles}
                className="text-[11px] text-sky-400 hover:text-sky-300 font-bold hover:underline cursor-pointer"
              >
                {selectedStyles.length === availableStylesInMonth.length ? 'Clear Selection' : 'Select All Styles'}
              </button>
            </div>

            {/* Slicer Pill Chips */}
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
              {availableStylesInMonth.length === 0 ? (
                <div className="text-xs text-slate-400 p-2">No styles recorded for selected month.</div>
              ) : (
                availableStylesInMonth.map((s) => {
                  const isSelected = selectedStyles.includes(s.styleNumber);
                  return (
                    <button
                      key={s.styleNumber}
                      type="button"
                      onClick={() => toggleStyleSelection(s.styleNumber)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400 font-bold'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80'
                      }`}
                    >
                      {isSelected ? <CheckSquare className="w-3.5 h-3.5 text-white" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
                      <span>{s.styleNumber}</span>
                      <span className="text-[10px] px-1 py-0.2 rounded bg-black/30 font-normal truncate max-w-[140px]">
                        {s.brand} &bull; {s.styleName}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>
                {selectedStyles.length === 0
                  ? 'Showing all styles in month'
                  : `Filtering to ${selectedStyles.length} selected style(s)`}
              </span>
              {selectedStyles.length > 0 && (
                <span className="text-emerald-400 font-bold">
                  Active Styles: {selectedStyles.join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI SCORECARD (Power BI Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Audits</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{totalReportsCount}</div>
          <span className="text-[9px] text-slate-400">Reports in slice</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Order Qty</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{totalOrderQty.toLocaleString()}</div>
          <span className="text-[9px] text-slate-400">Total units</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Inspected</span>
          <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{totalInspectedQty.toLocaleString()}</div>
          <span className="text-[9px] text-slate-400">Sample scope</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Defects</span>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{totalDefectsCount}</div>
          <span className="text-[9px] text-slate-400">Defect items</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Observed OQL</span>
          <div className="text-xl font-black text-sky-600 dark:text-sky-400 mt-0.5">{aggregatedOql.toFixed(2)}%</div>
          <span className={`text-[9px] font-bold ${aggregatedOql <= settings.targetOql ? 'text-emerald-600' : 'text-rose-600'}`}>
            Target: {settings.targetOql}%
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Critical</span>
          <div className="text-xl font-black text-rose-600 mt-0.5">{criticalDefects}</div>
          <span className="text-[9px] text-slate-400">Severe defects</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Major</span>
          <div className="text-xl font-black text-amber-600 mt-0.5">{majorDefects}</div>
          <span className="text-[9px] text-slate-400">Functional defects</span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Minor</span>
          <div className="text-xl font-black text-sky-600 mt-0.5">{minorDefects}</div>
          <span className="text-[9px] text-slate-400">Visual defects</span>
        </div>
      </div>

      {/* VISUAL SECTION 1: DEFECT GROUPS (COLUMN CHART + PIE CHART + PERCENTAGES) */}
      {/* User Requirement 2: "ডিফেক্ট গ্রুপ শো করার পাশাপাশি ইনডিভিজিউয়াল ডিফেক্টের নাম গুলো শো করবে, যেসন – Group Cleanness এর প্রতি কলাম চার্ট, পাই চার্ট ও এর ডিফেক্ট কোয়ানটিটি ও পান্সেটেজও শো করবে।" */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-600" />
              Defect Group Analysis (Column &amp; Pie Chart with Quantities &amp; %)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aggregated defect distribution across standard manufacturing groups (Cleanness, Workmanship, Trims, etc.)
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            {defectGroupStats.length} Defect Groups Detected
          </span>
        </div>

        {defectGroupStats.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-400">
            No defect groups found in the selected style/month slice.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Column Chart */}
            <div className="lg:col-span-7 h-72">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Defect Groups &bull; Column Chart (Quantity &amp; Count)
              </h4>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={defectGroupStats} margin={{ top: 10, right: 15, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis
                    dataKey="groupName"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    angle={-15}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(val: any, name: any, item: any) => [
                      `${val} defects (${item.payload.percentage}%)`,
                      'Quantity',
                    ]}
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="quantity" fill="#0284c7" radius={[6, 6, 0, 0]}>
                    {defectGroupStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart with Percentages */}
            <div className="lg:col-span-5 h-72 flex flex-col items-center justify-center">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 self-start">
                Group Distribution &bull; Pie Chart (%)
              </h4>
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={defectGroupStats}
                    dataKey="quantity"
                    nameKey="groupName"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={45}
                    label={(entry: any) => `${entry.groupName || entry.name}: ${entry.percentage || ''}%`}
                    labelLine={false}
                  >
                    {defectGroupStats.map((entry, index) => (
                      <Cell key={`pie-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any, item: any) => [
                      `${val} items (${item.payload.percentage}%)`,
                      name,
                    ]}
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Group Cards Grid with Quantities and Percentages */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {defectGroupStats.map((g, idx) => (
            <div
              key={g.groupId}
              onClick={() => setSelectedGroupTab(selectedGroupTab === g.groupId ? 'ALL' : g.groupId)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                selectedGroupTab === g.groupId
                  ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 ring-2 ring-sky-400'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-sky-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-[10px] font-bold text-slate-500">{g.percentage}%</span>
              </div>
              <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{g.groupName}</h5>
              <div className="text-base font-black text-sky-600 dark:text-sky-400 mt-0.5">
                {g.quantity} <span className="text-[10px] font-normal text-slate-500">defects</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* VISUAL SECTION 2: INDIVIDUAL DEFECT NAMES BREAKDOWN */}
      {/* User Requirement 2: "ডিফেক্ট গ্রুপ শো করার পাশাপাশি ইনডিভিজিউয়াল ডিফেক্টের নাম গুলো শো করবে, যেসন – Group Cleanness এর প্রতি কলাম চার্ট, পাই চার্ট ও এর ডিফেক্ট কোয়ানটিটি ও পান্সেটেজও শো করবে।" */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-600" />
              Individual Defect Names Breakdown ({individualDefectStats.length} Unique Defect Types)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detailed breakdown of specific defect names (e.g. Cle-5 Oil Spot, Cle-3 Uncut Thread, SL-1 Dirt/Stain) with exact quantities &amp; percentages.
            </p>
          </div>

          {/* Group Drill-down Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setSelectedGroupTab('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedGroupTab === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              All Defect Names
            </button>
            {defectGroupStats.map((g) => (
              <button
                key={g.groupId}
                onClick={() => setSelectedGroupTab(g.groupId)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  selectedGroupTab === g.groupId
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                {g.groupName} ({g.quantity})
              </button>
            ))}
          </div>
        </div>

        {individualDefectStats.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No defect records found for this selection.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Defect Column Chart */}
            <div className="h-64">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Individual Defect Frequencies &bull; Column Chart
              </h4>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={individualDefectStats} margin={{ top: 10, right: 15, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                  <XAxis
                    dataKey="standardName"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    angle={-15}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(val: any, name: any, item: any) => [
                      `${val} items (${item.payload.percentage}%)`,
                      item.payload.defectName,
                    ]}
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="quantity" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Individual Defect Data Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Defect Name (Audited Text)</th>
                    <th className="py-2.5 px-3">Group</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3 text-right">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Share (%)</th>
                    <th className="py-2.5 px-3 text-center">Visual Weight</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {individualDefectStats.map((d, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {d.defectName}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-semibold text-[10px] border border-sky-200 dark:border-sky-800">
                          {d.groupName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.severity === 'Critical'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : d.severity === 'Major'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                          }`}
                        >
                          {d.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900 dark:text-white">
                        {d.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-sky-600 dark:text-sky-400">
                        {d.percentage}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="w-24 bg-slate-200 dark:bg-slate-700 h-2 rounded-full mx-auto overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${Math.min(100, d.percentage * 2)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* VISUAL SECTION 3: STYLE AUDIT MATRIX */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Boxes className="w-4 h-4 text-sky-600" />
              Audited Styles in Active Slice ({activeReports.length} Reports)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Per-style observed quality performance and compliance with BESTSELLER benchmark.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">Brand</th>
                <th className="py-2.5 px-3">Style Number</th>
                <th className="py-2.5 px-3">Style Name</th>
                <th className="py-2.5 px-3">Order (NOF)</th>
                <th className="py-2.5 px-3 text-right">Order Qty</th>
                <th className="py-2.5 px-3 text-right">Inspected</th>
                <th className="py-2.5 px-3 text-right">Defects</th>
                <th className="py-2.5 px-3 text-right">OQL (%)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {activeReports.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                  <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">
                    {r.brand || r.buyer || 'ONLY&SONS'}
                  </td>
                  <td className="py-2 px-3 font-semibold text-sky-700 dark:text-sky-400">
                    {r.styleNumber}
                  </td>
                  <td className="py-2 px-3 text-slate-600 dark:text-slate-300 truncate max-w-xs">
                    {r.styleName || r.productDescription}
                  </td>
                  <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                    <div className="flex flex-wrap gap-1 max-w-xs">
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
                        <span className="font-mono font-semibold">{r.orderNumber}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-400">
                    {r.orderQuantity.toLocaleString()}
                  </td>
                  <td className="py-2 px-3 text-right font-medium text-slate-800 dark:text-slate-200">
                    {r.inspectedQuantity}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                    {r.totalDefectQuantity}
                  </td>
                  <td className="py-2 px-3 text-right font-black">
                    <span className={r.oql <= settings.targetOql ? 'text-emerald-600' : 'text-rose-600'}>
                      {r.oql.toFixed(2)}%
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.inspectionResult === 'PASSED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {r.inspectionResult}
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
