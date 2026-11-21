import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface MultiSelectCheckboxOption {
  value: string;
  label: string;
  count?: number;
  subLabel?: string;
}

interface MultiSelectCheckboxFilterProps {
  label: string;
  allLabel: string;
  headerTitle: string;
  ariaLabel: string;
  allCount?: number;
  selectedValues: string[];
  options: MultiSelectCheckboxOption[];
  onToggle: (value: string) => void;
  onSelectAll: () => void;
  buttonSummary?: string;
  buttonClassName?: string;
  maxWidthClass?: string;
  menuWidthClass?: string;
  title?: string;
  testId?: string;
}

export const MultiSelectCheckboxFilter: React.FC<MultiSelectCheckboxFilterProps> = ({
  label,
  allLabel,
  headerTitle,
  ariaLabel,
  allCount,
  selectedValues,
  options,
  onToggle,
  onSelectAll,
  buttonSummary,
  buttonClassName,
  maxWidthClass = 'max-w-[130px]',
  menuWidthClass = 'w-64',
  title,
  testId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  const resolvedSummary =
    buttonSummary ||
    (selectedValues.length === 0
      ? allLabel
      : selectedValues.length === 1
      ? options.find((o) => o.value === selectedValues[0])?.label || selectedValues[0]
      : `${selectedValues.length} Selected`);

  return (
    <div className="relative" ref={containerRef} data-testid={testId}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        title={title}
        className={
          buttonClassName ||
          'flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-sky-500 rounded px-2 py-1 shadow-2xs cursor-pointer transition-colors text-xs whitespace-nowrap'
        }
      >
        <span className="text-slate-500 dark:text-slate-400 font-semibold">{label}:</span>
        <span className={`font-bold text-slate-900 dark:text-slate-100 ${maxWidthClass} truncate`}>
          {resolvedSummary}
        </span>
        {selectedValues.length > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-sky-600 text-white text-[10px] font-black">
            {selectedValues.length}
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-multiselectable="true"
          aria-label={headerTitle}
          className={`absolute left-0 mt-1.5 ${menuWidthClass} bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-50 space-y-1`}
        >
          <div className="px-2 py-1 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {headerTitle}
            </span>
            {selectedValues.length > 0 && (
              <button
                type="button"
                onClick={onSelectAll}
                className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {/* All option checkbox */}
          <label className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer text-xs">
            <span className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedValues.length === 0}
                onChange={onSelectAll}
                className="w-3.5 h-3.5 rounded accent-sky-600 cursor-pointer"
              />
              <span
                className={`font-bold ${
                  selectedValues.length === 0
                    ? 'text-sky-700 dark:text-sky-300'
                    : 'text-slate-700 dark:text-slate-200'
                }`}
              >
                {allLabel}
              </span>
            </span>
            {typeof allCount === 'number' && (
              <span className="text-[10px] text-slate-400 font-semibold">{allCount} rpts</span>
            )}
          </label>

          <div className="border-t border-slate-100 dark:border-slate-700 pt-1 space-y-0.5 max-h-60 overflow-y-auto">
            {options.length === 0 ? (
              <p className="text-[11px] text-slate-400 text-center py-2">No options available</p>
            ) : (
              options.map((opt) => {
                const isChecked = selectedValues.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer text-xs transition-colors ${
                      isChecked
                        ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggle(opt.value)}
                        className="w-3.5 h-3.5 rounded accent-sky-600 cursor-pointer shrink-0"
                      />
                      <span className="truncate">{opt.label}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-semibold shrink-0">
                      {typeof opt.count === 'number' && <span>{opt.count}r</span>}
                      {opt.subLabel && <span>{opt.subLabel}</span>}
                      {isChecked && <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
