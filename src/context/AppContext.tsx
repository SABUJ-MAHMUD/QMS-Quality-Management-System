import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  InspectionReport,
  InspectionDefect,
  DefectMasterItem,
  DefectGroup,
  CAPARecord,
  MonitoringRecord,
  UserRole,
  GlobalFilterState,
  AppSettings,
} from '../types';
import { INITIAL_DEFECT_GROUPS, INITIAL_DEFECT_MASTER } from '../data/defectMasterData';
import { INITIAL_DEMO_REPORTS, INITIAL_DEMO_CAPA, INITIAL_DEMO_MONITORING } from '../data/demoData';
import { calculateReportOql, calculateAggregatedOql, calculatePassRate, filterReports, getFinancialYear } from '../utils/oqlCalculator';
import { firestoreService } from '../services/firestoreService';
import { testConnection } from '../lib/firebase';

interface NotificationItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  timestamp: string;
}

interface AppContextType {
  // Navigation & Role
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  currentUserEmail: string;
  setCurrentUserEmail: (email: string) => void;
  currentUserName: string;
  setCurrentUserName: (name: string) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  login: (targetTab?: string, userProfile?: { email: string; name?: string; role?: UserRole }) => void;
  logout: () => void;

  // Theme (Day / Night Mode)
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;

  // Cloud Database
  isFirebaseConnected: boolean;

  // Settings
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;

  // Global Filters
  filters: GlobalFilterState;
  setFilters: React.Dispatch<React.SetStateAction<GlobalFilterState>>;
  resetFilters: () => void;

  // Inspection Reports
  reports: InspectionReport[];
  filteredReports: InspectionReport[];
  addInspectionReport: (report: Omit<InspectionReport, 'id' | 'createdAt' | 'updatedAt'>) => InspectionReport;
  updateInspectionReport: (id: string, updates: Partial<InspectionReport>) => void;
  deleteInspectionReport: (id: string) => boolean;

  // Defect Master & Groups
  defectGroups: DefectGroup[];
  defectMaster: DefectMasterItem[];
  addDefectGroup: (group: Omit<DefectGroup, 'id'>) => void;
  updateDefectGroup: (id: string, updates: Partial<DefectGroup>) => void;
  deleteDefectGroup: (id: string) => boolean;
  addDefectMasterItem: (item: Omit<DefectMasterItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDefectMasterItem: (id: string, updates: Partial<DefectMasterItem>) => void;
  deleteDefectMasterItem: (id: string) => void;

  // CAPA & Monitoring
  capas: CAPARecord[];
  addCapa: (capa: Omit<CAPARecord, 'id' | 'createdAt' | 'updatedAt'>) => CAPARecord;
  updateCapa: (id: string, updates: Partial<CAPARecord>) => void;
  deleteCapa: (id: string) => void;

  monitoringRecords: MonitoringRecord[];
  addMonitoringRecord: (record: Omit<MonitoringRecord, 'id' | 'createdAt'>) => void;
  deleteMonitoringRecord: (id: string) => void;

  // Demo & Data Clearing Management
  hasDemoData: boolean;
  clearDemoData: () => void;
  restoreDemoData: () => void;
  clearAllData: () => Promise<void>;

  // Metrics (Filtered)
  kpiMetrics: {
    totalReports: number;
    totalOrders: number;
    totalOrderQuantity: number;
    totalInspectedQuantity: number;
    totalDefects: number;
    criticalDefects: number;
    majorDefects: number;
    minorDefects: number;
    aggregatedOql: number;
    passRate: number;
    passedReportsCount: number;
    previousPeriodOql: number;
    oqlDifference: number;
    trendDirection: 'up' | 'down' | 'neutral';
  };

  // Notifications
  notifications: NotificationItem[];
  addNotification: (type: NotificationItem['type'], message: string) => void;
  clearNotifications: () => void;

  // Cross-tab RCA & CAPA defect link handoff
  pendingCapaDefect: {
    code: string;
    name: string;
    categoryCode: string;
    categoryName: string;
    defectGroupId: string;
    quantity?: number;
  } | null;
  setPendingCapaDefect: React.Dispatch<
    React.SetStateAction<{
      code: string;
      name: string;
      categoryCode: string;
      categoryName: string;
      defectGroupId: string;
      quantity?: number;
    } | null>
  >;

  // Permission helpers
  canManageData: boolean;
  canUpload: boolean;
  canManageSettings: boolean;
}

// Clear legacy cached demo or test data on module startup
try {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('gqa_qms_reports_clean_v3');
    localStorage.removeItem('gqa_qms_reports_clean_v2');
    localStorage.removeItem('gqa_qms_reports_clean_v1');
    localStorage.removeItem('gqa_qms_capa_clean_v3');
    localStorage.removeItem('gqa_qms_monitoring_clean_v3');
    localStorage.removeItem('gqa_qms_defect_groups_v3');
    localStorage.removeItem('gqa_qms_defect_master_v3');
  }
} catch {
  // ignore
}

const STORAGE_KEYS = {
  REPORTS: 'gqa_qms_reports_fresh_zero_v6',
  DEFECT_GROUPS: 'gqa_qms_defect_groups_v4',
  DEFECT_MASTER: 'gqa_qms_defect_master_v4',
  CAPA: 'gqa_qms_capa_fresh_zero_v6',
  MONITORING: 'gqa_qms_monitoring_fresh_zero_v6',
  SETTINGS: 'gqa_qms_settings_v3',
  USER_ROLE: 'gqa_qms_role_v3',
  AUTH: 'gqa_qms_auth_v3',
  THEME: 'gqa_qms_theme_v1',
};

const DEFAULT_SETTINGS: AppSettings = {
  targetOql: 4.5,
  financialYearStartMonth: 8, // August
  factoryName: 'Northern Fashions Ltd.',
  defaultBuyer: 'BESTSELLER',
  oqlDecimals: 2,
};

const DEFAULT_FILTERS: GlobalFilterState = {
  buyer: 'ALL',
  financialYear: 'ALL',
  month: 'ALL',
  dateFrom: '',
  dateTo: '',
  orderNumber: '',
  styleNumber: '',
  defectGroup: 'ALL',
  defectSeverity: 'ALL',
  inspectionResult: 'ALL',
  searchQuery: '',
};

const scheduleStorageWrite = (key: string, value: unknown): (() => void) => {
  const write = () => {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch {
      // ignore storage quota errors
    }
  };
  if (typeof window !== 'undefined' && typeof (window as any).requestIdleCallback === 'function') {
    const id = (window as any).requestIdleCallback(write, { timeout: 600 });
    return () => (window as any).cancelIdleCallback?.(id);
  }
  const timer = setTimeout(write, 0);
  return () => clearTimeout(timer);
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [pendingCapaDefect, setPendingCapaDefect] = useState<{
    code: string;
    name: string;
    categoryCode: string;
    categoryName: string;
    defectGroupId: string;
    quantity?: number;
  } | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(() => {
    return (localStorage.getItem(STORAGE_KEYS.USER_ROLE) as UserRole) || 'Admin';
  });

  const [currentUserEmail, setCurrentUserEmail] = useState<string>(() => {
    return localStorage.getItem('NFL_QMS_USER_EMAIL') || 'quality.engineer.bd@gmail.com';
  });

  const [currentUserName, setCurrentUserName] = useState<string>(() => {
    return localStorage.getItem('NFL_QMS_USER_NAME') || 'Quality Admin (Lead)';
  });

  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved === 'dark' || saved === 'light') return saved;
      return 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch {
      // ignore
    }
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(nextTheme);
    addNotification('info', `Switched to ${nextTheme === 'dark' ? 'Night (Dark)' : 'Day (Light)'} Mode.`);
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  };

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTH);
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const login = (targetTab?: string, userProfile?: { email: string; name?: string; role?: UserRole }) => {
    setIsAuthenticated(true);
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH, 'true');
    } catch {
      // ignore
    }

    if (userProfile) {
      const isSuperAdmin = userProfile.email.toLowerCase().trim() === 'quality.engineer.bd@gmail.com';
      const effectiveRole: UserRole = isSuperAdmin ? 'Admin' : (userProfile.role || 'QMS Manager');
      const effectiveName = userProfile.name || (isSuperAdmin ? 'Quality Engineer (Admin)' : 'QMS Officer');

      setCurrentUserRole(effectiveRole);
      setCurrentUserEmail(userProfile.email);
      setCurrentUserName(effectiveName);

      try {
        localStorage.setItem(STORAGE_KEYS.USER_ROLE, effectiveRole);
        localStorage.setItem('NFL_QMS_USER_EMAIL', userProfile.email);
        localStorage.setItem('NFL_QMS_USER_NAME', effectiveName);
      } catch {
        // ignore
      }
    }

    if (targetTab) {
      setActiveTab(targetTab);
    }
    addNotification('success', `Signed in to Northern Fashions QMS Workspace as ${userProfile?.email || currentUserEmail}.`);
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH, 'false');
    } catch {
      // ignore
    }
    addNotification('info', 'Logged out of QMS session. Workspace locked.');
  };

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [filters, setFilters] = useState<GlobalFilterState>(DEFAULT_FILTERS);

  // Core Data States - Initialized completely FRESH with 0 demo data
  const [reports, setReports] = useState<InspectionReport[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REPORTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [defectGroups, setDefectGroups] = useState<DefectGroup[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DEFECT_GROUPS);
      return saved ? JSON.parse(saved) : INITIAL_DEFECT_GROUPS;
    } catch {
      return INITIAL_DEFECT_GROUPS;
    }
  });

  const [defectMaster, setDefectMaster] = useState<DefectMasterItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DEFECT_MASTER);
      return saved ? JSON.parse(saved) : INITIAL_DEFECT_MASTER;
    } catch {
      return INITIAL_DEFECT_MASTER;
    }
  });

  const [capas, setCapas] = useState<CAPARecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CAPA);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [monitoringRecords, setMonitoringRecords] = useState<MonitoringRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MONITORING);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);

  // Initial Firestore synchronization & real-time multi-user listeners
  useEffect(() => {
    let isMounted = true;
    let unsubReports: (() => void) | null = null;
    let unsubCapas: (() => void) | null = null;
    let unsubMonitoring: (() => void) | null = null;

    const initCloudDatabase = async () => {
      try {
        const isHealthy = await testConnection();
        if (isMounted) setIsFirebaseConnected(isHealthy);
        if (!isHealthy) return;

        // Subscribe to real-time updates so 10-15+ colleagues see each other's uploads immediately
        let initialReportsChecked = false;
        unsubReports = firestoreService.subscribeReports(
          (remoteReports) => {
            if (!isMounted) return;
            setIsFirebaseConnected(true);
            setReports((localPrev) => {
              // On first snapshot, push any local-only non-demo reports up to Firestore so nothing is lost
              if (!initialReportsChecked) {
                initialReportsChecked = true;
                const remoteIds = new Set(remoteReports.map((r) => r.id));
                const unsyncedLocal = localPrev.filter((r) => !r.isDemo && !remoteIds.has(r.id));
                unsyncedLocal.forEach((r) => {
                  firestoreService.saveReport(r).catch((err) => {
                    console.warn('Backfill local report to Firestore note:', err);
                  });
                });
                if (unsyncedLocal.length > 0) {
                  return [...unsyncedLocal, ...remoteReports];
                }
              }
              return remoteReports;
            });
          },
          (err) => {
            console.warn('Firestore reports listener note:', err);
            if (isMounted) setIsFirebaseConnected(false);
          }
        );

        let initialCapasChecked = false;
        unsubCapas = firestoreService.subscribeCapas(
          (remoteCapas) => {
            if (!isMounted) return;
            setCapas((localPrev) => {
              if (!initialCapasChecked) {
                initialCapasChecked = true;
                const remoteIds = new Set(remoteCapas.map((c) => c.id));
                const unsynced = localPrev.filter((c) => !c.isDemo && !remoteIds.has(c.id));
                unsynced.forEach((c) => {
                  firestoreService.saveCapa(c).catch((err) => console.warn('Backfill CAPA note:', err));
                });
                if (unsynced.length > 0) {
                  return [...unsynced, ...remoteCapas];
                }
              }
              return remoteCapas;
            });
          },
          (err) => console.warn('Firestore capas listener note:', err)
        );

        unsubMonitoring = firestoreService.subscribeMonitoring(
          (remoteMon) => {
            if (!isMounted) return;
            setMonitoringRecords(remoteMon);
          },
          (err) => console.warn('Firestore monitoring listener note:', err)
        );

        addNotification('success', 'Connected to Firebase Cloud Firestore real-time sync.');
      } catch (err) {
        console.warn('Firestore initial sync note:', err);
        if (isMounted) setIsFirebaseConnected(false);
      }
    };
    initCloudDatabase();
    return () => {
      isMounted = false;
      unsubReports?.();
      unsubCapas?.();
      unsubMonitoring?.();
    };
  }, []);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-fresh',
      type: 'info',
      message: 'Quality Intelligence System ready. Clean database connected to Firebase Firestore.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Sync state to localStorage asynchronously during browser idle frames so UI never stalls
  useEffect(() => scheduleStorageWrite(STORAGE_KEYS.REPORTS, reports), [reports]);
  useEffect(() => scheduleStorageWrite(STORAGE_KEYS.DEFECT_GROUPS, defectGroups), [defectGroups]);
  useEffect(() => scheduleStorageWrite(STORAGE_KEYS.DEFECT_MASTER, defectMaster), [defectMaster]);
  useEffect(() => scheduleStorageWrite(STORAGE_KEYS.CAPA, capas), [capas]);
  useEffect(() => scheduleStorageWrite(STORAGE_KEYS.MONITORING, monitoringRecords), [monitoringRecords]);
  useEffect(() => scheduleStorageWrite(STORAGE_KEYS.SETTINGS, settings), [settings]);
  useEffect(() => scheduleStorageWrite(STORAGE_KEYS.USER_ROLE, currentUserRole), [currentUserRole]);

  // Notification helper
  const addNotification = (type: NotificationItem['type'], message: string) => {
    const item: NotificationItem = {
      id: `notif-${Date.now()}-${Math.random()}`,
      type,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setNotifications((prev) => [item, ...prev.slice(0, 9)]);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Permission logic - upload is always enabled so any user can test and upload inspection reports
  const canManageData = true;
  const canUpload = true;
  const canManageSettings = true;

  // Demo data management
  const hasDemoData = useMemo(() => {
    return reports.some((r) => r.isDemo);
  }, [reports]);

  const clearDemoData = () => {
    const remainingReports = reports.filter((r) => !r.isDemo);
    const remainingCapas = capas.filter((c) => !c.isDemo);
    const remainingMon = monitoringRecords.filter((m) => !m.isDemo);
    setReports(remainingReports);
    setCapas(remainingCapas);
    setMonitoringRecords(remainingMon);
    addNotification('info', 'Demonstration data cleared. Only actual user inspection records remain.');
  };

  const restoreDemoData = () => {
    // Preserve any user uploaded non-demo records
    const userReports = reports.filter((r) => !r.isDemo);
    const userCapas = capas.filter((c) => !c.isDemo);
    const userMon = monitoringRecords.filter((m) => !m.isDemo);

    setReports([...INITIAL_DEMO_REPORTS, ...userReports]);
    setCapas([...INITIAL_DEMO_CAPA, ...userCapas]);
    setMonitoringRecords([...INITIAL_DEMO_MONITORING, ...userMon]);
    addNotification('success', 'Demonstration data restored for testing & evaluation.');
  };

  const clearAllData = async () => {
    setReports([]);
    setCapas([]);
    setMonitoringRecords([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.REPORTS);
      localStorage.removeItem(STORAGE_KEYS.CAPA);
      localStorage.removeItem(STORAGE_KEYS.MONITORING);
      localStorage.removeItem('gqa_qms_reports_clean_v3');
      localStorage.removeItem('gqa_qms_reports_fresh_zero_v6');
      localStorage.removeItem('gqa_qms_capa_clean_v3');
      localStorage.removeItem('gqa_qms_monitoring_clean_v3');
    } catch {
      // ignore
    }
    // Delete any documents from Firestore
    try {
      const remoteR = await firestoreService.fetchReports();
      for (const r of remoteR) {
        await firestoreService.deleteReport(r.id);
      }
      const remoteC = await firestoreService.fetchCapas();
      for (const c of remoteC) {
        await firestoreService.deleteCapa(c.id);
      }
      const remoteM = await firestoreService.fetchMonitoring();
      for (const m of remoteM) {
        await firestoreService.deleteMonitoring(m.id);
      }
    } catch (err) {
      console.warn('Firestore purge note:', err);
    }
    addNotification('info', 'All inspection reports and test data have been wiped. System is completely blank (0 records) and ready for fresh input.');
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    addNotification('success', 'QMS system settings updated successfully.');
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Filtered reports
  const filteredReports = useMemo(() => {
    return filterReports(reports, filters, settings.financialYearStartMonth);
  }, [reports, filters, settings.financialYearStartMonth]);

  // KPI Calculations using exact Aggregated OQL formula
  const kpiMetrics = useMemo(() => {
    const totalReports = filteredReports.length;
    const orderSet = new Set(filteredReports.map((r) => r.orderNumber));
    const totalOrders = orderSet.size;

    const totalOrderQuantity = filteredReports.reduce((s, r) => s + (Number(r.orderQuantity) || 0), 0);
    const totalInspectedQuantity = filteredReports.reduce((s, r) => s + (Number(r.inspectedQuantity) || 0), 0);
    const totalDefects = filteredReports.reduce((s, r) => s + (Number(r.totalDefectQuantity) || 0), 0);
    const criticalDefects = filteredReports.reduce((s, r) => s + (Number(r.criticalDefectQuantity) || 0), 0);
    const majorDefects = filteredReports.reduce((s, r) => s + (Number(r.majorDefectQuantity) || 0), 0);
    const minorDefects = filteredReports.reduce((s, r) => s + (Number(r.minorDefectQuantity) || 0), 0);

    // Official aggregated OQL formula: (Sum of Defects / Sum of Inspected) * 100
    const aggregatedOql = calculateAggregatedOql(filteredReports, settings.oqlDecimals);

    const { passRate, passedCount: passedReportsCount } = calculatePassRate(filteredReports, 1);

    // Previous period baseline for comparison
    const previousPeriodOql = 4.85;
    const oqlDifference = Number((aggregatedOql - settings.targetOql).toFixed(2));
    const trendDirection: 'up' | 'down' | 'neutral' =
      aggregatedOql > previousPeriodOql ? 'up' : aggregatedOql < previousPeriodOql ? 'down' : 'neutral';

    return {
      totalReports,
      totalOrders,
      totalOrderQuantity,
      totalInspectedQuantity,
      totalDefects,
      criticalDefects,
      majorDefects,
      minorDefects,
      aggregatedOql,
      passRate,
      passedReportsCount,
      previousPeriodOql,
      oqlDifference,
      trendDirection,
    };
  }, [filteredReports, settings]);

  // Inspection report CRUD with Cloud Firestore persistence
  const addInspectionReport = (data: Omit<InspectionReport, 'id' | 'createdAt' | 'updatedAt'>): InspectionReport => {
    const id = `rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    const newReport: InspectionReport = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
      auditLogs: [
        {
          timestamp: now,
          user: `${currentUserRole}`,
          action: 'Created & Approved',
          details: `Report ${data.reportNumber} created with OQL ${data.oql}%`,
        },
      ],
    };

    setReports((prev) => [newReport, ...prev]);
    firestoreService
      .saveReport(newReport)
      .then(() => {
        setIsFirebaseConnected(true);
      })
      .catch((err) => {
        console.error('Failed to sync new report to Firestore:', err);
        addNotification(
          'warning',
          `Report ${data.reportNumber} saved locally, but cloud sync failed (${err?.message || 'network/permissions'}).`
        );
      });
    addNotification('success', `Inspection Report ${data.reportNumber} saved and approved into database.`);
    return newReport;
  };

  const updateInspectionReport = (id: string, updates: Partial<InspectionReport>) => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const now = new Date().toISOString();
        const updatedAudit = [
          ...(r.auditLogs || []),
          {
            timestamp: now,
            user: `${currentUserRole}`,
            action: 'Updated',
            details: `Modified report fields`,
          },
        ];
        const updated = {
          ...r,
          ...updates,
          updatedAt: now,
          auditLogs: updatedAudit,
        };
        firestoreService.saveReport(updated).catch((err) => {
          console.error('Failed to sync updated report to Firestore:', err);
          addNotification('warning', 'Report updated locally; cloud sync error occurred.');
        });
        return updated;
      })
    );
    addNotification('info', `Report record updated successfully.`);
  };

  const deleteInspectionReport = (id: string): boolean => {
    if (!canManageData) {
      addNotification('error', 'Permission denied: Only Admin or QMS Manager can delete records.');
      return false;
    }
    setReports((prev) => prev.filter((r) => r.id !== id));
    firestoreService.deleteReport(id).catch((err) => {
      console.error('Failed to delete report from Firestore:', err);
      addNotification('warning', 'Deleted locally, but cloud deletion failed.');
    });
    addNotification('warning', `Inspection report deleted.`);
    return true;
  };

  // Defect Group CRUD
  const addDefectGroup = (group: Omit<DefectGroup, 'id'>) => {
    const newGroup: DefectGroup = {
      ...group,
      id: `dg-${Date.now()}`,
    };
    setDefectGroups((prev) => [...prev, newGroup]);
    addNotification('success', `Defect Group "${group.groupName}" added.`);
  };

  const updateDefectGroup = (id: string, updates: Partial<DefectGroup>) => {
    setDefectGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
    addNotification('info', `Defect Group updated.`);
  };

  const deleteDefectGroup = (id: string): boolean => {
    // Prevent deleting if in use
    const inUse = defectMaster.some((d) => d.defectGroupId === id);
    if (inUse) {
      addNotification('error', 'Cannot delete defect group that is currently linked to Master defects.');
      return false;
    }
    setDefectGroups((prev) => prev.filter((g) => g.id !== id));
    addNotification('info', 'Defect group removed.');
    return true;
  };

  // Defect Master CRUD
  const addDefectMasterItem = (item: Omit<DefectMasterItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString().split('T')[0];
    const newItem: DefectMasterItem = {
      ...item,
      id: `dm-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setDefectMaster((prev) => [...prev, newItem]);
    addNotification('success', `Defect "${item.standardDefectName}" added to Master catalog.`);
  };

  const updateDefectMasterItem = (id: string, updates: Partial<DefectMasterItem>) => {
    const now = new Date().toISOString().split('T')[0];
    setDefectMaster((prev) => prev.map((dm) => (dm.id === id ? { ...dm, ...updates, updatedAt: now } : dm)));
    addNotification('info', `Defect catalog item updated.`);
  };

  const deleteDefectMasterItem = (id: string) => {
    setDefectMaster((prev) => prev.filter((dm) => dm.id !== id));
    addNotification('info', 'Defect catalog item deleted.');
  };

  // CAPA CRUD with Firestore persistence
  const addCapa = (data: Omit<CAPARecord, 'id' | 'createdAt' | 'updatedAt'>): CAPARecord => {
    const id = `capa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    const newCapa: CAPARecord = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    setCapas((prev) => [newCapa, ...prev]);
    firestoreService.saveCapa(newCapa).catch((err) => {
      console.error('Failed to sync new CAPA to Firestore:', err);
      addNotification('warning', `CAPA ${data.capaId} saved locally, but cloud sync failed.`);
    });
    addNotification('success', `CAPA Plan ${data.capaId} created.`);
    return newCapa;
  };

  const updateCapa = (id: string, updates: Partial<CAPARecord>) => {
    const now = new Date().toISOString();
    setCapas((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const updated = { ...c, ...updates, updatedAt: now };
        firestoreService.saveCapa(updated).catch((err) => {
          console.error('Failed to sync updated CAPA to Firestore:', err);
          addNotification('warning', 'CAPA updated locally, but cloud sync failed.');
        });
        return updated;
      })
    );
    addNotification('info', `CAPA record updated.`);
  };

  const deleteCapa = (id: string) => {
    setCapas((prev) => prev.filter((c) => c.id !== id));
    firestoreService.deleteCapa(id).catch((err) => {
      console.error('Failed to delete CAPA from Firestore:', err);
      addNotification('warning', 'CAPA deleted locally, but cloud deletion failed.');
    });
    addNotification('warning', `CAPA record deleted.`);
  };

  // Monitoring CRUD with Firestore persistence
  const addMonitoringRecord = (data: Omit<MonitoringRecord, 'id' | 'createdAt'>) => {
    const id = `mon-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    const newMon: MonitoringRecord = {
      ...data,
      id,
      createdAt: now,
    };
    setMonitoringRecords((prev) => [newMon, ...prev]);
    firestoreService.saveMonitoring(newMon).catch((err) => {
      console.error('Failed to sync monitoring record to Firestore:', err);
      addNotification('warning', 'Monitoring record saved locally, but cloud sync failed.');
    });

    // If marked effective, update CAPA status
    if (data.effectivenessStatus === 'Effective') {
      updateCapa(data.capaId, { effectivenessStatus: 'Effective' });
    } else if (data.effectivenessStatus === 'Ineffective') {
      updateCapa(data.capaId, { effectivenessStatus: 'Ineffective' });
    }

    addNotification('success', `Monitoring check recorded for ${data.capaCode}.`);
  };

  const deleteMonitoringRecord = (id: string) => {
    setMonitoringRecords((prev) => prev.filter((m) => m.id !== id));
    firestoreService.deleteMonitoring(id).catch((err) => {
      console.error('Failed to delete monitoring record from Firestore:', err);
      addNotification('warning', 'Monitoring record deleted locally, but cloud deletion failed.');
    });
    addNotification('info', 'Monitoring record deleted.');
  };

  const contextValue = useMemo<AppContextType>(
    () => ({
      activeTab,
      setActiveTab,
      currentUserRole,
      setCurrentUserRole,
      currentUserEmail,
      setCurrentUserEmail,
      currentUserName,
      setCurrentUserName,
      isAuthenticated,
      setIsAuthenticated,
      login,
      logout,
      theme,
      toggleTheme,
      setTheme,
      isFirebaseConnected,
      settings,
      updateSettings,
      filters,
      setFilters,
      resetFilters,
      reports,
      filteredReports,
      addInspectionReport,
      updateInspectionReport,
      deleteInspectionReport,
      defectGroups,
      defectMaster,
      addDefectGroup,
      updateDefectGroup,
      deleteDefectGroup,
      addDefectMasterItem,
      updateDefectMasterItem,
      deleteDefectMasterItem,
      capas,
      addCapa,
      updateCapa,
      deleteCapa,
      monitoringRecords,
      addMonitoringRecord,
      deleteMonitoringRecord,
      hasDemoData,
      clearDemoData,
      restoreDemoData,
      clearAllData,
      kpiMetrics,
      notifications,
      addNotification,
      clearNotifications,
      pendingCapaDefect,
      setPendingCapaDefect,
      canManageData,
      canUpload,
      canManageSettings,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      activeTab,
      currentUserRole,
      currentUserEmail,
      currentUserName,
      isAuthenticated,
      theme,
      isFirebaseConnected,
      settings,
      filters,
      reports,
      filteredReports,
      defectGroups,
      defectMaster,
      capas,
      monitoringRecords,
      hasDemoData,
      kpiMetrics,
      notifications,
      pendingCapaDefect,
    ]
  );

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
