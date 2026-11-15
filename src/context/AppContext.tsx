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
import { calculateReportOql, calculateAggregatedOql, calculatePassRate, filterReports, getFinancialYear, normalizeFloorName, getReportSource } from '../utils/oqlCalculator';
import { findDuplicateReportIds } from '../utils/dashboardAnalytics';
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
  removeDuplicateReports: () => Promise<number>;

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
  canSwitchRole: boolean;
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
  SELECTED_FY: 'gqa_qms_selected_fy_v1',
};

const VALID_FY_OPTIONS = ['FY26/27', 'FY25/26'];

function loadSavedFinancialYears(): string[] {
  try {
    if (typeof window === 'undefined') return ['FY26/27'];
    const raw = localStorage.getItem(STORAGE_KEYS.SELECTED_FY);
    if (!raw) return ['FY26/27'];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const valid = parsed.filter((fy): fy is string => typeof fy === 'string' && VALID_FY_OPTIONS.includes(fy));
      if (valid.length > 0) return valid;
    } else if (typeof parsed === 'string' && VALID_FY_OPTIONS.includes(parsed)) {
      return [parsed];
    }
  } catch {
    // ignore
  }
  return ['FY26/27'];
}

const DEFAULT_SETTINGS: AppSettings = {
  targetOql: 4.5,
  financialYearStartMonth: 8, // August
  factoryName: 'Northern Fashions Ltd.',
  defaultBuyer: 'BESTSELLER',
  oqlDecimals: 2,
};

const DEFAULT_FILTERS: GlobalFilterState = {
  buyer: 'ALL',
  financialYear: ['FY26/27'],
  floors: [],
  reportSource: 'ALL',
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

const scheduleStorageWrite = (key: string, value: unknown, delayMs: number = 0): (() => void) => {
  const write = () => {
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch {
      // ignore storage quota errors
    }
  };
  let timer: ReturnType<typeof setTimeout> | null = null;
  let idleId: number | null = null;
  const runIdle = () => {
    if (typeof window !== 'undefined' && typeof (window as any).requestIdleCallback === 'function') {
      idleId = (window as any).requestIdleCallback(write, { timeout: 800 });
    } else {
      timer = setTimeout(write, 0);
    }
  };
  if (delayMs > 0) {
    timer = setTimeout(runIdle, delayMs);
  } else {
    runIdle();
  }
  return () => {
    if (timer !== null) clearTimeout(timer);
    if (idleId !== null && typeof window !== 'undefined') {
      (window as any).cancelIdleCallback?.(idleId);
    }
  };
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

  const [accountRole, setAccountRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('NFL_QMS_ACCOUNT_ROLE') as UserRole | null;
    if (saved) return saved;
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
      setAccountRole(effectiveRole);
      setCurrentUserEmail(userProfile.email);
      setCurrentUserName(effectiveName);

      try {
        localStorage.setItem(STORAGE_KEYS.USER_ROLE, effectiveRole);
        localStorage.setItem('NFL_QMS_ACCOUNT_ROLE', effectiveRole);
        localStorage.setItem('NFL_QMS_USER_EMAIL', userProfile.email);
        localStorage.setItem('NFL_QMS_USER_NAME', effectiveName);
      } catch {
        // ignore
      }
    }

    const effectiveNextRole = userProfile
      ? userProfile.email.toLowerCase().trim() === 'quality.engineer.bd@gmail.com'
        ? 'Admin'
        : userProfile.role || 'QMS Manager'
      : currentUserRole;

    if (targetTab) {
      if (effectiveNextRole === 'Viewer' && (targetTab === 'upload' || targetTab === 'settings')) {
        setActiveTab('dashboard');
      } else {
        setActiveTab(targetTab);
      }
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

  const [filters, setFilters] = useState<GlobalFilterState>(() => ({
    ...DEFAULT_FILTERS,
    financialYear: loadSavedFinancialYears(),
  }));

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

  // Initial Firestore synchronization & real-time multi-user listeners (active only once signed in)
  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;
    let unsubReports: (() => void) | null = null;
    let unsubCapas: (() => void) | null = null;
    let unsubMonitoring: (() => void) | null = null;

    const initCloudDatabase = async () => {
      try {
        const isHealthy = await testConnection();
        if (isMounted) setIsFirebaseConnected(isHealthy);
        if (!isHealthy) return;

        // Subscribe to real-time updates so colleagues stay 100% synced with Firestore (no stale localStorage resurrection)
        unsubReports = firestoreService.subscribeReports(
          (remoteReports) => {
            if (!isMounted) return;
            setIsFirebaseConnected(true);
            setReports(remoteReports);
          },
          (err) => {
            console.warn('Firestore reports listener note:', err);
            if (isMounted) setIsFirebaseConnected(false);
          }
        );

        unsubCapas = firestoreService.subscribeCapas(
          (remoteCapas) => {
            if (!isMounted) return;
            setCapas(remoteCapas);
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
  }, [isAuthenticated]);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-fresh',
      type: 'info',
      message: 'Quality Intelligence System ready. Clean database connected to Firebase Firestore.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Listen for live App Update alerts and push them to every user's notification bell
  useEffect(() => {
    const onAppUpdate = (e: Event) => {
      const detail = (e as CustomEvent<{ version?: string }>).detail;
      const buildTag = detail?.version ? ` (#${String(detail.version).slice(-6)})` : '';
      addNotification(
        'info',
        `New QMS App update available${buildTag}. Please click "Update Now" in the popup to load the latest version.`
      );
    };
    window.addEventListener('qms:app-update-available', onAppUpdate);
    return () => window.removeEventListener('qms:app-update-available', onAppUpdate);
  }, []);

  // Sync state to localStorage asynchronously with debounce so UI & main thread stay fast
  useEffect(() => scheduleStorageWrite(STORAGE_KEYS.REPORTS, reports, 1200), [reports]);
  useEffect(() => scheduleStorageWrite(STORAGE_KEYS.DEFECT_GROUPS, defectGroups, 500), [defectGroups]);
  useEffect(() => scheduleStorageWrite(STORAGE_KEYS.DEFECT_MASTER, defectMaster, 500), [defectMaster]);
  useEffect(() => scheduleStorageWrite(STORAGE_KEYS.CAPA, capas, 1000), [capas]);
  useEffect(() => scheduleStorageWrite(STORAGE_KEYS.MONITORING, monitoringRecords, 1000), [monitoringRecords]);
  useEffect(() => scheduleStorageWrite(STORAGE_KEYS.SETTINGS, settings), [settings]);
  useEffect(() => scheduleStorageWrite(STORAGE_KEYS.USER_ROLE, currentUserRole), [currentUserRole]);
  useEffect(() => {
    const fyArr = Array.isArray(filters.financialYear)
      ? filters.financialYear.filter((fy) => VALID_FY_OPTIONS.includes(fy))
      : VALID_FY_OPTIONS.includes(filters.financialYear)
      ? [filters.financialYear]
      : ['FY26/27'];
    return scheduleStorageWrite(STORAGE_KEYS.SELECTED_FY, fyArr.length > 0 ? fyArr : ['FY26/27']);
  }, [filters.financialYear]);

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

  // Role-Based Access Control (RBAC): Viewer (Reviewer) is strictly read-only without PDF Upload or Settings access
  const isViewer = currentUserRole === 'Viewer';
  const canManageData = !isViewer;
  const canUpload = !isViewer;
  const canManageSettings = currentUserRole === 'Admin' || currentUserRole === 'QMS Manager';
  const canSwitchRole =
    currentUserEmail.toLowerCase().trim() === 'quality.engineer.bd@gmail.com' ||
    accountRole === 'Admin';

  const guardedSetActiveTab = useCallback(
    (tab: string) => {
      if (currentUserRole === 'Viewer' && (tab === 'upload' || tab === 'settings')) {
        setActiveTab('dashboard');
        return;
      }
      setActiveTab(tab);
    },
    [currentUserRole]
  );

  // Redirect Viewer away from restricted routes automatically
  useEffect(() => {
    if (currentUserRole === 'Viewer' && (activeTab === 'upload' || activeTab === 'settings')) {
      setActiveTab('dashboard');
    }
  }, [currentUserRole, activeTab]);

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

  const restoreDemoData = async () => {
    // Lazy-load demo dataset only if explicitly requested
    const { INITIAL_DEMO_REPORTS, INITIAL_DEMO_CAPA, INITIAL_DEMO_MONITORING } = await import('../data/demoData');
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
    setFilters((prev) => ({
      ...DEFAULT_FILTERS,
      financialYear: prev.financialYear,
    }));
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

  // Inspection report CRUD with Cloud Firestore persistence (supports unlimited repeat Inline/Final uploads per style)
  const addInspectionReport = (data: Omit<InspectionReport, 'id' | 'createdAt' | 'updatedAt'>): InspectionReport => {
    const now = new Date().toISOString();
    const normalizedFloor = normalizeFloorName(data.floor || data.section);
    const resolvedSource = getReportSource(data);

    const id = `rep-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const newReport: InspectionReport = {
      ...data,
      floor: normalizedFloor,
      section: normalizedFloor,
      reportSource: resolvedSource,
      id,
      createdAt: now,
      updatedAt: now,
      auditLogs: [
        {
          timestamp: now,
          user: `${currentUserRole}`,
          action: 'Created & Approved',
          details: `Report ${data.reportNumber} (${data.inspectionType || 'Final'} • ${resolvedSource}) created with OQL ${data.oql}%`,
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

  const removeDuplicateReports = async (): Promise<number> => {
    const dupIds = findDuplicateReportIds(reports);
    if (dupIds.length === 0) return 0;
    const dupSet = new Set(dupIds);
    setReports((prev) => prev.filter((r) => !dupSet.has(r.id)));
    for (const dupId of dupIds) {
      await firestoreService.deleteReport(dupId).catch((err) => {
        console.warn('Firestore duplicate cleanup note:', err);
      });
    }
    addNotification('info', `Removed ${dupIds.length} duplicate inspection report(s).`);
    return dupIds.length;
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
      setActiveTab: guardedSetActiveTab,
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
      removeDuplicateReports,
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
      canSwitchRole,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      activeTab,
      guardedSetActiveTab,
      currentUserRole,
      accountRole,
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
