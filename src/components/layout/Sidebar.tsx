import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  BarChart3,
  FileUp,
  Database,
  TrendingUp,
  PieChart,
  Layers,
  ShieldAlert,
  Activity,
  FileSpreadsheet,
  Settings as SettingsIcon,
  Factory,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed = false }) => {
  const { activeTab, setActiveTab, reports, capas, logout, theme, toggleTheme } = useApp();

  const openCapaCount = capas.filter((c) => c.capaStatus === 'Open' || c.capaStatus === 'In Progress').length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'inspection_summary',
      label: 'Inspection Summary & Records',
      icon: BarChart3,
      badge: reports.length > 0 ? reports.length.toString() : null,
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
    },
    {
      id: 'upload',
      label: 'PDF Report Upload',
      icon: FileUp,
      badge: 'Auto OCR',
    },
    {
      id: 'database',
      label: 'Inspection Database',
      icon: Database,
      badge: reports.length.toString(),
    },
    {
      id: 'oql_analytics',
      label: 'OQL Analytics',
      icon: TrendingUp,
      badge: 'Observed',
    },
    {
      id: 'defect_analytics',
      label: 'Defect Analysis',
      icon: PieChart,
      badge: 'Pareto',
    },
    {
      id: 'defect_master',
      label: 'Defect Master',
      icon: Layers,
      badge: null,
    },
    {
      id: 'capa',
      label: 'RCA & CAPA',
      icon: ShieldAlert,
      badge: openCapaCount > 0 ? `${openCapaCount} Active` : null,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'monitoring',
      label: 'Monitoring & Effectiveness',
      icon: Activity,
      badge: null,
    },
    {
      id: 'reports',
      label: 'Reports & Export',
      icon: FileSpreadsheet,
      badge: 'Excel/PDF',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: SettingsIcon,
      badge: null,
    },
  ];

  return (
    <aside
      className={`bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Factory / Company Identity */}
      <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/40">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center p-1 shadow-md shrink-0">
            <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
              <path d="M 12 28 C 12 18 20 12 28 12 C 24 18 20 22 12 28 Z" fill="#84cc16" />
              <path d="M 28 12 C 28 22 20 28 12 28 C 16 22 20 18 28 12 Z" fill="#94a3b8" />
              <path d="M 16 24 C 20 20 24 16 26 14" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h2 className="text-xs font-black text-white tracking-wider truncate uppercase">
                NORTHERN FASHIONS LTD.
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[10px] text-slate-400 truncate font-semibold">
                  QMS - Quality Management System
                </p>
                <div className="h-1 w-3 bg-lime-500 rounded-full shrink-0" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {!collapsed && (
          <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Core QMS Modules
          </div>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center ${
                collapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'
              } rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-300'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!collapsed && (
                <div className="flex items-center gap-1">
                  {item.badge && (
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${
                        item.badgeColor ||
                        (isActive
                          ? 'bg-sky-700/80 text-sky-100 border-sky-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700')
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-sky-200" />}
                </div>
              )}
            </button>
          );
        })}
      </div>



      {/* Buyer Compliance Badge */}
      {!collapsed && (
        <div className="p-3 m-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[11px]">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400">Buyer Protocol</span>
            <span className="text-[9px] bg-slate-700 text-sky-300 px-1 py-0.5 rounded">OQL Target 4.5%</span>
          </div>
          <p className="text-white font-semibold leading-tight">BESTSELLER Inspection Standards</p>
          <p className="text-[10px] text-slate-400 mt-1 leading-snug">
            Observed Quality Level (OQL) = (Defects ÷ Inspected) × 100
          </p>
        </div>
      )}

      {/* Day / Night Theme Toggle in Sidebar */}
      <div className="p-2 border-t border-slate-800">
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Day (Light) Mode' : 'Switch to Night (Dark) Mode'}
          className={`w-full flex items-center ${
            collapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'
          } rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer`}
        >
          <div className="flex items-center gap-2.5">
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Moon className="w-4 h-4 text-sky-400 shrink-0" />
            )}
            {!collapsed && (
              <span>{theme === 'dark' ? 'Day Mode' : 'Night Mode'}</span>
            )}
          </div>
          {!collapsed && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-bold">
              {theme === 'dark' ? 'Day' : 'Night'}
            </span>
          )}
        </button>
      </div>

      {/* Sign Out Button */}
      <div className="p-2 border-t border-slate-800/60">
        <button
          onClick={logout}
          title="Sign Out to QMS Portal"
          className={`w-full flex items-center ${
            collapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2'
          } rounded-lg text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-950/60 border border-rose-900/40 transition-colors cursor-pointer`}
        >
          <LogOut className="w-4 h-4 shrink-0 text-rose-400" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};

