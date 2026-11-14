import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  InspectionReport,
  DefectGroup,
  DefectMasterItem,
  CAPARecord,
  MonitoringRecord,
} from '../types';

import { sanitizeForFirestore } from '../utils/firestoreSanitizer';
export { sanitizeForFirestore };

export const firestoreService = {
  // --- Inspection Reports ---
  async fetchReports(): Promise<InspectionReport[]> {
    const path = 'reports';
    try {
      const snap = await getDocs(collection(db, path));
      const list: InspectionReport[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<InspectionReport, 'id'>) });
      });
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return [];
    }
  },

  async saveReport(report: InspectionReport): Promise<void> {
    const path = `reports/${report.id}`;
    try {
      await setDoc(doc(db, 'reports', report.id), sanitizeForFirestore(report));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async deleteReport(id: string): Promise<void> {
    const path = `reports/${id}`;
    try {
      await deleteDoc(doc(db, 'reports', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  subscribeReports(
    onUpdate: (reports: InspectionReport[]) => void,
    onError?: (err: unknown) => void
  ): () => void {
    const path = 'reports';
    return onSnapshot(
      collection(db, path),
      (snap) => {
        const list: InspectionReport[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<InspectionReport, 'id'>) });
        });
        list.sort((a, b) => (b.createdAt || b.inspectionDate || '').localeCompare(a.createdAt || a.inspectionDate || ''));
        onUpdate(list);
      },
      (err) => {
        if (onError) {
          onError(err);
        } else {
          handleFirestoreError(err, OperationType.GET, path);
        }
      }
    );
  },

  // --- Defect Groups ---
  async fetchDefectGroups(): Promise<DefectGroup[]> {
    const path = 'defect_groups';
    try {
      const snap = await getDocs(collection(db, path));
      const list: DefectGroup[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<DefectGroup, 'id'>) });
      });
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return [];
    }
  },

  async saveDefectGroup(group: DefectGroup): Promise<void> {
    const path = `defect_groups/${group.id}`;
    try {
      await setDoc(doc(db, 'defect_groups', group.id), sanitizeForFirestore(group));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async deleteDefectGroup(id: string): Promise<void> {
    const path = `defect_groups/${id}`;
    try {
      await deleteDoc(doc(db, 'defect_groups', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // --- Defect Master ---
  async fetchDefectMaster(): Promise<DefectMasterItem[]> {
    const path = 'defect_master';
    try {
      const snap = await getDocs(collection(db, path));
      const list: DefectMasterItem[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<DefectMasterItem, 'id'>) });
      });
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return [];
    }
  },

  async saveDefectMasterItem(item: DefectMasterItem): Promise<void> {
    const path = `defect_master/${item.id}`;
    try {
      await setDoc(doc(db, 'defect_master', item.id), sanitizeForFirestore(item));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async deleteDefectMasterItem(id: string): Promise<void> {
    const path = `defect_master/${id}`;
    try {
      await deleteDoc(doc(db, 'defect_master', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // --- CAPA Records ---
  async fetchCapas(): Promise<CAPARecord[]> {
    const path = 'capas';
    try {
      const snap = await getDocs(collection(db, path));
      const list: CAPARecord[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<CAPARecord, 'id'>) });
      });
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return [];
    }
  },

  async saveCapa(capa: CAPARecord): Promise<void> {
    const path = `capas/${capa.id}`;
    try {
      await setDoc(doc(db, 'capas', capa.id), sanitizeForFirestore(capa));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async deleteCapa(id: string): Promise<void> {
    const path = `capas/${id}`;
    try {
      await deleteDoc(doc(db, 'capas', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  subscribeCapas(
    onUpdate: (capas: CAPARecord[]) => void,
    onError?: (err: unknown) => void
  ): () => void {
    const path = 'capas';
    return onSnapshot(
      collection(db, path),
      (snap) => {
        const list: CAPARecord[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<CAPARecord, 'id'>) });
        });
        list.sort((a, b) => (Number(b.defectQuantity) || 0) - (Number(a.defectQuantity) || 0));
        onUpdate(list);
      },
      (err) => {
        if (onError) {
          onError(err);
        } else {
          handleFirestoreError(err, OperationType.GET, path);
        }
      }
    );
  },

  // --- Monitoring Records ---
  async fetchMonitoring(): Promise<MonitoringRecord[]> {
    const path = 'monitoring';
    try {
      const snap = await getDocs(collection(db, path));
      const list: MonitoringRecord[] = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...(docSnap.data() as Omit<MonitoringRecord, 'id'>) });
      });
      return list;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
      return [];
    }
  },

  async saveMonitoring(record: MonitoringRecord): Promise<void> {
    const path = `monitoring/${record.id}`;
    try {
      await setDoc(doc(db, 'monitoring', record.id), sanitizeForFirestore(record));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async deleteMonitoring(id: string): Promise<void> {
    const path = `monitoring/${id}`;
    try {
      await deleteDoc(doc(db, 'monitoring', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  subscribeMonitoring(
    onUpdate: (records: MonitoringRecord[]) => void,
    onError?: (err: unknown) => void
  ): () => void {
    const path = 'monitoring';
    return onSnapshot(
      collection(db, path),
      (snap) => {
        const list: MonitoringRecord[] = [];
        snap.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as Omit<MonitoringRecord, 'id'>) });
        });
        onUpdate(list);
      },
      (err) => {
        if (onError) {
          onError(err);
        } else {
          handleFirestoreError(err, OperationType.GET, path);
        }
      }
    );
  },
};
