import React, { useState, useRef } from 'react';
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
  Eye,
  Hash,
  ImageIcon,
} from 'lucide-react';
import {
  SAMPLE_PDF_TEMPLATES,
  parseInspectionPdf,
  extractDataFromText,
  ExtractedInspectionDraft,
} from '../../utils/pdfParser';
import { ValidationModal } from './ValidationModal';

export const UploadView: React.FC = () => {
  const {
    defectMaster,
    defectGroups,
    addNotification,
    setActiveTab,
    hasDemoData,
    clearDemoData,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeMode, setActiveMode] = useState<'upload' | 'paste' | 'samples'>('upload');
  const [selectedTargetMonth, setSelectedTargetMonth] = useState<string>('2026-10');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStatusText, setProcessingStatusText] = useState('');
  const [currentDraft, setCurrentDraft] = useState<ExtractedInspectionDraft | null>(null);

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
    setProcessingStatusText(`Reading file: ${file.name}...`);

    try {
      await new Promise((r) => setTimeout(r, 250));
      setProcessingProgress(45);
      setProcessingStatusText('Extracting report text & detecting NOF job serial...');

      await new Promise((r) => setTimeout(r, 300));
      setProcessingProgress(75);
      setProcessingStatusText('Mapping defect classification & calculating AQL/OQL metrics...');

      const draft = await parseInspectionPdf(
        file,
        defectMaster,
        defectGroups,
        undefined,
        selectedTargetMonth
      );

      setProcessingProgress(100);
      setProcessingStatusText('Inspection data captured successfully!');

      setTimeout(() => {
        setIsProcessing(false);
        setCurrentDraft(draft);
      }, 250);
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
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleSelectSample = async (sampleId: string) => {
    const sample = SAMPLE_PDF_TEMPLATES.find((s) => s.id === sampleId);
    if (!sample) return;

    setIsProcessing(true);
    setProcessingProgress(30);
    setProcessingStatusText(`Loading factory inspection report: ${sample.orderNumber}...`);

    await new Promise((r) => setTimeout(r, 250));
    setProcessingProgress(80);
    setProcessingStatusText('Mapping Northern Fashions NOF serial & defect entries...');

    const draft = await parseInspectionPdf(
      { name: sample.fileName, size: 2892000 },
      defectMaster,
      defectGroups,
      sampleId,
      selectedTargetMonth
    );

    setProcessingProgress(100);
    setTimeout(() => {
      setIsProcessing(false);
      setCurrentDraft(draft);
    }, 200);
  };

  const handleParsePastedText = () => {
    if (!pastedText.trim()) return;
    setIsProcessing(true);
    setProcessingProgress(50);
    setProcessingStatusText('Extracting NOF order serial and defects from text...');

    setTimeout(() => {
      const draft = extractDataFromText(
        pastedText,
        'Manual_Pasted_Inspection.txt',
        defectMaster,
        defectGroups,
        selectedTargetMonth
      );
      setIsProcessing(false);
      setCurrentDraft(draft);
    }, 250);
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Title & Clear Demo Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            PDF Inspection Report Upload &amp; Data Capture
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
              NOF Serials Supported
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload factory PDF inspection reports or screenshots. The system automatically detects <strong className="text-sky-700 font-bold">NOF Serials</strong> (e.g. NOF4778898) and extracts defect records.
          </p>
        </div>

        {hasDemoData && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all demo data and start with a clean slate?')) {
                clearDemoData();
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold shadow-2xs transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4 text-amber-700" />
            Clear Demo Data &amp; Start Clean
          </button>
        )}
      </div>

      {/* Target Month Selector */}
      <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-4 h-4 text-sky-700" />
          <span className="font-bold text-sky-900">Target Inspection Month:</span>
          <select
            value={selectedTargetMonth}
            onChange={(e) => setSelectedTargetMonth(e.target.value)}
            className="bg-white border border-sky-300 rounded-lg px-3 py-1.5 font-bold text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="2026-10">October 2026 (Current)</option>
            <option value="2026-09">September 2026</option>
            <option value="2026-08">August 2026</option>
            <option value="2026-07">July 2026</option>
            <option value="2026-11">November 2026</option>
            <option value="2026-12">December 2026</option>
          </select>
        </div>

        <div className="text-[11px] text-sky-800 font-medium">
          Uploaded reports for this month immediately feed into the <strong>Month-wise Defect Comparison Column Chart</strong>.
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
          className={`pb-2 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeMode === 'samples'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          Factory BESTSELLER Reports (NOF Serials)
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

      {/* MODE 2: Factory BESTSELLER Reports (NOF Serials matching user's files) */}
      {activeMode === 'samples' && (
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-600" />
                Northern Fashions Ltd. Factory Inspection Reports
              </h3>
              <p className="text-xs text-slate-500">
                Exact factory files matching BESTSELLER OQL audit standards with verified NOF serials. Click any report to extract and inspect live.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {SAMPLE_PDF_TEMPLATES.map((sample) => (
              <div
                key={sample.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-sky-300 hover:shadow-xs transition-all bg-slate-50/50 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      NOF Serial
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 leading-snug">{sample.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{sample.description}</p>
                  </div>
                  <div className="text-[11px] text-slate-600 space-y-0.5 pt-2 border-t border-slate-200">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Order (NOF):</span>
                      <span className="font-bold text-sky-800">{sample.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Style No:</span>
                      <span className="font-semibold text-slate-700">{sample.styleNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Inspected Qty:</span>
                      <span className="font-semibold">{sample.inspectedQuantity} pcs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Defects Found:</span>
                      <span className="font-semibold text-amber-700">{sample.defectsCount} items</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectSample(sample.id)}
                  disabled={isProcessing}
                  className="mt-3.5 w-full py-1.5 px-3 rounded-lg bg-white hover:bg-sky-50 text-sky-700 font-semibold text-xs border border-sky-200 hover:border-sky-300 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-sky-600" />
                  Extract &amp; Validate This Report
                </button>
              </div>
            ))}
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

      {/* Launch Validation Modal upon Extraction */}
      {currentDraft && (
        <ValidationModal
          draft={currentDraft}
          onClose={() => setCurrentDraft(null)}
          onApproveSuccess={() => {
            setCurrentDraft(null);
            setActiveTab('database');
          }}
        />
      )}
    </div>
  );
};
