import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  Bell,
  Search,
  User,
  Shield,
  Calendar,
  Building2,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  MoreVertical,
  LogOut,
  Sun,
  Moon,
  Clock,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarCollapsed }) => {
  const {
    filters,
    setFilters,
    currentUserRole,
    setCurrentUserRole,
    currentUserEmail,
    currentUserName,
    reports,
    notifications,
    clearNotifications,
    logout,
    theme,
    toggleTheme,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  // Live ticking clock & date (User Requirement 7: "এ্যাপস এর উপরে একটি লাইভ টাইম ঘড়ি ও তারিখ দিয়ে দাও")
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    }
  };

  const timeStr = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const todayStr = currentTime.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Derive unique buyers and financial years
  const availableBuyers = Array.from(new Set(reports.map((r) => r.buyer)));
  if (!availableBuyers.includes('BESTSELLER')) availableBuyers.push('BESTSELLER');

  const roles: UserRole[] = ['Admin', 'QMS Manager', 'QMS Executive', 'Viewer'];

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-sky-100 dark:border-slate-800 shadow-xs transition-colors">
      <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left Section: 3-Dots Sidebar Toggle + Brand Title with Clean Green Quality Mark */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              title={isSidebarCollapsed ? 'Expand Sidebar Navigation' : 'Collapse Sidebar Navigation'}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-sky-700 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            {/* Northern Fashions Swirl Monogram */}
            <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center p-1 shadow-xs shrink-0">
              <svg viewBox="0 0 40 40" className="w-full h-full" fill="none">
                <path d="M 12 28 C 12 18 20 12 28 12 C 24 18 20 22 12 28 Z" fill="#84cc16" />
                <path d="M 28 12 C 28 22 20 28 12 28 C 16 22 20 18 28 12 Z" fill="#94a3b8" />
                <path d="M 16 24 C 20 20 24 16 26 14" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-wider uppercase leading-none">
                  NORTHERN FASHIONS LTD.
                </h1>
                <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                  QMS
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 leading-none">
                  QMS - Quality Management System
                </p>
                <div className="h-0.5 w-4 bg-lime-500 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Global Controls & Filters in Header */}
        <div className="flex items-center gap-2.5 flex-1 max-w-2xl justify-center">
          {/* Global Search */}
          <div className="relative w-full max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Search reports, styles, defects..."
              value={filters.searchQuery}
              onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
            />
            {filters.searchQuery && (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, searchQuery: '' }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Buyer Selector */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200">
            <span className="text-slate-400 dark:text-slate-500 font-medium mr-1.5">Buyer:</span>
            <select
              value={filters.buyer}
              onChange={(e) => setFilters((prev) => ({ ...prev, buyer: e.target.value }))}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="dark:bg-slate-800">All Buyers</option>
              {availableBuyers.map((b) => (
                <option key={b} value={b} className="dark:bg-slate-800">
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Financial Year Selector */}
          <div className="flex items-center bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200">
            <span className="text-slate-400 dark:text-slate-500 font-medium mr-1.5">FY:</span>
            <select
              value={filters.financialYear}
              onChange={(e) => setFilters((prev) => ({ ...prev, financialYear: e.target.value }))}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="dark:bg-slate-800">All FYs</option>
              <option value="FY26/27" className="dark:bg-slate-800">FY26/27 (Aug 26 - Jul 27)</option>
              <option value="FY25/26" className="dark:bg-slate-800">FY25/26 (Aug 25 - Jul 26)</option>
            </select>
          </div>
        </div>

        {/* Right Section: Live Clock, Fullscreen, Day/Night Switch, Notifications, User Profile */}
        <div className="flex items-center gap-2">
          {/* Live Clock & Date (User Requirement 7: "এ্যাপস এর উপরে একটি লাইভ টাইম ঘড়ি ও তারিখ দিয়ে দাও") */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white border border-slate-700 shadow-2xs font-mono">
            <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse shrink-0" />
            <span className="text-xs font-black text-emerald-400 tracking-wider whitespace-nowrap">{timeStr}</span>
            <span className="text-slate-500 font-sans hidden sm:inline">|</span>
            <span className="text-xs font-semibold text-slate-300 font-sans hidden sm:inline whitespace-nowrap">{todayStr}</span>
          </div>

          {/* Fullscreen Button (User Requirement 7: "ডেশবোর্ডটি যেন ফুলস্ক্রি হয় ফুল স্ক্রিন করার জন্য একটি বাটুন সংযুক্ত করে দাও") */}
          <button
            onClick={handleToggleFullscreen}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all cursor-pointer shadow-2xs"
            title={isFullscreen ? 'Exit Full Screen' : 'View Full Screen'}
            aria-label="Toggle Full Screen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-sky-500" /> : <Maximize2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
          </button>

          {/* Day / Night Mode Switch */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-all cursor-pointer text-xs font-bold shadow-2xs"
            title={theme === 'dark' ? 'Switch to Day (Light) Mode' : 'Switch to Night (Dark) Mode'}
            aria-label="Toggle Day / Night Mode"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline text-amber-300">Day Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-sky-600" />
                <span className="hidden sm:inline text-slate-700">Night Mode</span>
              </>
            )}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-sky-700 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-sky-100 dark:hover:border-slate-700"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-3 z-50">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2 mb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-white">QMS Activity Alerts</span>
                  <button
                    onClick={clearNotifications}
                    className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-medium"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 py-3 text-center">No new notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 text-xs flex gap-2 items-start"
                      >
                        {n.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />}
                        {n.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />}
                        {n.type === 'warning' && <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />}
                        {n.type === 'info' && <Info className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />}
                        <div className="flex-1">
                          <p className="text-slate-700 dark:text-slate-200 leading-tight">{n.message}</p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">{n.timestamp}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Role Selector */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 p-1.5 pl-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-sky-300 dark:hover:border-slate-600 hover:bg-sky-50/50 dark:hover:bg-slate-800 transition-all text-left cursor-pointer"
            >
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none truncate max-w-[130px]">
                  {currentUserEmail === 'quality.engineer.bd@gmail.com' ? 'Super Admin' : (currentUserName || 'Northern QMS')}
                </div>
                <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">{currentUserRole}</div>
              </div>
              <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center font-bold text-xs">
                <User className="w-4 h-4" />
              </div>
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-2 z-50">
                <div className="px-2.5 py-2 border-b border-slate-100 dark:border-slate-700 mb-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                    Logged in user
                  </p>
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate mt-0.5">
                    {currentUserEmail}
                  </p>
                  <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Role: {currentUserRole}
                  </p>
                </div>
                {roles.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setCurrentUserRole(r);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                      currentUserRole === r
                        ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{r}</span>
                    {currentUserRole === r && <Shield className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />}
                  </button>
                ))}
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 dark:text-slate-500">Northern Fashions QMS</span>
                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      logout();
                    }}
                    className="flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-bold hover:underline"
                  >
                    <LogOut className="w-3 h-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dedicated Sign Out Button */}
          <button
            onClick={logout}
            title="Sign Out to QMS Portal"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 transition-colors cursor-pointer text-xs font-bold"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
