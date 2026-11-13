import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Search,
  Layers,
  PieChart as PieIcon,
  Filter,
  ExternalLink,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LabelList,
} from 'recharts';
import { MASTER_DEFECT_23_CATEGORIES } from '../../data/defectMasterData';

export const DefectAnalyticsView: React.FC = () => {
  const { filteredReports, setFilters, setActiveTab, addNotification, filters } = useApp();

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    Se: true,
    Ne: true,
    Cle: true,
    Fa: true,
  });
  const [searchTerm, setSearchTerm] = useState('');

  const toggleCategory = (code: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    MASTER_DEFECT_23_CATEGORIES.forEach((c) => {
      all[c.code] = true;
    });
    setExpandedCategories(all);
  };

  const collapseAll = () => {
    setExpandedCategories({});
  };

  // Direct Power BI Link to Main Dashboard
  const handleLinkToDashboard = (defectIdentifier: string, label: string) => {
    setFilters((prev) => ({
      ...prev,
      defectGroup: defectIdentifier,
    }));
    setActiveTab('dashboard');
    addNotification('info', `Filtered Dashboard for "${label}". Viewing linked analytics.`);
  };

  // Compile statistics for each of the 23 Master Defect Categories and their subDefects
  const categoryStats = useMemo(() => {
    const stats = MASTER_DEFECT_23_CATEGORIES.map((cat) => {
      let totalQty = 0;
      let inspectionCountSet = new Set<string>();

      const subStats = cat.subDefects.map((sub) => {
        let subQty = 0;
        let subInspectionSet = new Set<string>();

        filteredReports.forEach((r) => {
          r.defects?.forEach((d) => {
            const rawName = (d.originalDefectName || '').toLowerCase();
            const stdName = (d.standardDefectName || '').toLowerCase();
            const subCode = sub.code.toLowerCase();
            const subName = sub.name.toLowerCase();

            if (
              rawName.includes(subCode) ||
              rawName.includes(subName) ||
              stdName.includes(subName) ||
              d.defectGroupId?.toLowerCase() === `dg-${cat.code.toLowerCase()}` ||
              d.defectGroupId?.toLowerCase() === cat.name.toLowerCase()
            ) {
              const qty = Number(d.defectQuantity) || 1;
              subQty += qty;
              subInspectionSet.add(r.id);
            }
          });
        });

        totalQty += subQty;
        subInspectionSet.forEach((id) => inspectionCountSet.add(id));

        return {
          ...sub,
          quantityAffected: subQty,
          inspectionsWithDefects: subInspectionSet.size,
        };
      });

      return {
        ...cat,
        totalQuantityAffected: totalQty,
        totalInspectionsWithDefects: inspectionCountSet.size,
        subStats,
      };
    });

    return stats;
  }, [filteredReports]);

  // Filter categories by search and sort by highest defect count descending
  const filteredCategoryStats = useMemo(() => {
    let list = categoryStats;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.subDefects.some((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
      );
    }
    // Auto-sort by frequency: category with highest defects automatically floats to row #1
    return [...list].sort((a, b) => b.totalQuantityAffected - a.totalQuantityAffected);
  }, [categoryStats, searchTerm]);

  // Data for the Right Chart: 100% Dynamic Parallel Counting from Left Table (No dummy data)
  const chartData = useMemo(() => {
    return categoryStats
      .filter((c) => c.totalQuantityAffected > 0)
      .map((c) => ({
        name: c.name,
        code: c.code,
        count: c.totalQuantityAffected,
        color: c.color,
      }))
      .sort((a, b) => b.count - a.count);
  }, [categoryStats]);

  const totalDefectSum = chartData.reduce((s, c) => s + c.count, 0);

  return (
    <div className="p-4 space-y-4 max-w-[1700px] mx-auto text-slate-800 dark:text-slate-100">
      {/* Top Banner matching Excel Mockup */}
      <div className="bg-[#c6e0b4] dark:bg-emerald-950/70 border border-[#a9d08e] dark:border-emerald-800 px-4 py-2.5 rounded-t-md flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div>
          <h1 className="text-3xl font-black text-[#dc2626] dark:text-red-500 tracking-wide font-sans">
            OQL &amp; Defects Analysis
          </h1>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            23 Master Defect Categories &amp; Frequency Breakdown
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search 23 categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-md text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none"
            />
          </div>
          <button
            onClick={expandAll}
            className="px-2.5 py-1.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-2.5 py-1.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Main Grid: Left 23 Categories Table | Right Defect Column Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (7 cols): Main Defect Category Name Accordion Table */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs">
          <div className="bg-sky-900 text-white font-black text-sm py-2 px-3 flex items-center justify-between">
            <span>Main Defect Category Name (23 Master Classifications)</span>
            <span className="text-[11px] bg-sky-800 text-sky-200 px-2 py-0.5 rounded">
              {filteredCategoryStats.length} Categories
            </span>
          </div>

          <div className="overflow-x-auto max-h-[720px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-b border-slate-300 dark:border-slate-700 text-[11px] font-black uppercase z-10">
                <tr>
                  <th className="p-2.5 w-12 text-center">Code</th>
                  <th className="p-2.5">Category &amp; Individual Defect Details</th>
                  <th className="p-2.5 text-center w-28">Inspections</th>
                  <th className="p-2.5 text-center w-28">Qty Affected</th>
                  <th className="p-2.5 text-center w-36">Link to Dashbord</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredCategoryStats.map((cat) => {
                  const isExpanded = !!expandedCategories[cat.code];
                  return (
                    <React.Fragment key={cat.code}>
                      {/* Main Category Row */}
                      <tr className="bg-slate-50/80 dark:bg-slate-800/40 hover:bg-sky-50 dark:hover:bg-slate-800 font-bold transition-colors select-none">
                        <td
                          onClick={() => toggleCategory(cat.code)}
                          className="p-2.5 text-center cursor-pointer"
                        >
                          <span
                            className="inline-flex items-center justify-center w-7 h-7 rounded text-xs font-black text-white shadow-2xs"
                            style={{ backgroundColor: cat.color }}
                          >
                            {cat.code}
                          </span>
                        </td>
                        <td
                          onClick={() => toggleCategory(cat.code)}
                          className="p-2.5 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-sky-600 shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <div>
                              <div className="text-slate-900 dark:text-slate-100 font-extrabold text-sm">
                                {cat.name}
                              </div>
                              <div className="text-[10px] text-slate-500 font-normal">
                                {cat.description} ({cat.subDefects.length} sub-defects)
                              </div>
                            </div>
                          </div>
                        </td>
                        <td
                          onClick={() => toggleCategory(cat.code)}
                          className="p-2.5 text-center font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          {cat.totalInspectionsWithDefects}
                        </td>
                        <td
                          onClick={() => toggleCategory(cat.code)}
                          className="p-2.5 text-center cursor-pointer"
                        >
                          <span
                            className={`font-black px-2 py-0.5 rounded text-xs ${
                              cat.totalQuantityAffected > 0
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                : 'text-slate-400'
                            }`}
                          >
                            {cat.totalQuantityAffected}
                          </span>
                        </td>
                        <td className="p-2.5 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleLinkToDashboard(cat.name, cat.name)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-900 border border-sky-300 dark:border-sky-800 font-bold text-[10px] transition-colors cursor-pointer"
                            title={`Filter Dashboard for ${cat.name}`}
                          >
                            <ExternalLink className="w-3 h-3" />
                            Link to Dashbord
                          </button>
                        </td>
                      </tr>

                      {/* Sub-Defect Accordion Rows */}
                      {isExpanded &&
                        cat.subStats.map((sub) => (
                          <tr
                            key={sub.code}
                            className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-[11px]"
                          >
                            <td className="p-2 pl-6 text-center font-mono font-bold text-slate-500">
                              {sub.code}
                            </td>
                            <td className="p-2 pl-8">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {sub.name}
                              </span>
                              <span
                                className={`ml-2 text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                                  sub.defaultSeverity === 'Critical'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : sub.defaultSeverity === 'Major'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-sky-50 text-sky-700 border-sky-200'
                                }`}
                              >
                                {sub.defaultSeverity}
                              </span>
                            </td>
                            <td className="p-2 text-center text-slate-600 dark:text-slate-400">
                              {sub.inspectionsWithDefects}
                            </td>
                            <td className="p-2 text-center font-bold text-slate-800 dark:text-slate-200">
                              <span className={sub.quantityAffected > 0 ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-slate-400'}>
                                {sub.quantityAffected}
                              </span>
                            </td>
                            <td className="p-2 text-center whitespace-nowrap">
                              <button
                                onClick={() => handleLinkToDashboard(sub.name, `${sub.code}: ${sub.name}`)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 font-semibold text-[10px] transition-colors cursor-pointer"
                                title={`Filter Dashboard specifically for ${sub.name}`}
                              >
                                <ExternalLink className="w-2.5 h-2.5 text-sky-600" />
                                Link Defect
                              </button>
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (5 cols): Defect Column Chart - 100% Dynamic Parallel Sync with Left Table */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden shadow-xs flex flex-col">
          <div className="bg-sky-900 text-white font-black text-sm py-2 px-3 text-center uppercase tracking-wider flex items-center justify-between">
            <span className="w-full text-center">Parallel Defect Category Chart (Live Sync)</span>
          </div>
          <div className="p-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                Paralleled live volume &amp; percentage with left table counting
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                <Zap className="w-3 h-3 text-emerald-600" />
                Live Parallel
              </span>
            </div>

            <div className="h-96 w-full">
              {chartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 mb-2">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No Defect Data in Current Slice
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                    Upload inspection reports (PDF) or adjust filters to generate parallel live category bars.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 25, right: 15, left: -10, bottom: 45 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis
                      dataKey="name"
                      interval={0}
                      angle={-25}
                      textAnchor="end"
                      tick={{ fontSize: 10, fontWeight: 'bold' }}
                      height={55}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(val: any) => [
                        `${val} defects (${totalDefectSum > 0 ? ((Number(val) / totalDefectSum) * 100).toFixed(1) : 0}%)`,
                        'Count',
                      ]}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#0284c7'} />
                      ))}
                      <LabelList
                        dataKey="count"
                        position="top"
                        formatter={(val: any) => {
                          const num = Number(val) || 0;
                          const pct = totalDefectSum > 0 ? Math.round((num / totalDefectSum) * 100) : 0;
                          return `${num} (${pct}%)`;
                        }}
                        style={{ fontSize: 10, fontWeight: 'bold', fill: '#0f172a' }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Quick Summary Pill Row */}
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Total Categories</div>
                <div className="text-lg font-black text-slate-900 dark:text-white">23</div>
              </div>
              <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Active Defects</div>
                <div className="text-lg font-black text-rose-600 dark:text-rose-400">
                  {totalDefectSum}
                </div>
              </div>
              <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Top Defect Group</div>
                <div className="text-sm font-black text-sky-700 dark:text-sky-400 truncate">
                  {chartData[0]?.name || 'None Recorded'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
