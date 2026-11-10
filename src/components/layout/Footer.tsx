import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-3 px-6 text-center shrink-0 transition-colors">
      <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
        <div className="font-semibold text-slate-800 dark:text-slate-200">
          Garment Quality Analytics <span className="text-sky-600 font-normal">|</span> Digital Quality Intelligence System
        </div>
        <div className="text-[11px] text-slate-400 dark:text-slate-500">
          Northern Fashions Ltd. QMS Department &bull; BESTSELLER Buyer Observed Quality Level Compliance
        </div>
      </div>
    </footer>
  );
};
