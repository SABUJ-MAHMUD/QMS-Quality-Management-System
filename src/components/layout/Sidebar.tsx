import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  FileUp,
  TrendingUp,
  Database,
  ShieldAlert,
  FileSpreadsheet,
  Settings as SettingsIcon,
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
  const { activeTab, setActiveTab, reports, logout, theme, toggleTheme } = useApp();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashbord',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'upload',
      label: 'PDF Report Upload',
      icon: FileUp,
      badge: null,
    },
    {
      id: 'defect_analytics',
      label: 'OQL & Defects Analysis',
      icon: TrendingUp,
      badge: null,
    },
    {
      id: 'database',
      label: 'Inspection Database',
      icon: Database,
      badge: reports.length > 0 ? reports.length.toString() : null,
    },
    {
      id: 'capa',
      label: 'RCA & CAPA',
      icon: ShieldAlert,
      badge: null,
    },
    {
      id: 'reports',
      label: 'Report & Export',
      icon: FileSpreadsheet,
      badge: 'Excel / PPT / PDF',
      badgeColor: 'bg-sky-600 text-white border-sky-400 font-bold',
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
      className={`bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex flex-col shrink-0 border-r border-slate-300 dark:border-slate-800 transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Factory / Company Identity Header - Deep Blue exactly matching Mockup */}
      <div className="p-3 bg-sky-600 dark:bg-sky-700 text-white shadow-sm border-b border-sky-700">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2.5'}`}>
          <div className="w-9 h-9 rounded-md bg-white flex items-center justify-center p-1 shadow-sm shrink-0">
            {/* Northern Fashions Ltd. Logo Symbol */}
            <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
              <path d="M 8 30 C 8 16 18 10 32 10 C 26 18 20 24 8 30 Z" fill="#16a34a" />
              <path d="M 32 10 C 32 24 22 30 8 30 C 14 22 20 16 32 10 Z" fill="#0284c7" />
              <path d="M 12 26 C 18 20 24 15 28 12" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h2 className="text-sm font-black text-white tracking-wide truncate">
                Northern Fashions Ltd.
              </h2>
              <p className="text-[10px] text-sky-100 truncate font-semibold">
                QMS- Quality Management System
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links - 7 specific items */}
      <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center ${
                collapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
              } rounded-md text-xs transition-all group border ${
                isActive
                  ? 'bg-emerald-100 dark:bg-emerald-950/70 border-emerald-300 dark:border-emerald-700 text-red-600 dark:text-red-400 font-extrabold shadow-xs'
                  : 'border-transparent text-emerald-800 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 font-semibold'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <div
                  className={`p-1 rounded ${
                    isActive
                      ? 'bg-sky-600 text-white'
                      : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:bg-sky-500/20'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                </div>
                {!collapsed && (
                  <span className={`truncate text-[13px] ${isActive ? 'text-red-600 dark:text-red-400 font-extrabold' : 'text-slate-800 dark:text-slate-200'}`}>
                    {item.label}
                  </span>
                )}
              </div>

              {!collapsed && (
                <div className="flex items-center gap-1">
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded border ${
                        item.badgeColor ||
                        (isActive
                          ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 border-emerald-400 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700')
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                </div>
              )}
            </button>
          );
        })}
      </div>


      {/* Day / Night Theme Toggle */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Day (Light) Mode' : 'Switch to Night (Dark) Mode'}
          className={`w-full flex items-center ${
            collapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'
          } rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer`}
        >
          <div className="flex items-center gap-2.5">
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <Moon className="w-4 h-4 text-sky-600 shrink-0" />
            )}
            {!collapsed && (
              <span>{theme === 'dark' ? 'Day Mode' : 'Night Mode'}</span>
            )}
          </div>
          {!collapsed && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold">
              {theme === 'dark' ? 'Light' : 'Dark'}
            </span>
          )}
        </button>
      </div>

      {/* Sign Out Button */}
      <div className="p-2 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={logout}
          title="Sign Out to QMS Portal"
          className={`w-full flex items-center ${
            collapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2'
          } rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors cursor-pointer`}
        >
          <LogOut className="w-4 h-4 shrink-0 text-rose-500" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
};
