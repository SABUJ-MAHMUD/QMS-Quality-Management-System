import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileUp,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  UploadCloud,
  FileCheck2,
  FolderOpen,
  Calendar,
  Trash2,
  ClipboardPaste,
  Hash,
  Search,
  X,
} from 'lucide-react';
import {
  parseInspectionPdf,
  extractDataFromText,
  reportToDraft,
  ExtractedInspectionDraft,
} from '../../utils/pdfParser';
import { InspectionReport } from '../../types';
import { ValidationModal } from './ValidationModal';

export const UploadView: React.FC = () => {
  const {
    reports,
    deleteInspectionReport,
    canManageData,
    defectMaster,
    defectGroups,
    addNotification,
    setActiveTab,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeMode, setActiveMode] = useState<'upload' | 'paste' | 'samples'>('upload');
  const [selectedTargetMonth, setSelectedTargetMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatusText, setProcessingStatusText] = useState('');
  const [currentDraft, setCurrentDraft] = useState<ExtractedInspectionDraft | null>(null);
  const [archiveSearch, setArchiveSearch] = useState('');

  // Dynamic 12-month options centered around selectedTargetMonth year + any months in existing reports
  const targetMonthOptions = useMemo(() => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const activeYear = /^\d{4}-\d{2}$/.test(selectedTargetMonth)
      ? selectedTargetMonth.slice(0, 4)
      : String(new Date().getFullYear());

    const map = new Map<string, string>();
    for (let m = 1; m <= 12; m++) {
      const ym = `${activeYear}-${String(m).padStart(2, '0')}`;
      map.set(ym, `${monthNames[m - 1]} ${activeYear}`);
    }
    reports.forEach((r) => {
      const ym = r.targetMonth || (r.inspectionDate ? r.inspectionDate.slice(0, 7) : '');
      if (/^\d{4}-\d{2}$/.test(ym) && !map.has(ym)) {
        const idx = parseInt(ym.slice(5, 7), 10) - 1;
        map.set(ym, `${monthNames[idx] || ym} ${ym.slice(0, 4)}`);
      }
    });
    if (/^\d{4}-\d{2}$/.test(selectedTargetMonth) && !map.has(selectedTargetMonth)) {
      const idx = parseInt(selectedTargetMonth.slice(5, 7), 10) - 1;
      map.set(selectedTargetMonth, `${monthNames[idx] || selectedTargetMonth} ${selectedTargetMonth.slice(0, 4)}`);
    }

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([value, label]) => ({ value, label }));
  }, [selectedTargetMonth, reports]);

  const syncTargetMonthFromDraft = (draft: ExtractedInspectionDraft) => {
    const derived = (draft.targetMonth || (draft.inspectionDate ? draft.inspectionDate.slice(0, 7) : '')).trim();
    if (/^\d{4}-\d{2}$/.test(derived)) {
      setSelectedTargetMonth(derived);
    }
  };

  // Manual Paste Text State
  const [pastedText, setPastedText] = useState<string>(
    `BESTSELLER FINAL INSPECTION REPORT\nFactory: Northern Fashions Ltd.\nOrder No: NOF4778898\nStyle No: 22031973\nDescription: ONSCONNOR LIFE STRAIGHT PANTS SWEAT NOOS\nInspection Date: 2026-10-29\nOrder Qty: 2010 pcs\nInspected Qty: 50 pcs\nSampling Method: AQL 2.5/2.5 Level II Reduced\n\nDEFECTS FOUND:\nCle-5 Oil spots or stains (cannot be removed): 1 Major\nCle-3 Untrimmed thread ends reverse side: 1 Major\nSL-1 Dirt/Stain/Mark >= 2.5mm: 1 Minor`
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setProcessingProgress(15);
    setProcessingStatusText(`Preparing ${file.name}...`);

    // Allow the progress UI to paint before extraction starts
    await new Promise((r) => setTimeout(r, 0));

    try {
      const draft = await parseInspectionPdf(
        file,
        defectMaster,
        defectGroups,
        undefined,
        selectedTargetMonth,
        (pct, status) => {
          setProcessingProgress(pct);
          if (status) setProcessingStatusText(status);
        }
      );

      setProcessingProgress(100);
      setIsProcessing(false);
      syncTargetMonthFromDraft(draft);
      setCurrentDraft(draft);
    } catch (err: any) {
      setIsProcessing(false);
      addNotification('error', `Failed to parse file: ${err?.message || 'Unsupported format'}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      processFile(file);
    }
  };

  const handleParsePastedText = () => {
    if (!pastedText.trim()) return;
    const draft = extractDataFromText(
      pastedText,
      'Manual_Pasted_Inspection.txt',
      defectMaster,
      defectGroups,
      selectedTargetMonth
    );
    syncTargetMonthFromDraft(draft);
    setCurrentDraft(draft);
  };

  const handleInspectUploadedReport = (report: InspectionReport) => {
    const draft = reportToDraft(report);
    syncTargetMonthFromDraft(draft);
    setCurrentDraft(draft);
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Top Banner matching Excel Mockup image_ca435466.png */}
      <div className="bg-[#c6e0b4] dark:bg-emerald-950/70 border border-[#a9d08e] dark:border-emerald-800 px-4 py-2.5 rounded-t-md shadow-xs">
        <h1 className="text-3xl font-black text-[#dc2626] dark:text-red-500 tracking-wide font-sans">
          PDF Report Upload
        </h1>
      </div>

      {/* Target Month Slicer Bar — automatically synced from PDF Inspection Date */}
      <div className="bg-[#fff9e6] dark:bg-amber-950/30 border border-[#fef08a] dark:border-amber-900/40 p-3 rounded-md flex flex-wrap items-center gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <label htmlFor="target-inspection-month" className="font-serif text-slate-800 dark:text-slate-100 text-sm font-normal">
            Target Inspection Month:
          </label>
          <select
            id="target-inspection-month"
            value={selectedTargetMonth}
            onChange={(e) => setSelectedTargetMonth(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-400 dark:border-slate-600 rounded px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-inner focus:outline-none cursor-pointer"
          >
            {targetMonthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm font-normal text-slate-800 dark:text-slate-200 font-serif">
          PDF বা ইমেজ আপলোড করলে রিপোর্টের <strong>Inspection Date</strong> অনুযায়ী মাসটি অটো-সিলেক্ট হয়ে যাবে
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveMode('upload')}
          className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeMode === 'upload'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileUp className="w-3.5 h-3.5" />
          PDF &amp; Image File Upload (Drag &amp; Drop / Browse)
        </button>

        <button
          onClick={() => setActiveMode('samples')}
          className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
            activeMode === 'samples'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          Factory BESTSELLER Reports (NOF Serials)
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-800 text-[10px] font-black">
            {reports.length}
          </span>
        </button>

        <button
          onClick={() => setActiveMode('paste')}
          className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeMode === 'paste'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardPaste className="w-3.5 h-3.5" />
          Paste Report Text / OCR
        </button>
      </div>

      {/* MODE 1: PDF File & Screenshot Upload */}
      {activeMode === 'upload' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all bg-white relative ${
            isDragging
              ? 'border-sky-500 bg-sky-50/50 scale-[1.01]'
              : 'border-slate-300 hover:border-sky-400 hover:bg-slate-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf, .png, .jpg, .jpeg, image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-sky-100 text-sky-600 border border-sky-200 flex items-center justify-center mx-auto shadow-xs">
              {isProcessing ? (
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
              ) : (
                <UploadCloud className="w-8 h-8 text-sky-600" />
              )}
            </div>

            {isProcessing ? (
              <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-800">
                  Extracting Inspection Data...
                </h3>
                <p className="text-xs text-slate-500">{processingStatusText}</p>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${processingProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-800">
                  Drop Your Factory PDF Report or Screenshot Here
                </h3>
                <p className="text-xs text-slate-500">
                  Supports PDF files and screenshot images (<span className="font-semibold text-slate-700">.pdf, .png, .jpg</span>). The system extracts <span className="font-bold text-sky-700">NOF Job Order</span>, Style, Inspected Quantity, and Defects automatically.
                </p>
                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    <FolderOpen className="w-4 h-4" />
                    Browse &amp; Select File (PDF or Image)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: Card-Grid Only Archive (Uploaded Reports + Quick Test Templates, no table) */}
      {activeMode === 'samples' && (
        <div className="space-y-5">
          {/* Uploaded Factory Inspection Reports — Card Grid */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                  Uploaded Factory BESTSELLER Reports ({reports.length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Every uploaded &amp; approved PDF/Image report automatically appears here. Click <strong>Extract &amp; Validate Template</strong> to view or edit full inspection details.
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search NOF, Style, Inspector..."
                  value={archiveSearch}
                  onChange={(e) => setArchiveSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {reports.length === 0 ? (
              <div className="p-7 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No uploaded factory inspection reports yet.
                </p>
                <p className="text-[11px] text-slate-400">
                  Upload any BESTSELLER PDF or Screenshot from Tab 1 — its history card will appear here automatically.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveMode('upload')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer mt-1"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  Go to File Upload
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {reports
                  .filter((r) => {
                    if (!archiveSearch.trim()) return true;
                    const q = archiveSearch.toLowerCase();
                    return (
                      (r.orderNumber || '').toLowerCase().includes(q) ||
                      (r.reportNumber || '').toLowerCase().includes(q) ||
                      (r.styleNumber || '').toLowerCase().includes(q) ||
                      (r.styleName || '').toLowerCase().includes(q) ||
                      (r.inspector || '').toLowerCase().includes(q) ||
                      (r.inspectionType || '').toLowerCase().includes(q)
                    );
                  })
                  .map((r) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-sky-400 hover:shadow-xs transition-all bg-slate-50/70 dark:bg-slate-800/50 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center shrink-0">
                            <FileCheck2 className="w-4 h-4" />
                          </div>
                          <div className="flex items-center gap-1 flex-wrap justify-end">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                              {r.inspectionType || 'Final'}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                r.inspectionResult === 'PASSED'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : 'bg-rose-100 text-rose-800 border-rose-200'
                              }`}
                            >
                              {r.inspectionResult}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                            {r.orderNumber} ({r.styleNumber || 'N/A'}) - {r.floor || 'SEW-1'} {r.inspectionType || 'Final'}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                            {r.styleName || r.productDescription} &bull; {r.buyer}
                          </p>
                        </div>

                        <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-400">Order (NOF):</span>
                            <span className="font-bold text-sky-800 dark:text-sky-400 truncate">{r.orderNumber}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-400">Inspector:</span>
                            <span className="font-semibold truncate">{r.inspector || 'QMS Inspector'}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-400">Date:</span>
                            <span className="font-semibold">{r.inspectionDate}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-400">Order / Sample:</span>
                            <span className="font-semibold">
                              {(r.orderQuantity || 0).toLocaleString()} / {r.inspectedQuantity} pcs
                            </span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span className="text-slate-400">Defects / OQL:</span>
                            <span className="font-bold text-amber-700 dark:text-amber-400">
                              {r.totalDefectQuantity} items ({Number(r.oql || 0).toFixed(2)}%)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3.5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleInspectUploadedReport(r)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-white dark:bg-slate-900 hover:bg-sky-50 text-sky-700 dark:text-sky-300 font-semibold text-xs border border-sky-200 dark:border-sky-800 hover:border-sky-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <FileCheck2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          Extract &amp; Validate Template
                        </button>
                        {canManageData && (
                          <button
                            type="button"
                            onClick={() => deleteInspectionReport(r.id)}
                            title="Delete report"
                            aria-label={`Delete report ${r.orderNumber}`}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 3: Paste Report Text / OCR */}
      {activeMode === 'paste' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <ClipboardPaste className="w-4 h-4 text-sky-600" />
              Paste Report Text or OCR Content
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              If you have text copied from an audit spreadsheet, email, or OCR tool, paste it here. The parser will detect NOF serial, quantities, and defect lines automatically.
            </p>
          </div>

          <textarea
            rows={8}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-sky-500"
            placeholder="Paste inspection text here..."
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleParsePastedText}
              disabled={isProcessing || !pastedText.trim()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50"
            >
              <FileCheck2 className="w-4 h-4" />
              Extract Data &amp; Open Validation Screen
            </button>
          </div>
        </div>
      )}

      {/* Feature Information Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <Hash className="w-4 h-4 text-emerald-600" />
            NOF Serial Auto-Detection
          </div>
          <p className="text-slate-500">
            Northern Fashions NOF serial numbers (e.g. <strong>NOF4778898</strong>) are automatically identified and mapped as the primary job order.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-sky-600" />
            Month-wise Audit Tracking
          </div>
          <p className="text-slate-500">
            Assigned inspection months feed directly into the <strong>Month-wise Defect Comparison Column Chart</strong> for monthly intelligence.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            Interactive Data Validation
          </div>
          <p className="text-slate-500">
            Verify extracted defect names, severities, and quantities with real-time OQL computation before committing to the inspection database.
          </p>
        </div>
      </div>

      {/* Launch Validation Modal upon Extraction or Inspecting Saved Report */}
      {currentDraft && (
        <ValidationModal
          draft={currentDraft}
          onClose={() => setCurrentDraft(null)}
          onApproveSuccess={() => {
            const wasExisting = Boolean(currentDraft.existingReportId);
            setCurrentDraft(null);
            if (!wasExisting) {
              setActiveTab('database');
            }
          }}
        />
      )}
    </div>
  );
};
