import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MonitoringRecord, EffectivenessStatus } from '../../types';
import { calculateReductionPercentage } from '../../utils/oqlCalculator';
import {
  Activity,
  Plus,
  CheckCircle2,
  XCircle,
  TrendingDown,
  FileCheck,
  Trash2,
  X,
  FileText,
  AlertTriangle,
} from 'lucide-react';

export const MonitoringView: React.FC = () => {
  const { monitoringRecords, addMonitoringRecord, deleteMonitoringRecord, capas, canManageData } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCapaId, setSelectedCapaId] = useState(capas[0]?.id || '');
  const [monitoringDate, setMonitoringDate] = useState(new Date().toISOString().split('T')[0]);
  const [responsiblePerson, setResponsiblePerson] = useState('Engr. M. Rahman');
  const [monitoringFrequency, setMonitoringFrequency] = useState('Daily Audit (Cycle 15)');
  const [previousDefectQty, setPreviousDefectQty] = useState<number>(8);
  const [currentDefectQty, setCurrentDefectQty] = useState<number>(1);
  const [monitoringRemarks, setMonitoringRemarks] = useState('Sample audit of 100 garments confirmed sustained quality.');
  const [evidenceUrl, setEvidenceUrl] = useState('quality_audit_verification_oct30.pdf');

  // Compute live reduction preview
  const liveReduction = calculateReductionPercentage(previousDefectQty, currentDefectQty);

  const handleCapaSelect = (id: string) => {
    setSelectedCapaId(id);
    const selected = capas.find((c) => c.id === id);
    if (selected) {
      setPreviousDefectQty(selected.defectQuantity);
      setCurrentDefectQty(0);
      setResponsiblePerson(selected.responsiblePerson.split('(')[0].trim());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selected = capas.find((c) => c.id === selectedCapaId);
    const reduction = calculateReductionPercentage(previousDefectQty, currentDefectQty);

    let effectiveness: EffectivenessStatus = 'Under Monitoring';
    if (reduction !== null && reduction >= 75) {
      effectiveness = 'Effective';
    } else if (reduction !== null && reduction <= 0) {
      effectiveness = 'Ineffective';
    }

    addMonitoringRecord({
      capaId: selectedCapaId,
      capaCode: selected?.capaId || 'CAPA-GEN',
      monitoringDate,
      responsiblePerson,
      monitoringFrequency,
      previousDefectQuantity: previousDefectQty,
      currentDefectQuantity: currentDefectQty,
      reductionPercentage: reduction,
      effectivenessStatus: effectiveness,
      monitoringRemarks,
      evidenceUrl,
      isDemo: false,
    });

    setShowAddModal(false);
  };

  // Metrics
  const totalMonitored = monitoringRecords.length;
  const effectiveCount = monitoringRecords.filter((m) => m.effectivenessStatus === 'Effective').length;
  const underMonitoringCount = monitoringRecords.filter((m) => m.effectivenessStatus === 'Under Monitoring').length;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Monitoring & Effectiveness Tracking
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Sustained Improvement
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate whether implemented CAPAs have demonstrably reduced recurring garment defects before case closure.
          </p>
        </div>

        {canManageData && (
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Record Monitoring Audit
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Audit Cycles Tracked
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalMonitored}</div>
          <div className="text-[10px] text-slate-400 mt-1">Periodic verification audits</div>
        </div>

        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
            Effective Resolutions
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-1">{effectiveCount}</div>
          <div className="text-[10px] text-emerald-700 mt-1">Sustained defect reduction &ge; 75%</div>
        </div>

        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
            Active Follow-ups
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1">{underMonitoringCount}</div>
          <div className="text-[10px] text-amber-700 mt-1">Under ongoing sampling intervals</div>
        </div>
      </div>

      {/* Monitoring Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Effectiveness Verification Records ({monitoringRecords.length})
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">
            Formula: ((Prev Qty - Curr Qty) / Prev Qty) &times; 100
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Linked CAPA</th>
                <th className="py-2.5 px-3">Monitoring Cycle</th>
                <th className="py-2.5 px-3 text-center">Previous Qty</th>
                <th className="py-2.5 px-3 text-center">Current Qty</th>
                <th className="py-2.5 px-3 text-center">Defect Reduction</th>
                <th className="py-2.5 px-3">Effectiveness Status</th>
                <th className="py-2.5 px-3">Remarks / Evidence</th>
                {canManageData && <th className="py-2.5 px-3 text-center"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monitoringRecords.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-700 whitespace-nowrap">
                    {m.monitoringDate}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-sky-800 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span>{m.capaCode}</span>
                      {m.isDemo && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-800">
                          DEMO
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 font-medium">
                    <div>{m.monitoringFrequency}</div>
                    <div className="text-[10px] text-slate-400">By {m.responsiblePerson}</div>
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                    {m.previousDefectQuantity}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                    {m.currentDefectQuantity}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {m.reductionPercentage !== null ? (
                      <span
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-black text-xs ${
                          m.reductionPercentage >= 70
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.reductionPercentage > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        <TrendingDown className="w-3 h-3" />
                        {m.reductionPercentage}%
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium text-[11px]">Not Applicable</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.effectivenessStatus === 'Effective'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : m.effectivenessStatus === 'Ineffective'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {m.effectivenessStatus}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 max-w-xs">
                    <div className="line-clamp-2">{m.monitoringRemarks}</div>
                    {m.evidenceUrl && (
                      <div className="flex items-center gap-1 text-[10px] text-sky-600 mt-0.5">
                        <FileText className="w-3 h-3" />
                        <span>Evidence: {m.evidenceUrl}</span>
                      </div>
                    )}
                  </td>
                  {canManageData && (
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => deleteMonitoringRecord(m.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Monitoring Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200"
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-600" />
                Record Effectiveness Monitoring Check
              </h3>
              <button type="button" onClick={() => setShowAddModal(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Target CAPA Plan</label>
                <select
                  value={selectedCapaId}
                  onChange={(e) => handleCapaSelect(e.target.value)}
                  className="w-full border rounded-lg p-2 font-bold"
                >
                  {capas.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.capaId} &bull; {c.defectName} ({c.orderNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Audit Date</label>
                  <input
                    type="date"
                    required
                    value={monitoringDate}
                    onChange={(e) => setMonitoringDate(e.target.value)}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Auditor / Responsible</label>
                  <input
                    type="text"
                    required
                    value={responsiblePerson}
                    onChange={(e) => setResponsiblePerson(e.target.value)}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Monitoring Cycle / Frequency</label>
                <input
                  type="text"
                  value={monitoringFrequency}
                  onChange={(e) => setMonitoringFrequency(e.target.value)}
                  placeholder="e.g. Daily Check, Weekly Pull Test, Lot 2 Random Audit"
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-slate-500 mb-1">Previous Defect Qty</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={previousDefectQty}
                    onChange={(e) => setPreviousDefectQty(parseInt(e.target.value) || 0)}
                    className="w-full border rounded-lg p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Current Defect Qty</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={currentDefectQty}
                    onChange={(e) => setCurrentDefectQty(parseInt(e.target.value) || 0)}
                    className="w-full border rounded-lg p-2 font-bold"
                  />
                </div>
                <div className="col-span-2 pt-1 border-t flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">Calculated Reduction:</span>
                  <span className="font-extrabold text-sm text-emerald-600">
                    {liveReduction !== null ? `${liveReduction}%` : 'N/A'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Monitoring Remarks & Observations</label>
                <textarea
                  rows={2}
                  value={monitoringRemarks}
                  onChange={(e) => setMonitoringRemarks(e.target.value)}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Evidence Reference / Document</label>
                <input
                  type="text"
                  value={evidenceUrl}
                  onChange={(e) => setEvidenceUrl(e.target.value)}
                  placeholder="e.g. audit_photo_01.jpg or tensile_sheet.pdf"
                  className="w-full border rounded-lg p-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 border rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-bold"
              >
                Save Monitoring Record
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
