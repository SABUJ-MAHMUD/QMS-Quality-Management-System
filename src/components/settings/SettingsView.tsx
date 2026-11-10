import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  SlidersHorizontal,
  Target,
  Calendar,
  Building,
  Shield,
  Trash2,
  RotateCcw,
  Database,
  Save,
  CheckCircle2,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    currentUserRole,
    setCurrentUserRole,
    hasDemoData,
    clearDemoData,
    restoreDemoData,
    canManageSettings,
  } = useApp();

  const [targetOql, setTargetOql] = useState(settings.targetOql);
  const [fyStartMonth, setFyStartMonth] = useState(settings.financialYearStartMonth);
  const [factoryName, setFactoryName] = useState(settings.factoryName);
  const [defaultBuyer, setDefaultBuyer] = useState(settings.defaultBuyer);
  const [oqlDecimals, setOqlDecimals] = useState(settings.oqlDecimals);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      targetOql: Number(targetOql),
      financialYearStartMonth: Number(fyStartMonth),
      factoryName,
      defaultBuyer,
      oqlDecimals: Number(oqlDecimals),
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          QMS System Configuration & Standards
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Settings
          </span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure official buyer OQL targets, financial year cycles, factory details, and access control.
        </p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
            <Target className="w-4 h-4 text-sky-600" />
            1. Buyer Observed Quality Level (OQL) Target
          </h3>
          <p className="text-xs text-slate-500">
            Standard acceptable defect threshold for BESTSELLER buyer audits. Target is typically 4.50%.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Target OQL Percentage (%)
              </label>
              <div className="relative max-w-xs">
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="20"
                  disabled={!canManageSettings}
                  value={targetOql}
                  onChange={(e) => setTargetOql(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:outline-none focus:border-sky-500 disabled:bg-slate-100"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  %
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Default: 4.50% (BESTSELLER Standard)
              </span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Decimal Precision for OQL Math
              </label>
              <select
                disabled={!canManageSettings}
                value={oqlDecimals}
                onChange={(e) => setOqlDecimals(parseInt(e.target.value))}
                className="w-full max-w-xs border border-slate-300 rounded-lg p-2 font-medium text-slate-900 focus:outline-none focus:border-sky-500 disabled:bg-slate-100"
              >
                <option value={2}>2 Decimals (e.g. 5.77%)</option>
                <option value={1}>1 Decimal (e.g. 5.8%)</option>
                <option value={3}>3 Decimals (e.g. 5.769%)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Financial Year Cycle */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            2. Financial Year (FY) Definition
          </h3>
          <p className="text-xs text-slate-500">
            Specify the starting month of the financial cycle. By default, BESTSELLER factory quality follows August to July (e.g. FY26/27 = August 2026 to July 2027).
          </p>

          <div className="max-w-xs text-xs">
            <label className="block text-slate-700 font-semibold mb-1">
              Financial Year Start Month
            </label>
            <select
              disabled={!canManageSettings}
              value={fyStartMonth}
              onChange={(e) => setFyStartMonth(parseInt(e.target.value))}
              className="w-full border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:outline-none focus:border-sky-500 disabled:bg-slate-100"
            >
              {monthNames.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m} (Cycle: {m} to {monthNames[(idx + 11) % 12]})
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Currently: August &rarr; July (FY26/27)
            </span>
          </div>
        </div>

        {/* Organization / Factory Profile */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
            <Building className="w-4 h-4 text-emerald-600" />
            3. Factory & Buyer Entity Configuration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Factory Name</label>
              <input
                type="text"
                disabled={!canManageSettings}
                value={factoryName}
                onChange={(e) => setFactoryName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:outline-none focus:border-sky-500 disabled:bg-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Default Buyer</label>
              <input
                type="text"
                disabled={!canManageSettings}
                value={defaultBuyer}
                onChange={(e) => setDefaultBuyer(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 font-bold text-slate-900 focus:outline-none focus:border-sky-500 disabled:bg-slate-100"
              />
            </div>
          </div>
        </div>

        {canManageSettings && (
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Configuration Changes
            </button>
          </div>
        )}
      </form>

      {/* Role-Based Access Control (RBAC) Overview */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b pb-2">
          <Shield className="w-4 h-4 text-sky-600" />
          4. Role-Based Access Control (RBAC) Matrix
        </h3>
        <p className="text-xs text-slate-500">
          Current active session role: <strong className="text-sky-700">{currentUserRole}</strong>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="font-bold text-slate-900 block mb-1">1. Admin</span>
            <p className="text-slate-500 text-[11px]">Full access to all modules, settings, deletes, and configuration.</p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="font-bold text-slate-900 block mb-1">2. QMS Manager</span>
            <p className="text-slate-500 text-[11px]">Manage inspection data, defects, CAPA, monitoring, and reports.</p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="font-bold text-slate-900 block mb-1">3. QMS Executive</span>
            <p className="text-slate-500 text-[11px]">Upload reports, validate data, manage classifications, update CAPA.</p>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="font-bold text-slate-900 block mb-1">4. Viewer</span>
            <p className="text-slate-500 text-[11px]">Read-only access to dashboards, charts, and exportable reports.</p>
          </div>
        </div>
      </div>

      {/* Demonstration Data Management */}
      <div className="bg-amber-50/60 rounded-xl p-5 border border-amber-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-700" />
              5. Demonstration Data Management
            </h3>
            <p className="text-xs text-amber-800 mt-0.5">
              Reset or restore the realistic initial demonstration records (Sample Order DEMO-001 with 30 defects &amp; 5.77% OQL).
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasDemoData ? (
              <button
                type="button"
                onClick={clearDemoData}
                disabled={!canManageSettings}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs shadow-2xs transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-700" />
                Clear Demo Data
              </button>
            ) : (
              <button
                type="button"
                onClick={restoreDemoData}
                disabled={!canManageSettings}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs shadow-2xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                Restore Demo Data
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
