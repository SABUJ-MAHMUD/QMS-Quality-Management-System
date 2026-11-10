import React from 'react';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, Trash2, RotateCcw } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  const { hasDemoData, clearDemoData, restoreDemoData } = useApp();

  if (!hasDemoData) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
      <div className="flex items-center gap-2 text-amber-900 font-medium">
        <span className="inline-flex items-center gap-1 bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px]">
          <AlertTriangle className="w-3 h-3 text-amber-700" />
          {hasDemoData ? 'DEMO DATA ACTIVE' : 'LIVE DATA MODE'}
        </span>
        <span>
          {hasDemoData
            ? 'Demonstration records (e.g. DEMO-001 OQL 5.77%) are loaded for system evaluation. Never present demo data as actual factory inspection results.'
            : 'Demonstration records are cleared. All shown metrics represent actual uploaded inspection reports.'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {hasDemoData ? (
          <button
            onClick={clearDemoData}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 font-semibold shadow-2xs transition-colors"
            title="Clear all demonstration inspection reports"
          >
            <Trash2 className="w-3.5 h-3.5 text-amber-700" />
            Clear Demo Data
          </button>
        ) : (
          <button
            onClick={restoreDemoData}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 font-semibold shadow-2xs transition-colors"
            title="Restore sample demo inspection reports"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
            Restore Demo Data
          </button>
        )}
      </div>
    </div>
  );
};
