import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InspectionReport } from '../../types';
import {
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  Edit2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  X,
  ShieldAlert,
  ArrowUpDown,
  FileCheck,
  Calendar,
} from 'lucide-react';
import { exportReportsToExcel } from '../../utils/exportUtils';

export const DatabaseView: React.FC = () => {
  const {
    filteredReports,
    deleteInspectionReport,
    updateInspectionReport,
    clearAllData,
    canManageData,
    settings,
    currentUserRole,
    addNotification,
    setActiveTab,
    isFirebaseConnected,
  } = useApp();

  const [sortField, setSortField] = useState<keyof InspectionReport>('inspectionDate');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<InspectionReport | null>(null);
  const [editingReport, setEditingReport] = useState<InspectionReport | null>(null);
  const [previewPdfReport, setPreviewPdfReport] = useState<InspectionReport | null>(null);
  const [floorFilter, setFloorFilter] = useState<string>('ALL');
  const [deleteTarget, setDeleteTarget] = useState<InspectionReport | null>(null);
  const [showWipeConfirm, setShowWipeConfirm] = useState<boolean>(false);

  const handleWipeAll = async () => {
    await clearAllData();
    setShowWipeConfirm(false);
  };

  // Sorting
  const sortedReports = [...filteredReports].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (typeof aVal === 'string') {
      return sortAsc
        ? (aVal as string).localeCompare(bVal as string)
        : (bVal as string).localeCompare(aVal as string);
    }
    return sortAsc
      ? (Number(aVal) || 0) - (Number(bVal) || 0)
      : (Number(bVal) || 0) - (Number(aVal) || 0);
  });

  // Filtered by Floor (SEW-1, SEW-2, SEW-3)
  const displayReports = sortedReports.filter((r) => {
    if (floorFilter === 'ALL') return true;
    const f = r.floor || r.section || 'SEW-1';
    return f.toUpperCase() === floorFilter.toUpperCase();
  });

  const handleSort = (field: keyof InspectionReport) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport) return;
    updateInspectionReport(editingReport.id, editingReport);
    setEditingReport(null);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Inspection Database
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {filteredReports.length} Records
            </span>
            {isFirebaseConnected && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Firestore Live
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Central repository of approved buyer OQL inspection reports, defect breakdowns, and audit trails.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Floor / Section Filter */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            {['ALL', 'SEW-1', 'SEW-2', 'SEW-3'].map((fl) => (
              <button
                key={fl}
                onClick={() => setFloorFilter(fl)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  floorFilter === fl
                    ? 'bg-white dark:bg-slate-700 text-sky-700 dark:text-sky-300 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {fl === 'ALL' ? 'All Floors' : fl}
              </button>
            ))}
          </div>

          {filteredReports.length > 0 && (
            <button
              onClick={() => setShowWipeConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              title="Delete all inspection data and start fresh from zero"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              Reset to Zero
            </button>
          )}
          <button
            onClick={() => exportReportsToExcel(displayReports)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-sky-600" />
            Export to Excel
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            New Inspection Report
          </button>
        </div>
      </div>

      {/* Main Database Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 select-none">
              <tr>
                <th
                  onClick={() => handleSort('inspectionDate')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100/60"
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('reportNumber')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100/60"
                >
                  <div className="flex items-center gap-1">
                    <span>Report No</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Floor / Section</th>
                <th className="py-3 px-3">Brand</th>
                <th className="py-3 px-3">Order / PO No</th>
                <th className="py-3 px-3">Style Number</th>
                <th
                  onClick={() => handleSort('orderQuantity')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100/60"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Order Qty</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('inspectedQuantity')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100/60"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Inspected</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-2 text-center text-rose-600">Crit</th>
                <th className="py-3 px-2 text-center text-amber-600">Maj</th>
                <th className="py-3 px-2 text-center text-sky-600">Min</th>
                <th
                  onClick={() => handleSort('totalDefectQuantity')}
                  className="py-3 px-2 text-center font-bold cursor-pointer hover:bg-slate-100/60"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Total</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('oql')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100/60"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>OQL (%)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Result</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayReports.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center mx-auto shadow-2xs">
                        <FileText className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">
                        {floorFilter !== 'ALL'
                          ? `No Inspection Records for Floor ${floorFilter}`
                          : 'Clean Database Ready (0 Records)'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {floorFilter !== 'ALL'
                          ? `There are no inspection reports uploaded yet for ${floorFilter}. Switch to 'All Floors' or upload a new report.`
                          : 'No inspection records exist in the database. Upload factory PDF inspection reports to start tracking OQL metrics and defect rankings from zero.'}
                      </p>
                      <button
                        onClick={() => setActiveTab('upload')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <FileText className="w-4 h-4" />
                        Upload First PDF Report
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                displayReports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-700 whitespace-nowrap">
                      {r.inspectionDate}
                    </td>

                    <td className="py-2.5 px-3 font-bold text-sky-800 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{r.reportNumber}</span>
                        {r.isDemo && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                            DEMO
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="font-bold text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs">
                        {r.floor || r.section || 'SEW-1'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="font-bold text-sky-800 dark:text-sky-300 px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-xs">
                        {r.brand || r.buyer || 'ONLY&SONS'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1 max-w-[240px]">
                        {r.orderNumber.includes('+') ? (
                          r.orderNumber.split('+').map((o, idx) => (
                            <span
                              key={idx}
                              className="font-mono text-[10px] font-bold bg-sky-50 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-800/60"
                            >
                              #{o.trim()}
                            </span>
                          ))
                        ) : (
                          <div className="font-bold font-mono text-slate-800 dark:text-slate-100">{r.orderNumber}</div>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-200 font-mono">{r.styleNumber}</div>
                    </td>

                    <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                      {r.orderQuantity?.toLocaleString()}
                    </td>

                    <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                      {r.inspectedQuantity?.toLocaleString()}
                    </td>

                    <td className="py-2.5 px-2 text-center font-bold text-rose-600">
                      {r.criticalDefectQuantity}
                    </td>

                    <td className="py-2.5 px-2 text-center font-bold text-amber-600">
                      {r.majorDefectQuantity}
                    </td>

                    <td className="py-2.5 px-2 text-center font-bold text-sky-600">
                      {r.minorDefectQuantity}
                    </td>

                    <td className="py-2.5 px-2 text-center font-extrabold text-slate-900 bg-slate-50">
                      {r.totalDefectQuantity}
                    </td>

                    <td className="py-2.5 px-3 text-right font-black">
                      <span
                        className={
                          r.oql <= settings.targetOql ? 'text-emerald-600' : 'text-rose-600'
                        }
                      >
                        {r.oql.toFixed(2)}%
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.inspectionResult === 'PASSED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {r.inspectionResult}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedReport(r)}
                          className="p-1 rounded text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                          title="View Details & Defect Breakdown"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setPreviewPdfReport(r)}
                          className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="View Simulated Original PDF"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        {canManageData && (
                          <button
                            onClick={() => setEditingReport({ ...r })}
                            className="p-1 rounded text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Edit Report"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {canManageData && (
                          <button
                            onClick={() => setDeleteTarget(r)}
                            className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Report"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <span>Inspection Report: {selectedReport.reportNumber}</span>
                  {selectedReport.isDemo && (
                    <span className="text-[10px] bg-amber-500/30 text-amber-300 border border-amber-400 px-1.5 py-0.2 rounded font-bold">
                      DEMO DATA
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedReport.buyer} &bull; {selectedReport.orderNumber} ({selectedReport.styleNumber})
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Inspection Date</span>
                  <span className="font-bold text-slate-800">{selectedReport.inspectionDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Inspected Quantity</span>
                  <span className="font-bold text-slate-800">{selectedReport.inspectedQuantity} pcs</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Total Defects</span>
                  <span className="font-bold text-slate-800">{selectedReport.totalDefectQuantity}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Official OQL</span>
                  <span
                    className={`font-black text-sm ${
                      selectedReport.oql <= settings.targetOql ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {selectedReport.oql.toFixed(2)}% ({selectedReport.inspectionResult})
                  </span>
                </div>
              </div>

              {/* Defect List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Recorded Defects Breakdown ({selectedReport.defects?.length || 0})
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold">
                      <tr>
                        <th className="py-2 px-3">Original Description</th>
                        <th className="py-2 px-3">Standard Defect</th>
                        <th className="py-2 px-3">Severity</th>
                        <th className="py-2 px-3 text-right">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedReport.defects || []).map((d) => (
                        <tr key={d.id}>
                          <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                            {d.originalDefectName}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800">
                            {d.standardDefectName}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                d.severity === 'Critical'
                                  ? 'bg-rose-100 text-rose-800'
                                  : d.severity === 'Major'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-sky-100 text-sky-800'
                              }`}
                            >
                              {d.severity}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            {d.defectQuantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Audit Trail */}
              {selectedReport.auditLogs && selectedReport.auditLogs.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Audit Logging History
                  </h4>
                  <div className="space-y-1.5">
                    {selectedReport.auditLogs.map((log, i) => (
                      <div
                        key={i}
                        className="text-xs bg-slate-50 border border-slate-200 p-2 rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-slate-800">{log.action}</span> &bull;{' '}
                          <span className="text-slate-500">{log.details}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(log.timestamp).toLocaleString()} by {log.user}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-3 text-right">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Report Modal */}
      {editingReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Edit Inspection: {editingReport.reportNumber}
              </h3>
              <button type="button" onClick={() => setEditingReport(null)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Inspection Date</label>
                <input
                  type="date"
                  value={editingReport.inspectionDate}
                  onChange={(e) =>
                    setEditingReport({ ...editingReport, inspectionDate: e.target.value })
                  }
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Order Quantity</label>
                <input
                  type="number"
                  value={editingReport.orderQuantity}
                  onChange={(e) =>
                    setEditingReport({
                      ...editingReport,
                      orderQuantity: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Inspected Sample Quantity</label>
                <input
                  type="number"
                  value={editingReport.inspectedQuantity}
                  onChange={(e) =>
                    setEditingReport({
                      ...editingReport,
                      inspectedQuantity: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Inspection Result</label>
                <select
                  value={editingReport.inspectionResult}
                  onChange={(e) =>
                    setEditingReport({
                      ...editingReport,
                      inspectionResult: e.target.value as any,
                    })
                  }
                  className="w-full border rounded-lg p-2 font-bold"
                >
                  <option value="PASSED">PASSED</option>
                  <option value="FAILED">FAILED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="RE-INSPECTION">RE-INSPECTION</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setEditingReport(null)}
                className="px-3 py-1.5 border rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-bold"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Simulated Original PDF Document Preview */}
      {previewPdfReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-300 overflow-hidden">
            <div className="bg-slate-800 text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold tracking-wide">
                  Original Document Preview &bull; {previewPdfReport.pdfFileName || 'BESTSELLER_INSPECTION.pdf'}
                </span>
              </div>
              <button onClick={() => setPreviewPdfReport(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document sheet representation */}
            <div className="p-8 overflow-y-auto bg-slate-100 flex-1">
              <div className="bg-white shadow-md border border-slate-200 p-8 max-w-2xl mx-auto space-y-6 text-xs text-slate-800">
                <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-slate-900">
                      BESTSELLER OBSERVED QUALITY AUDIT
                    </h2>
                    <p className="text-[11px] text-slate-500">
                      Official Vendor Inspection Certificate &bull; Northern Fashions Ltd.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold">{previewPdfReport.reportNumber}</div>
                    <div className="text-[10px] text-slate-500">Date: {previewPdfReport.inspectionDate}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border border-slate-200 p-3 bg-slate-50 rounded">
                  <div><strong>Buyer:</strong> {previewPdfReport.buyer}</div>
                  <div><strong>Vendor/Factory:</strong> {previewPdfReport.factory}</div>
                  <div><strong>Inspector:</strong> {previewPdfReport.inspector || 'Rifat Chowdhury'}</div>
                  <div><strong>Order / PO #:</strong> {previewPdfReport.poNumber || previewPdfReport.orderNumber}</div>
                  <div><strong>Style #:</strong> {previewPdfReport.styleNumber}</div>
                  <div><strong>Product:</strong> {previewPdfReport.productDescription}</div>
                  <div><strong>Order Quantity:</strong> {previewPdfReport.orderQuantity.toLocaleString()} pcs</div>
                  <div><strong>Inspected Quantity:</strong> {previewPdfReport.inspectedQuantity} pcs</div>
                  <div><strong>Inspection Level:</strong> {previewPdfReport.inspectionLevel}</div>
                </div>

                <div className="border border-slate-200 rounded overflow-hidden">
                  <div className="bg-slate-200 px-3 py-1.5 font-bold text-[11px]">
                    Defect Findings & Severity Classification
                  </div>
                  <table className="w-full text-[11px]">
                    <thead className="bg-slate-100 border-b">
                      <tr>
                        <th className="p-2 text-left">Inspector Description</th>
                        <th className="p-2 text-left">Standard Defect</th>
                        <th className="p-2 text-center">Severity</th>
                        <th className="p-2 text-right">Defect Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(previewPdfReport.defects || []).map((d, i) => (
                        <tr key={i}>
                          <td className="p-2">{d.originalDefectName}</td>
                          <td className="p-2 font-semibold">{d.standardDefectName}</td>
                          <td className="p-2 text-center">{d.severity}</td>
                          <td className="p-2 text-right font-bold">{d.defectQuantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-sky-50 border border-sky-200 p-4 rounded flex justify-between items-center">
                  <div>
                    <div className="font-bold text-sky-950">
                      Calculated Observed Quality Level (OQL)
                    </div>
                    <div className="text-[10px] text-sky-700">
                      Formula: ({previewPdfReport.totalDefectQuantity} defects / {previewPdfReport.inspectedQuantity} inspected) &times; 100
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-black text-sky-900">{previewPdfReport.oql.toFixed(2)}%</div>
                    <div className="font-bold text-xs uppercase text-slate-800">
                      Verdict: {previewPdfReport.inspectionResult}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t flex justify-between text-[10px] text-slate-400">
                  <div>Inspector: QMS Lead Bangladesh</div>
                  <div>Quality Director: Confirmed</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 border-t border-slate-200 p-3 text-right">
              <button
                onClick={() => setPreviewPdfReport(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Report In-UI Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Inspection Report?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you sure you want to permanently remove report{' '}
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {deleteTarget.reportNumber}
                </span>{' '}
                ({deleteTarget.orderNumber})? This will update all OQL stats and remove it from Firestore.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetId = deleteTarget.id;
                  setDeleteTarget(null);
                  await deleteInspectionReport(targetId);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Yes, Delete Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset to Zero In-UI Confirmation Modal */}
      {showWipeConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Reset App to Zero (Clean Slate)?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This will wipe all {filteredReports.length} inspection reports, defect records, and audit logs so you can start completely fresh from 0. This cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowWipeConfirm(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleWipeAll}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Yes, Reset All to Zero
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
