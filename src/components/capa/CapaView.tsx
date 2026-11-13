import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CAPARecord, CapaStatus, EffectivenessStatus } from '../../types';
import {
  ShieldAlert,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Eye,
  Trash2,
  Edit2,
  X,
  FileCheck,
  Zap,
} from 'lucide-react';
import { exportCapaToExcel } from '../../utils/exportUtils';

export const CapaView: React.FC = () => {
  const {
    capas,
    addCapa,
    updateCapa,
    deleteCapa,
    reports,
    defectGroups,
    canManageData,
    addNotification,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedCapa, setSelectedCapa] = useState<CAPARecord | null>(null);
  const [editingCapa, setEditingCapa] = useState<CAPARecord | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Auto-sync defects from uploaded inspection reports into CAPA
  const handleSyncDefectsFromReports = () => {
    const existingDefectNames = new Set(capas.map((c) => (c.defectName || '').trim().toLowerCase()));
    const defectMap = new Map<string, { qty: number; report: (typeof reports)[0]; defectObj: any }>();

    reports.forEach((r) => {
      (r.defects || []).forEach((d) => {
        const name = (d.standardDefectName || d.originalDefectName || '').trim();
        if (name) {
          const curr = defectMap.get(name) || { qty: 0, report: r, defectObj: d };
          curr.qty += Number(d.defectQuantity) || 1;
          defectMap.set(name, curr);
        }
      });
    });

    let addedCount = 0;
    const sorted = Array.from(defectMap.entries()).sort((a, b) => b[1].qty - a[1].qty);

    sorted.forEach(([name, info]) => {
      if (!existingDefectNames.has(name.toLowerCase())) {
        addCapa({
          capaId: `CAPA-${new Date().getFullYear()}-${String(capas.length + addedCount + 1).padStart(3, '0')}`,
          inspectionReportId: info.report.id,
          reportNumber: info.report.reportNumber,
          orderNumber: info.report.orderNumber,
          styleNumber: info.report.styleNumber,
          buyer: info.report.buyer,
          defectName: name,
          defectGroup: info.defectObj.defectGroupId ? `Group ${info.defectObj.defectGroupId}` : 'Cleanliness & Workmanship',
          defectSeverity: (info.defectObj.severity as any) || 'Major',
          defectQuantity: info.qty,
          rootCause: '',
          fiveWhyAnalysis: { why1: '', why2: '', why3: '', why4: '', why5: '' },
          correction: '',
          correctiveAction: '',
          preventiveAction: '',
          responsiblePerson: 'Quality & Production Lead',
          responsibleDepartment: 'Sewing & Finishing',
          targetCompletionDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          monitoringFrequency: 'Weekly',
          monitoringMethod: 'Daily 50 garments random end-line audit',
          capaStatus: 'Open',
          effectivenessStatus: 'Under Monitoring',
          showOnDashboard: true, // Default to showing on dashboard
          isDemo: false,
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      addNotification('success', `Created ${addedCount} CAPA action plan slots from highest reported defects (pushed to Dashboard).`);
    } else if (defectMap.size === 0) {
      addNotification('info', 'Upload factory inspection PDF reports first to extract defects into CAPA.');
    } else {
      addNotification('info', 'All defects from current reports already exist in the CAPA log.');
    }
  };

  // Form State for creating/editing CAPA
  const [formData, setFormData] = useState({
    capaId: `CAPA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    reportNumber: reports[0]?.reportNumber || 'BS-OQL-2026-1015-01',
    orderNumber: reports[0]?.orderNumber || 'DEMO-001',
    styleNumber: reports[0]?.styleNumber || 'DEMO-STYLE-001',
    buyer: reports[0]?.buyer || 'BESTSELLER',
    defectName: 'Broken Stitching',
    defectGroup: 'Seams & Stitching',
    defectSeverity: 'Major' as any,
    defectQuantity: 8,
    rootCause: '',
    why1: '',
    why2: '',
    why3: '',
    why4: '',
    why5: '',
    correction: '',
    correctiveAction: '',
    preventiveAction: '',
    responsiblePerson: '',
    responsibleDepartment: 'Sewing Quality & Maintenance',
    targetCompletionDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    monitoringFrequency: 'Weekly' as any,
    monitoringMethod: 'Daily 50 garments random end-line audit and tensile strength check.',
    capaStatus: 'Open' as CapaStatus,
    effectivenessStatus: 'Under Monitoring' as EffectivenessStatus,
  });

  // Calculate Dashboard Counters
  const totalCapa = capas.length;
  const openCapa = capas.filter((c) => c.capaStatus === 'Open').length;
  const inProgressCapa = capas.filter((c) => c.capaStatus === 'In Progress').length;
  const pendingVerification = capas.filter((c) => c.capaStatus === 'Pending Verification').length;
  const effectiveCapa = capas.filter((c) => c.effectivenessStatus === 'Effective' || c.capaStatus === 'Effective').length;
  const ineffectiveCapa = capas.filter((c) => c.effectivenessStatus === 'Ineffective' || c.capaStatus === 'Ineffective').length;
  const closedCapa = capas.filter((c) => c.capaStatus === 'Closed').length;

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueCapa = capas.filter(
    (c) => c.targetCompletionDate < todayStr && c.capaStatus !== 'Closed' && c.capaStatus !== 'Effective'
  ).length;

  // Filtered CAPA records
  const filteredCapas = capas.filter((c) => {
    if (statusFilter !== 'ALL' && c.capaStatus !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        c.capaId.toLowerCase().includes(q) ||
        c.defectName.toLowerCase().includes(q) ||
        c.responsiblePerson.toLowerCase().includes(q) ||
        c.orderNumber.toLowerCase().includes(q) ||
        c.reportNumber.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCapa({
      capaId: formData.capaId,
      inspectionReportId: '',
      reportNumber: formData.reportNumber,
      orderNumber: formData.orderNumber,
      styleNumber: formData.styleNumber,
      buyer: formData.buyer,
      defectName: formData.defectName,
      defectGroup: formData.defectGroup,
      defectSeverity: formData.defectSeverity,
      defectQuantity: Number(formData.defectQuantity) || 1,
      rootCause: formData.rootCause,
      fiveWhyAnalysis: {
        why1: formData.why1,
        why2: formData.why2,
        why3: formData.why3,
        why4: formData.why4,
        why5: formData.why5,
      },
      correction: formData.correction,
      correctiveAction: formData.correctiveAction,
      preventiveAction: formData.preventiveAction,
      responsiblePerson: formData.responsiblePerson,
      responsibleDepartment: formData.responsibleDepartment,
      targetCompletionDate: formData.targetCompletionDate,
      monitoringFrequency: formData.monitoringFrequency,
      monitoringMethod: formData.monitoringMethod,
      effectivenessStatus: formData.effectivenessStatus,
      capaStatus: formData.capaStatus,
      isDemo: false,
    });
    setShowCreateModal(false);
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* Top Banner matching Excel Mockup */}
      <div className="bg-[#c6e0b4] dark:bg-emerald-950/70 border border-[#a9d08e] dark:border-emerald-800 px-4 py-2.5 rounded-t-md shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-[#dc2626] dark:text-red-500 tracking-wide font-sans">
            RCA &amp; CAPA
          </h1>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Root Cause Analysis &amp; Corrective / Preventive Action Plans
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManageData && (
            <button
              onClick={handleSyncDefectsFromReports}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              title="Automatically scan inspection reports and generate CAPA rows for the highest frequency defects"
            >
              <Zap className="w-3.5 h-3.5" />
              Auto-Sync Highest Defects
            </button>
          )}
          <button
            onClick={() => exportCapaToExcel(filteredCapas)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-sky-600" />
            Export CAPA Log
          </button>
          {canManageData && (
            <button
              onClick={() => {
                setFormData({
                  ...formData,
                  capaId: `CAPA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
                });
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New 5-Why CAPA Plan
            </button>
          )}
        </div>
      </div>


      {/* CAPA Status Dashboard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs text-center">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Total CAPA</span>
          <div className="text-xl font-black text-slate-900 mt-0.5">{totalCapa}</div>
        </div>
        <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 shadow-2xs text-center">
          <span className="text-[10px] font-bold text-amber-700 uppercase">Open</span>
          <div className="text-xl font-black text-amber-800 mt-0.5">{openCapa}</div>
        </div>
        <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 shadow-2xs text-center">
          <span className="text-[10px] font-bold text-rose-700 uppercase">Overdue</span>
          <div className="text-xl font-black text-rose-800 mt-0.5">{overdueCapa}</div>
        </div>
        <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 shadow-2xs text-center">
          <span className="text-[10px] font-bold text-blue-700 uppercase">In Progress</span>
          <div className="text-xl font-black text-blue-800 mt-0.5">{inProgressCapa}</div>
        </div>
        <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200 shadow-2xs text-center">
          <span className="text-[10px] font-bold text-indigo-700 uppercase">Pending Verif</span>
          <div className="text-xl font-black text-indigo-800 mt-0.5">{pendingVerification}</div>
        </div>
        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 shadow-2xs text-center">
          <span className="text-[10px] font-bold text-emerald-700 uppercase">Effective</span>
          <div className="text-xl font-black text-emerald-800 mt-0.5">{effectiveCapa}</div>
        </div>
        <div className="bg-orange-50 p-3 rounded-xl border border-orange-200 shadow-2xs text-center">
          <span className="text-[10px] font-bold text-orange-700 uppercase">Ineffective</span>
          <div className="text-xl font-black text-orange-800 mt-0.5">{ineffectiveCapa}</div>
        </div>
        <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 shadow-2xs text-center">
          <span className="text-[10px] font-bold text-slate-600 uppercase">Closed</span>
          <div className="text-xl font-black text-slate-800 mt-0.5">{closedCapa}</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="relative w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search CAPA ID, defect, responsible..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-semibold mr-1">Status:</span>
          {['ALL', 'Open', 'In Progress', 'Pending Verification', 'Effective', 'Closed'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* CAPA Table matching User Format */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center">SL</th>
                <th className="py-2.5 px-3 min-w-[130px]">Defect Name</th>
                <th className="py-2.5 px-3 min-w-[170px]">Root Cause</th>
                <th className="py-2.5 px-3 min-w-[170px]">Corrective Action</th>
                <th className="py-2.5 px-3 min-w-[170px]">Preventive Action</th>
                <th className="py-2.5 px-3 min-w-[120px]">Responsible Person</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center min-w-[170px]">Push to Dashboard &amp; Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCapas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <p className="font-bold text-sm text-slate-600 dark:text-slate-300">No CAPA records created yet.</p>
                    <p className="text-xs text-slate-400 mt-1">Click "New 5-Why CAPA Plan" or "Auto-Sync Highest Defects" above. It will automatically reflect in the Dashboard.</p>
                  </td>
                </tr>
              ) : (
                filteredCapas.map((c, idx) => {
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                        {idx + 1}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-800 dark:text-slate-100">{c.defectName}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">{c.defectGroup} &bull; Qty: {c.defectQuantity}</div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed line-clamp-3">
                          {c.rootCause || c.fiveWhyAnalysis?.why5 || 'Improper machine feed differential & tension setting.'}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed line-clamp-3">
                          {c.correctiveAction || c.correction || 'Immediate 100% sorting of lot & re-align sewing guide folder.'}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed line-clamp-3">
                          {c.preventiveAction || 'Operator retraining on SPI standards and hourly machine calibration audit.'}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">{c.responsiblePerson}</div>
                        <div className="text-[10px] text-slate-400">{c.responsibleDepartment}</div>
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.capaStatus === 'Closed' || c.capaStatus === 'Effective'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : c.capaStatus === 'In Progress'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {c.capaStatus}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Push to Dashboard Toggle Switch */}
                          <button
                            onClick={() => updateCapa(c.id, { showOnDashboard: c.showOnDashboard === false ? true : !c.showOnDashboard })}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold border inline-flex items-center gap-1 cursor-pointer transition-colors ${
                              c.showOnDashboard !== false
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                            title={c.showOnDashboard !== false ? 'Shown on Dashboard. Click to remove.' : 'Click to push this CAPA item to the Main Dashboard'}
                          >
                            {c.showOnDashboard !== false ? '✓ On Dashboard' : '+ Push to Dash'}
                          </button>

                          {canManageData && (
                            <button
                              onClick={() => setEditingCapa(c)}
                              title="Edit Root Cause & CAPA Actions"
                              className="p-1 rounded text-slate-500 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedCapa(c)}
                            title="View 5-Why Plan"
                            className="p-1 rounded text-slate-500 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {canManageData && (
                            <button
                              onClick={() => {
                                deleteCapa(c.id);
                              }}
                              title="Delete CAPA record"
                              className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View 5-Why Details Modal */}
      {selectedCapa && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <span>{selectedCapa.capaId}: 5-Why Root Cause Analysis</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-semibold">
                    {selectedCapa.capaStatus}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Order {selectedCapa.orderNumber} &bull; Defect: {selectedCapa.defectName} ({selectedCapa.defectQuantity} pcs)
                </p>
              </div>
              <button onClick={() => setSelectedCapa(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-800">
              {/* Root Cause Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px] block mb-1">
                  Identified Primary Root Cause
                </span>
                <p className="text-amber-950 font-medium leading-relaxed">
                  {selectedCapa.rootCause}
                </p>
              </div>

              {/* 5-Why Cascade */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2.5">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                  5-Why Root Cause Breakdown
                </h4>
                <div className="space-y-1.5 pl-2 border-l-2 border-sky-500">
                  <p><strong>Why 1:</strong> {selectedCapa.fiveWhyAnalysis.why1}</p>
                  <p><strong>Why 2:</strong> {selectedCapa.fiveWhyAnalysis.why2}</p>
                  <p><strong>Why 3:</strong> {selectedCapa.fiveWhyAnalysis.why3}</p>
                  <p><strong>Why 4:</strong> {selectedCapa.fiveWhyAnalysis.why4}</p>
                  <p><strong>Why 5:</strong> {selectedCapa.fiveWhyAnalysis.why5}</p>
                </div>
              </div>

              {/* Action Plan */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="font-bold text-slate-500 text-[10px] uppercase block mb-1">1. Correction (Containment)</span>
                  <p className="text-slate-700">{selectedCapa.correction}</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="font-bold text-slate-500 text-[10px] uppercase block mb-1">2. Corrective Action (Fix)</span>
                  <p className="text-slate-700">{selectedCapa.correctiveAction}</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="font-bold text-slate-500 text-[10px] uppercase block mb-1">3. Preventive Action (Recurrence)</span>
                  <p className="text-slate-700">{selectedCapa.preventiveAction}</p>
                </div>
              </div>

              {/* Execution details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">Responsible</span>
                  <span className="font-bold">{selectedCapa.responsiblePerson}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Department</span>
                  <span className="font-bold">{selectedCapa.responsibleDepartment}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Monitoring Frequency</span>
                  <span className="font-bold">{selectedCapa.monitoringFrequency}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Target Date</span>
                  <span className="font-bold">{selectedCapa.targetCompletionDate}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-3 text-right">
              <button
                onClick={() => setSelectedCapa(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New 5-Why CAPA Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSubmit}
            className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden"
          >
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-sky-400" />
                Initiate New Corrective & Preventive Action (CAPA)
              </h3>
              <button type="button" onClick={() => setShowCreateModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">CAPA ID</label>
                  <input
                    type="text"
                    required
                    value={formData.capaId}
                    onChange={(e) => setFormData({ ...formData, capaId: e.target.value })}
                    className="w-full border rounded-lg p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Order Number</label>
                  <input
                    type="text"
                    required
                    value={formData.orderNumber}
                    onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Defect Name</label>
                  <input
                    type="text"
                    required
                    value={formData.defectName}
                    onChange={(e) => setFormData({ ...formData, defectName: e.target.value })}
                    className="w-full border rounded-lg p-2 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Primary Root Cause Summary</label>
                <textarea
                  required
                  rows={2}
                  value={formData.rootCause}
                  onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
                  placeholder="Detail the root cause identified via physical investigation..."
                  className="w-full border rounded-lg p-2"
                />
              </div>

              {/* 5 Why Section */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-700 block">5-Why Root Cause Inquiry</span>
                <input
                  type="text"
                  placeholder="Why 1: Why did the immediate defect occur?"
                  value={formData.why1}
                  onChange={(e) => setFormData({ ...formData, why1: e.target.value })}
                  className="w-full border rounded p-1.5 bg-white"
                />
                <input
                  type="text"
                  placeholder="Why 2: Why did that condition exist?"
                  value={formData.why2}
                  onChange={(e) => setFormData({ ...formData, why2: e.target.value })}
                  className="w-full border rounded p-1.5 bg-white"
                />
                <input
                  type="text"
                  placeholder="Why 3: Why was it not caught earlier?"
                  value={formData.why3}
                  onChange={(e) => setFormData({ ...formData, why3: e.target.value })}
                  className="w-full border rounded p-1.5 bg-white"
                />
                <input
                  type="text"
                  placeholder="Why 4: Why did standard checks fail?"
                  value={formData.why4}
                  onChange={(e) => setFormData({ ...formData, why4: e.target.value })}
                  className="w-full border rounded p-1.5 bg-white"
                />
                <input
                  type="text"
                  placeholder="Why 5: Systemic root cause"
                  value={formData.why5}
                  onChange={(e) => setFormData({ ...formData, why5: e.target.value })}
                  className="w-full border rounded p-1.5 bg-white"
                />
              </div>

              {/* Actions */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Correction (Containment)</label>
                  <textarea
                    rows={2}
                    value={formData.correction}
                    onChange={(e) => setFormData({ ...formData, correction: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Corrective Action (Fix)</label>
                  <textarea
                    rows={2}
                    value={formData.correctiveAction}
                    onChange={(e) => setFormData({ ...formData, correctiveAction: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Preventive Action (System)</label>
                  <textarea
                    rows={2}
                    value={formData.preventiveAction}
                    onChange={(e) => setFormData({ ...formData, preventiveAction: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Responsible Person</label>
                  <input
                    type="text"
                    required
                    value={formData.responsiblePerson}
                    onChange={(e) => setFormData({ ...formData, responsiblePerson: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.responsibleDepartment}
                    onChange={(e) => setFormData({ ...formData, responsibleDepartment: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Target Completion Date</label>
                  <input
                    type="date"
                    required
                    value={formData.targetCompletionDate}
                    onChange={(e) => setFormData({ ...formData, targetCompletionDate: e.target.value })}
                    className="w-full border rounded-lg p-2"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 border rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-bold"
              >
                Create CAPA Plan
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Edit CAPA Modal */}
      {editingCapa && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-2xl w-full max-h-[92vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-sky-400" />
                  Edit CAPA Plan: {editingCapa.capaId} ({editingCapa.defectName})
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Update root cause, actions, responsible owner, and dashboard visibility
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCapa(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Defect Name</label>
                  <input
                    type="text"
                    value={editingCapa.defectName}
                    onChange={(e) => setEditingCapa({ ...editingCapa, defectName: e.target.value })}
                    className="w-full border rounded-lg p-2 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Status</label>
                  <select
                    value={editingCapa.capaStatus}
                    onChange={(e) => setEditingCapa({ ...editingCapa, capaStatus: e.target.value as any })}
                    className="w-full border rounded-lg p-2 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-semibold"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Pending Verification">Pending Verification</option>
                    <option value="Effective">Effective</option>
                    <option value="Ineffective">Ineffective</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                  Root Cause (Identified Cause)
                </label>
                <textarea
                  rows={2}
                  value={editingCapa.rootCause}
                  onChange={(e) => setEditingCapa({ ...editingCapa, rootCause: e.target.value })}
                  placeholder="Explain why this defect occurred..."
                  className="w-full border rounded-lg p-2 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                    Corrective Action (Immediate Fix)
                  </label>
                  <textarea
                    rows={2}
                    value={editingCapa.correctiveAction}
                    onChange={(e) => setEditingCapa({ ...editingCapa, correctiveAction: e.target.value })}
                    placeholder="Immediate containment or repair action..."
                    className="w-full border rounded-lg p-2 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">
                    Preventive Action (Systemic Prevention)
                  </label>
                  <textarea
                    rows={2}
                    value={editingCapa.preventiveAction}
                    onChange={(e) => setEditingCapa({ ...editingCapa, preventiveAction: e.target.value })}
                    placeholder="Prevent recurrence across future batches..."
                    className="w-full border rounded-lg p-2 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Responsible Person</label>
                  <input
                    type="text"
                    value={editingCapa.responsiblePerson}
                    onChange={(e) => setEditingCapa({ ...editingCapa, responsiblePerson: e.target.value })}
                    className="w-full border rounded-lg p-2 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Department</label>
                  <input
                    type="text"
                    value={editingCapa.responsibleDepartment}
                    onChange={(e) => setEditingCapa({ ...editingCapa, responsibleDepartment: e.target.value })}
                    className="w-full border rounded-lg p-2 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-bold mb-1">Target Date</label>
                  <input
                    type="date"
                    value={editingCapa.targetCompletionDate}
                    onChange={(e) => setEditingCapa({ ...editingCapa, targetCompletionDate: e.target.value })}
                    className="w-full border rounded-lg p-2 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 text-xs block">
                    Push to Main Dashboard
                  </span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Display this CAPA item on the executive Dashboard RCA &amp; CAPA table
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={editingCapa.showOnDashboard !== false}
                  onChange={(e) => setEditingCapa({ ...editingCapa, showOnDashboard: e.target.checked })}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCapa(null)}
                className="px-3 py-1.5 border rounded-lg text-xs dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  updateCapa(editingCapa.id, {
                    defectName: editingCapa.defectName,
                    rootCause: editingCapa.rootCause,
                    correctiveAction: editingCapa.correctiveAction,
                    preventiveAction: editingCapa.preventiveAction,
                    responsiblePerson: editingCapa.responsiblePerson,
                    responsibleDepartment: editingCapa.responsibleDepartment,
                    targetCompletionDate: editingCapa.targetCompletionDate,
                    capaStatus: editingCapa.capaStatus,
                    showOnDashboard: editingCapa.showOnDashboard,
                  });
                  setEditingCapa(null);
                }}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
