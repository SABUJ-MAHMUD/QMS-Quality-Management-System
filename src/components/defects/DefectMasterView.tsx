import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DefectGroup, DefectMasterItem, DefectSeverity } from '../../types';
import { classifyRawDefect } from '../../data/defectMasterData';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  Sparkles,
  Tag,
  ShieldCheck,
  X,
} from 'lucide-react';

export const DefectMasterView: React.FC = () => {
  const {
    defectGroups,
    addDefectGroup,
    updateDefectGroup,
    deleteDefectGroup,
    defectMaster,
    addDefectMasterItem,
    updateDefectMasterItem,
    deleteDefectMasterItem,
    canManageData,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'master' | 'groups' | 'test'>('master');
  const [searchQuery, setSearchQuery] = useState('');

  // Group modal state
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<DefectGroup | null>(null);
  const [groupForm, setGroupForm] = useState({ groupName: '', description: '', color: '#2563eb' });

  // Defect Master item modal state
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<DefectMasterItem | null>(null);
  const [itemForm, setItemForm] = useState({
    standardDefectName: '',
    defectGroupId: defectGroups[0]?.id || 'dg-1',
    severity: 'Major' as DefectSeverity,
    keywords: '',
    buyer: 'BESTSELLER',
  });

  // Test Auto-classifier state
  const [testInput, setTestInput] = useState('broken stitch at pocket edge');
  const [testResult, setTestResult] = useState<any>(null);

  const handleTestClassifier = () => {
    const res = classifyRawDefect(testInput, defectMaster, defectGroups);
    const grp = defectGroups.find((g) => g.id === res.defectGroupId);
    setTestResult({ ...res, groupName: grp ? grp.groupName : 'Unknown' });
  };

  const handleSaveGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupForm.groupName.trim()) return;
    if (editingGroup) {
      updateDefectGroup(editingGroup.id, {
        groupName: groupForm.groupName,
        description: groupForm.description,
        color: groupForm.color,
      });
    } else {
      addDefectGroup({
        groupName: groupForm.groupName,
        description: groupForm.description,
        status: 'Active',
        color: groupForm.color,
      });
    }
    setShowGroupModal(false);
    setEditingGroup(null);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.standardDefectName.trim()) return;
    const kwList = itemForm.keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    if (editingItem) {
      updateDefectMasterItem(editingItem.id, {
        standardDefectName: itemForm.standardDefectName,
        defectGroupId: itemForm.defectGroupId,
        severity: itemForm.severity,
        keywords: kwList,
        buyer: itemForm.buyer,
      });
    } else {
      addDefectMasterItem({
        standardDefectName: itemForm.standardDefectName,
        defectGroupId: itemForm.defectGroupId,
        severity: itemForm.severity,
        keywords: kwList,
        buyer: itemForm.buyer,
        approvedStatus: true,
      });
    }
    setShowItemModal(false);
    setEditingItem(null);
  };

  const filteredMaster = defectMaster.filter(
    (dm) =>
      dm.standardDefectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dm.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Defect Master & Taxonomy Classification
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
              QMS Taxonomy
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized dictionary of standardized garment defects, keyword matching models, and AQL severity rules.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {canManageData && (
            <>
              <button
                onClick={() => {
                  setEditingGroup(null);
                  setGroupForm({ groupName: '', description: '', color: '#2563eb' });
                  setShowGroupModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-sky-600" />
                Add Defect Group
              </button>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setItemForm({
                    standardDefectName: '',
                    defectGroupId: defectGroups[0]?.id || 'dg-1',
                    severity: 'Major',
                    keywords: '',
                    buyer: 'BESTSELLER',
                  });
                  setShowItemModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Standard Defect
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('master')}
          className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'master'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Defect Master Catalog ({defectMaster.length})
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'groups'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Defect Groups ({defectGroups.length})
        </button>
        <button
          onClick={() => setActiveTab('test')}
          className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'test'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          Test Keyword Classifier
        </button>
      </div>

      {/* TAB 1: DEFECT MASTER */}
      {activeTab === 'master' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search defects or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-sky-500"
              />
            </div>
            <span className="text-xs text-slate-500">
              Showing {filteredMaster.length} of {defectMaster.length} standardized defects
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Standard Defect Name</th>
                  <th className="py-2.5 px-3">Defect Group</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Buyer Scope</th>
                  <th className="py-2.5 px-3">Keywords / Aliases</th>
                  {canManageData && <th className="py-2.5 px-3 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMaster.map((item) => {
                  const grp = defectGroups.find((g) => g.id === item.defectGroupId);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-800">
                        {item.standardDefectName}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: grp?.color || '#3b82f6' }}
                          />
                          {grp?.groupName || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.severity === 'Critical'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : item.severity === 'Major'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-sky-100 text-sky-800 border border-sky-200'
                          }`}
                        >
                          {item.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-500">
                        {item.buyer}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1">
                          {item.keywords.map((kw, idx) => (
                            <span
                              key={idx}
                              className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[10px]"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      </td>
                      {canManageData && (
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setItemForm({
                                  standardDefectName: item.standardDefectName,
                                  defectGroupId: item.defectGroupId,
                                  severity: item.severity,
                                  keywords: item.keywords.join(', '),
                                  buyer: item.buyer,
                                });
                                setShowItemModal(true);
                              }}
                              className="p-1 rounded text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteDefectMasterItem(item.id)}
                              className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DEFECT GROUPS */}
      {activeTab === 'groups' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {defectGroups.map((g) => {
            const count = defectMaster.filter((dm) => dm.defectGroupId === g.id).length;
            return (
              <div
                key={g.id}
                className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: g.color || '#2563eb' }}
                    />
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {count} Master Defects
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mt-2">{g.groupName}</h3>
                  <p className="text-xs text-slate-500 mt-1">{g.description}</p>
                </div>

                {canManageData && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                    <button
                      onClick={() => {
                        setEditingGroup(g);
                        setGroupForm({
                          groupName: g.groupName,
                          description: g.description,
                          color: g.color || '#2563eb',
                        });
                        setShowGroupModal(true);
                      }}
                      className="text-sky-600 hover:underline font-semibold"
                    >
                      Edit Group
                    </button>
                    <button
                      onClick={() => deleteDefectGroup(g.id)}
                      className="text-rose-600 hover:underline font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: TEST KEYWORD CLASSIFIER */}
      {activeTab === 'test' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-2xs max-w-2xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-600" />
              Interactive Defect Classification Simulator
            </h3>
            <p className="text-xs text-slate-500">
              Type any raw description as written by a quality auditor in the factory (e.g. &ldquo;uncut thread tail on collar&rdquo;, &ldquo;heavy needle hole&rdquo;) to test the automatic taxonomy mapping.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Enter defect description..."
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
            />
            <button
              onClick={handleTestClassifier}
              className="px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-bold hover:bg-sky-700 transition-colors"
            >
              Classify Defect
            </button>
          </div>

          {testResult && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
              <div className="font-bold text-slate-800 text-sm">Classification Result:</div>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-400 block">Standard Defect Name:</span>
                  <span className="font-bold text-sky-700 text-sm">{testResult.standardDefectName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Defect Group:</span>
                  <span className="font-bold">{testResult.groupName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Severity:</span>
                  <span
                    className={`font-bold ${
                      testResult.severity === 'Critical'
                        ? 'text-rose-600'
                        : testResult.severity === 'Major'
                        ? 'text-amber-600'
                        : 'text-sky-600'
                    }`}
                  >
                    {testResult.severity}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Match Engine:</span>
                  <span className="font-bold text-emerald-600">
                    {testResult.matchType} ({testResult.confidence}% confidence)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveGroup}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold">
                {editingGroup ? 'Edit Defect Group' : 'Add New Defect Group'}
              </h3>
              <button type="button" onClick={() => setShowGroupModal(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  value={groupForm.groupName}
                  onChange={(e) => setGroupForm({ ...groupForm, groupName: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Color Marker</label>
                <input
                  type="color"
                  value={groupForm.color}
                  onChange={(e) => setGroupForm({ ...groupForm, color: e.target.value })}
                  className="w-16 h-8 rounded border p-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowGroupModal(false)}
                className="px-3 py-1.5 border rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-bold"
              >
                Save Group
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Master Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveItem}
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4"
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold">
                {editingItem ? 'Edit Master Defect' : 'Add Standard Defect'}
              </h3>
              <button type="button" onClick={() => setShowItemModal(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Standard Defect Name</label>
                <input
                  type="text"
                  required
                  value={itemForm.standardDefectName}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, standardDefectName: e.target.value })
                  }
                  className="w-full border rounded-lg p-2 font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Defect Group</label>
                <select
                  value={itemForm.defectGroupId}
                  onChange={(e) => setItemForm({ ...itemForm, defectGroupId: e.target.value })}
                  className="w-full border rounded-lg p-2"
                >
                  {defectGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.groupName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Severity</label>
                <select
                  value={itemForm.severity}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, severity: e.target.value as DefectSeverity })
                  }
                  className="w-full border rounded-lg p-2 font-bold"
                >
                  <option value="Critical">Critical</option>
                  <option value="Major">Major</option>
                  <option value="Minor">Minor</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">
                  Keywords / Aliases (comma separated)
                </label>
                <input
                  type="text"
                  value={itemForm.keywords}
                  onChange={(e) => setItemForm({ ...itemForm, keywords: e.target.value })}
                  placeholder="e.g. broken stitch, stitch broken, ruptured seam"
                  className="w-full border rounded-lg p-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                className="px-3 py-1.5 border rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-bold"
              >
                Save Defect
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
