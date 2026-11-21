import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minimize2 } from 'lucide-react';

export type ExpandSizeMode = 'medium' | 'large';

export interface ExpandablePanelRenderProps {
  isExpanded: boolean;
  expandSize: ExpandSizeMode;
  expandControls: React.ReactNode;
}

interface ExpandablePanelProps {
  title: string;
  className?: string;
  expandedSurfaceClassName?: string;
  defaultSize?: ExpandSizeMode;
  testId?: string;
  buttonTone?: 'on-dark' | 'on-light';
  children: (ctx: ExpandablePanelRenderProps) => React.ReactNode;
}

export const ExpandablePanel: React.FC<ExpandablePanelProps> = ({
  title,
  className = '',
  expandedSurfaceClassName = 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col',
  defaultSize = 'large',
  testId,
  buttonTone = 'on-dark',
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandSize, setExpandSize] = useState<ExpandSizeMode>(defaultSize);

  useEffect(() => {
    if (!isExpanded) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
      }
    };
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isExpanded]);

  const inlineBtnClass =
    buttonTone === 'on-dark'
      ? 'inline-flex items-center justify-center p-1 rounded text-white/90 hover:text-white hover:bg-white/20 transition-colors cursor-pointer shrink-0'
      : 'inline-flex items-center justify-center p-1 rounded text-slate-600 dark:text-slate-300 hover:text-sky-700 dark:hover:text-sky-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0';

  const restoreBtnClass =
    buttonTone === 'on-dark'
      ? 'inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold transition-colors cursor-pointer shrink-0 whitespace-nowrap'
      : 'inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-bold transition-colors cursor-pointer shrink-0 whitespace-nowrap';

  const sizeToggleWrapClass =
    buttonTone === 'on-dark'
      ? 'inline-flex items-center rounded bg-black/25 p-0.5 text-[10px] font-bold shrink-0'
      : 'inline-flex items-center rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-0.5 text-[10px] font-bold shrink-0';

  const renderControls = (expanded: boolean) => {
    if (!expanded) {
      return (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          aria-label={`Maximize ${title}`}
          title="Maximize / Expand View"
          className={inlineBtnClass}
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      );
    }

    return (
      <div className="inline-flex items-center gap-1.5 shrink-0">
        <div role="group" aria-label="Panel size" className={sizeToggleWrapClass}>
          <button
            type="button"
            onClick={() => setExpandSize('medium')}
            className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
              expandSize === 'medium'
                ? buttonTone === 'on-dark'
                  ? 'bg-white text-slate-900'
                  : 'bg-sky-600 text-white'
                : buttonTone === 'on-dark'
                ? 'text-white/80 hover:text-white'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            Medium
          </button>
          <button
            type="button"
            onClick={() => setExpandSize('large')}
            className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
              expandSize === 'large'
                ? buttonTone === 'on-dark'
                  ? 'bg-white text-slate-900'
                  : 'bg-sky-600 text-white'
                : buttonTone === 'on-dark'
                ? 'text-white/80 hover:text-white'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            Large
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          aria-label={`Restore Down ${title}`}
          title="Restore Down to Original Size"
          className={restoreBtnClass}
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Restore Down</span>
        </button>
      </div>
    );
  };

  if (!isExpanded) {
    return (
      <div data-testid={testId} className={className}>
        {children({
          isExpanded: false,
          expandSize,
          expandControls: renderControls(false),
        })}
      </div>
    );
  }

  const sizeWidthClass =
    expandSize === 'medium' ? 'w-full max-w-4xl max-h-[84vh]' : 'w-[96vw] max-w-[1440px] max-h-[90vh]';

  return (
    <>
      <div
        data-testid={testId}
        aria-hidden="true"
        className={`${className} min-h-[240px] items-center justify-center p-6 text-center opacity-60 pointer-events-none select-none`}
      >
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {title} — Expanded View Open
        </p>
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setIsExpanded(false)}
          className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-sky-600 text-white text-xs font-bold cursor-pointer"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          Restore Down
        </button>
      </div>

      {typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${title} Expanded View`}
            onClick={() => setIsExpanded(false)}
            className="fixed inset-0 z-[95] bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          >
            <div
              data-testid={testId ? `${testId}-expanded` : undefined}
              onClick={(e) => e.stopPropagation()}
              className={`${sizeWidthClass} ${expandedSurfaceClassName}`}
            >
              <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
                {children({
                  isExpanded: true,
                  expandSize,
                  expandControls: renderControls(true),
                })}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
