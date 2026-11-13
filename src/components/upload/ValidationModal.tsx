import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExtractedInspectionDraft, resolveBrandFromStyle } from '../../utils/pdfParser';
import { calculateReportOql } from '../../utils/oqlCalculator';
import {
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  FileCheck,
  X,
  Sparkles,
  Info,
  Hash,
  Eye,
  Calendar,
  Check,
  XCircle,
} from 'lucide-react';
import { DefectSeverity, InspectionResult } from '../../types';

interface ValidationModalProps {
  draft: ExtractedInspectionDraft;
  onClose: () => void;
  onApproveSuccess: () => void;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({
  draft,
  onClose,
  onApproveSuccess,
}) => {
  const { defectGroups, defectMaster, addInspectionReport, reports, settings } = useApp();

  // Editable form states initialized from extracted draft
  const initialBrand = resolveBrandFromStyle(draft.styleNumber, draft.buyer || 'ONLY&SONS');
  const [buyer, setBuyer] = useState(initialBrand);
  const [factory, setFactory] = useState(draft.factory || 'NORTHERN FASHION LTD.');
  const [reportNumber, setReportNumber] = useState(draft.reportNumber);
  const [inspectionType, setInspectionType] = useState(draft.inspectionType || 'Final');
  const [inspectionDate, setInspectionDate] = useState(draft.inspectionDate);
  const [orderNumber, setOrderNumber] = useState(draft.orderNumber);
  const [styleNumber, setStyleNumber] = useState(draft.styleNumber);
  const [color, setColor] = useState(draft.color || 'Solid / Melange');
  const [productDescription, setProductDescription] = useState(draft.styleName || draft.productDescription);
  const [orderQuantity, setOrderQuantity] = useState<number>(Number(draft.orderQuantity) || 0);
  const [inspectedQuantity, setInspectedQuantity] = useState<number>(Number(draft.inspectedQuantity) || 0);
  const [inspectionLevel, setInspectionLevel] = useState(draft.inspectionLevel || 'AQL 2.5/2.5 Level II Reduced');

  const [inspector, setInspector] = useState(draft.inspector || '');
  const [poNumber, setPoNumber] = useState(draft.poNumber || draft.orderNumber);

  // User Requirement 5: Inspector Conclusion option with Approved (Blue/Green) / Rejected (Red)
  const [inspectorConclusion, setInspectorConclusion] = useState<'Approved' | 'Rejected'>(
    draft.inspectorConclusion === 'Rejected' || draft.inspectionResult === 'FAILED' ? 'Rejected' : 'Approved'
  );

  const [defects, setDefects] = useState(draft.defects);
  const [showRawText, setShowRawText] = useState(false);

  // Recalculate totals dynamically
  const criticalCount = defects
    .filter((d) => d.severity === 'Critical')
    .reduce((s, d) => s + (Number(d.defectQuantity) || 0), 0);

  const majorCount = defects
    .filter((d) => d.severity === 'Major')
    .reduce((s, d) => s + (Number(d.defectQuantity) || 0), 0);

  const minorCount = defects
    .filter((d) => d.severity === 'Minor')
    .reduce((s, d) => s + (Number(d.defectQuantity) || 0), 0);

  const totalDefects = criticalCount + majorCount + minorCount;

  // Live OQL calculation: (Total Defects / Inspected Quantity) * 100
  const calculatedOql = calculateReportOql(totalDefects, inspectedQuantity, settings.oqlDecimals);

  // Inspection result mirrors Inspector Conclusion
  const [inspectionResult, setInspectionResult] = useState<InspectionResult>(
    draft.inspectionResult || (inspectorConclusion === 'Approved' ? 'PASSED' : 'FAILED')
  );

  // When Inspector Conclusion changes, sync with inspection result
  const handleConclusionChange = (conclusion: 'Approved' | 'Rejected') => {
    setInspectorConclusion(conclusion);
    setInspectionResult(conclusion === 'Approved' ? 'PASSED' : 'FAILED');
  };

  // When Style Number changes, auto-resolve brand:
  const handleStyleNumberChange = (newStyle: string) => {
    setStyleNumber(newStyle);
    const resolved = resolveBrandFromStyle(newStyle, buyer);
    setBuyer(resolved);
  };

  // Validation warnings calculation
  const warnings: string[] = [];

  if (!orderQuantity || orderQuantity <= 0) {
    warnings.push('Order quantity is zero or missing.');
  }
  if (!inspectedQuantity || inspectedQuantity <= 0) {
    warnings.push('Inspected sample quantity must be greater than zero.');
  }
  if (defects.length === 0) {
    warnings.push('No defect rows detected in this report (OQL = 0.00%). Add defect rows manually if needed.');
  }
  if (defects.some((d) => !d.defectQuantity || d.defectQuantity <= 0)) {
    warnings.push('One or more defect rows have zero quantity.');
  }
  if (reports.some((r) => r.reportNumber.toLowerCase() === reportNumber.toLowerCase())) {
    warnings.push(`Report number (${reportNumber}) already exists in the database.`);
  }
  if (!orderNumber || !orderNumber.toUpperCase().includes('NOF')) {
    warnings.push('Order number does not include a standard NOF serial prefix.');
  }

  // Handlers for defect rows
  const handleDefectChange = (index: number, field: string, value: any) => {
    setDefects((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddDefect = () => {
    const newRow = {
      id: `draft-def-${Date.now()}`,
      originalDefectName: 'Manual Defect Item',
      standardDefectName: defectMaster[0]?.standardDefectName || 'Hole / Needle cut / Yarn cut',
      defectGroupId: defectMaster[0]?.defectGroupId || 'dg-fa',
      severity: 'Major' as DefectSeverity,
      defectQuantity: 1,
      remarks: 'Added during validation screen',
    };
    setDefects((prev) => [...prev, newRow]);
  };

  const handleRemoveDefect = (index: number) => {
    setDefects((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveAndApprove = (isDraft: boolean = false) => {
    addInspectionReport({
      buyer,
      brand: buyer,
      factory,
      reportNumber,
      inspectionType,
      inspectionDate,
      orderNumber,
      poNumber: poNumber || orderNumber,
      inspector,
      inspectorConclusion,
      styleNumber,
      styleName: productDescription,
      floor: draft.floor || 'SEW-1',
      section: draft.section || 'SEW-1',
      color,
      productDescription,
      orderQuantity: Number(orderQuantity),
      inspectedQuantity: Number(inspectedQuantity),
      criticalDefectQuantity: criticalCount,
      majorDefectQuantity: majorCount,
      minorDefectQuantity: minorCount,
      totalDefectQuantity: totalDefects,
      defectiveGarmentQuantity: Math.round(totalDefects * 0.85),
      oql: calculatedOql,
      inspectionResult,
      inspectionLevel,
      pdfFileName: draft.pdfFileName,
      extractionStatus: 'Extracted',
      validationStatus: isDraft ? 'Draft' : 'Approved',
      extractionConfidence: draft.extractionConfidence,
      isDemo: false, // Real user uploaded report!
      defects: defects.map((d) => ({
        id: d.id,
        inspectionReportId: '',
        originalDefectName: d.originalDefectName,
        standardDefectName: d.standardDefectName,
        defectGroupId: d.defectGroupId,
        severity: d.severity,
        defectQuantity: Number(d.defectQuantity),
        defectPercentage: totalDefects > 0 ? Number(((Number(d.defectQuantity) / totalDefects) * 100).toFixed(1)) : 0,
        classificationStatus: 'User-Verified',
        remarks: d.remarks || '',
        createdAt: new Date().toISOString(),
      })),
    });

    onApproveSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-sky-900 to-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">
                  Inspection Data Validation &amp; Approval
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> {draft.extractionConfidence}% AI Confidence
                </span>
                {orderNumber.toUpperCase().startsWith('NOF') && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-200 border border-sky-400/30 flex items-center gap-1">
                    <Hash className="w-3 h-3" /> NOF Serial Verified
                  </span>
                )}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30">
                  {inspectionType} Inspection
                </span>
              </div>
              <p className="text-xs text-sky-200 mt-0.5">
                File: <span className="font-semibold text-white">{draft.pdfFileName}</span> &bull; Verify all metrics before committing to the QMS database.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Warnings Banner if any */}
          {warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Validation Notices:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-amber-800 pl-2">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 1: Inspection & NOF Order Information */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-sky-600" />
                1. Extracted Inspection &amp; Order Information
              </h4>

              {draft.rawText && (
                <button
                  type="button"
                  onClick={() => setShowRawText(!showRawText)}
                  className="text-xs text-sky-700 hover:underline flex items-center gap-1 font-semibold"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {showRawText ? 'Hide Raw Text' : 'View Raw Extracted Text'}
                </button>
              )}
            </div>

            {/* Collapsible raw text view */}
            {showRawText && draft.rawText && (
              <div className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono max-h-48 overflow-y-auto whitespace-pre-wrap">
                {draft.rawText}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="col-span-2 p-2 rounded-lg bg-sky-50/50 border border-sky-100">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sky-900 font-bold">
                    Order Number (NOF Serial) *
                  </label>
                  {orderNumber.includes('+') && (
                    <span className="text-[10px] bg-sky-600 text-white font-bold px-1.5 py-0.5 rounded shadow-xs">
                      {orderNumber.split('+').length} Serials Combined
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g. NOF4778898"
                  className="w-full bg-white border border-sky-300 rounded-lg px-2.5 py-1.5 font-bold text-sky-950 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-sky-700 font-semibold">Captured NOF Serials:</span>
                  {orderNumber
                    .split(/\s*[\+,]\s*/)
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0)
                    .map((nof, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono font-bold bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded border border-sky-200"
                      >
                        #{nof}
                      </span>
                    ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Report Number</label>
                <input
                  type="text"
                  value={reportNumber}
                  onChange={(e) => setReportNumber(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Inspection Date</label>
                <input
                  type="date"
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Month: {inspectionDate.slice(0, 7)}
                </span>
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Style Number</label>
                <input
                  type="text"
                  value={styleNumber}
                  onChange={(e) => handleStyleNumberChange(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Prefix: 13 (NAME IT), 15 (ONLY), 22 (ONLY&SONS)
                </span>
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Brand</label>
                <input
                  type="text"
                  value={buyer}
                  onChange={(e) => setBuyer(e.target.value)}
                  placeholder="e.g. ONLY&SONS / NAME IT / ONLY"
                  className="w-full bg-white border border-sky-300 rounded-lg px-2.5 py-1.5 font-bold text-sky-900 focus:outline-none focus:border-sky-500"
                />
                <span className="text-[10px] text-sky-600 font-semibold mt-0.5 block">
                  Auto-mapped from Style: {buyer}
                </span>
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Inspector Name</label>
                <input
                  type="text"
                  value={inspector}
                  onChange={(e) => setInspector(e.target.value)}
                  placeholder="e.g. Salah Uddin / Rifat Chowdhury"
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Factory Name</label>
                <input
                  type="text"
                  value={factory}
                  onChange={(e) => setFactory(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Order Quantity (Pcs)</label>
                <input
                  type="number"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Inspected Sample Size (Qty)</label>
                <input
                  type="number"
                  value={inspectedQuantity}
                  onChange={(e) => setInspectedQuantity(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Inspector Conclusion Option (User Requirement 5) */}
              <div className="col-span-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800">Inspector Conclusion</label>
                  <p className="text-[10px] text-slate-500">
                    Decision: <strong className={inspectorConclusion === 'Approved' ? 'text-emerald-700' : 'text-rose-700'}>{inspectorConclusion}</strong> &bull; Records this style as <strong className={inspectionResult === 'PASSED' ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>{inspectionResult}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleConclusionChange('Approved')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
                      inspectorConclusion === 'Approved'
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approved (PASSED)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleConclusionChange('Rejected')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
                      inspectorConclusion === 'Rejected'
                        ? 'bg-rose-600 text-white ring-2 ring-rose-400'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Rejected (FAILED)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Style Name / Product Description</label>
                <input
                  type="text"
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">Inspection Type (Stage)</label>
                <select
                  value={inspectionType}
                  onChange={(e) => setInspectionType(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:border-sky-500"
                >
                  <option value="Final">Final</option>
                  <option value="Inline">Inline</option>
                  <option value="Pre-Final">Pre-Final</option>
                  <option value="Initial">Initial</option>
                  <option value="Mid-Line">Mid-Line</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-slate-500 font-medium mb-1">Inspection Sampling Method</label>
                <input
                  type="text"
                  value={inspectionLevel}
                  onChange={(e) => setInspectionLevel(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Calculated Observed Quality Level (OQL) & Metrics Summary Box */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-rose-700">Critical</span>
              <div className="text-xl font-extrabold text-rose-800 mt-0.5">{criticalCount}</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-amber-700">Major</span>
              <div className="text-xl font-extrabold text-amber-800 mt-0.5">{majorCount}</div>
            </div>
            <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-sky-700">Minor</span>
              <div className="text-xl font-extrabold text-sky-800 mt-0.5">{minorCount}</div>
            </div>
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-600">Total Defects</span>
              <div className="text-xl font-extrabold text-slate-800 mt-0.5">{totalDefects}</div>
            </div>
            <div className="bg-slate-900 text-white rounded-xl p-3 text-center col-span-2 sm:col-span-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] uppercase font-bold text-sky-400">Observed Quality Level (OQL)</span>
                <select
                  value={inspectionResult}
                  onChange={(e) => setInspectionResult(e.target.value as InspectionResult)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer border focus:outline-none ${
                    inspectionResult === 'PASSED'
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-rose-600 text-white border-rose-400'
                  }`}
                >
                  <option value="PASSED">PASSED</option>
                  <option value="FAILED">FAILED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="RE-INSPECTION">RE-INSPECTION</option>
                </select>
              </div>
              <div className="text-2xl font-black text-white mt-0.5 tracking-tight">
                {calculatedOql.toFixed(2)}%
              </div>
              <div className="text-[9px] text-slate-400">
                Formula: ({totalDefects} &divide; {inspectedQuantity}) &times; 100 | Benchmark Target: {settings.targetOql}%
              </div>
            </div>
          </div>

          {/* Section 3: Extracted Defect Records Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Captured Defect Breakdown ({defects.length})
                </h4>
                <p className="text-[11px] text-slate-500">
                  Original audit text preserved. Review standard defect mapping, severity classification, and unit counts.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddDefect}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold text-xs border border-sky-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Defect Row
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Audit Report Description</th>
                    <th className="py-2.5 px-3">Standard Defect Name</th>
                    <th className="py-2.5 px-3">Defect Group</th>
                    <th className="py-2.5 px-3 w-28">Severity</th>
                    <th className="py-2.5 px-3 w-20 text-center">Quantity</th>
                    <th className="py-2.5 px-3 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {defects.map((def, idx) => (
                    <tr key={def.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={def.originalDefectName}
                          onChange={(e) => handleDefectChange(idx, 'originalDefectName', e.target.value)}
                          className="w-full bg-transparent border-b border-dashed border-slate-300 focus:border-sky-500 focus:outline-none text-slate-800"
                        />
                      </td>

                      <td className="py-2 px-3">
                        <select
                          value={def.standardDefectName}
                          onChange={(e) => {
                            const val = e.target.value;
                            const match = defectMaster.find((dm) => dm.standardDefectName === val);
                            handleDefectChange(idx, 'standardDefectName', val);
                            if (match) {
                              handleDefectChange(idx, 'defectGroupId', match.defectGroupId);
                              handleDefectChange(idx, 'severity', match.severity);
                            }
                          }}
                          className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-800 focus:outline-none focus:border-sky-500"
                        >
                          {!defectMaster.some((dm) => dm.standardDefectName === def.standardDefectName) && def.standardDefectName && (
                            <option value={def.standardDefectName}>{def.standardDefectName}</option>
                          )}
                          {defectMaster.map((dm) => (
                            <option key={dm.id} value={dm.standardDefectName}>
                              {dm.standardDefectName}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-2 px-3">
                        <select
                          value={def.defectGroupId}
                          onChange={(e) => handleDefectChange(idx, 'defectGroupId', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-800 focus:outline-none focus:border-sky-500"
                        >
                          {!defectGroups.some((dg) => dg.id === def.defectGroupId) && def.defectGroupId && (
                            <option value={def.defectGroupId}>{def.defectGroupId}</option>
                          )}
                          {defectGroups.map((dg) => (
                            <option key={dg.id} value={dg.id}>
                              {dg.groupName}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-2 px-3">
                        <select
                          value={def.severity}
                          onChange={(e) => handleDefectChange(idx, 'severity', e.target.value)}
                          className={`w-full font-bold border rounded-md px-2 py-1 focus:outline-none ${
                            def.severity === 'Critical'
                              ? 'bg-rose-50 text-rose-700 border-rose-300'
                              : def.severity === 'Major'
                              ? 'bg-amber-50 text-amber-700 border-amber-300'
                              : 'bg-sky-50 text-sky-700 border-sky-300'
                          }`}
                        >
                          <option value="Critical">Critical</option>
                          <option value="Major">Major</option>
                          <option value="Minor">Minor</option>
                          <option value="Pending Classification">Pending</option>
                        </select>
                      </td>

                      <td className="py-2 px-3 text-center">
                        <input
                          type="number"
                          min="1"
                          value={def.defectQuantity}
                          onChange={(e) => handleDefectChange(idx, 'defectQuantity', Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-16 text-center font-bold bg-white border border-slate-300 rounded-md px-1.5 py-1 text-slate-800 focus:outline-none focus:border-sky-500"
                        />
                      </td>

                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveDefect(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete defect line"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleSaveAndApprove(true)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSaveAndApprove(false)}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve &amp; Save to Database
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
