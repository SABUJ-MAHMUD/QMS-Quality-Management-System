/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { DemoBanner } from './components/common/DemoBanner';
import { PWAUpdateToast } from './components/common/PWAUpdateToast';
import { LoginPortalView } from './components/auth/LoginPortalView';

// Lazy-load all workspace modules so initial login/startup stays tiny and fast
const DashboardView = lazy(() =>
  import('./components/dashboard/DashboardView').then((m) => ({ default: m.DashboardView }))
);
const InspectionSummaryView = lazy(() =>
  import('./components/summary/InspectionSummaryView').then((m) => ({ default: m.InspectionSummaryView }))
);
const UploadView = lazy(() =>
  import('./components/upload/UploadView').then((m) => ({ default: m.UploadView }))
);
const DatabaseView = lazy(() =>
  import('./components/database/DatabaseView').then((m) => ({ default: m.DatabaseView }))
);
const OqlAnalyticsView = lazy(() =>
  import('./components/analytics/OqlAnalyticsView').then((m) => ({ default: m.OqlAnalyticsView }))
);
const DefectAnalyticsView = lazy(() =>
  import('./components/analytics/DefectAnalyticsView').then((m) => ({ default: m.DefectAnalyticsView }))
);
const DefectMasterView = lazy(() =>
  import('./components/defects/DefectMasterView').then((m) => ({ default: m.DefectMasterView }))
);
const CapaView = lazy(() =>
  import('./components/capa/CapaView').then((m) => ({ default: m.CapaView }))
);
const MonitoringView = lazy(() =>
  import('./components/monitoring/MonitoringView').then((m) => ({ default: m.MonitoringView }))
);
const ReportsView = lazy(() =>
  import('./components/reports/ReportsView').then((m) => ({ default: m.ReportsView }))
);
const SettingsView = lazy(() =>
  import('./components/settings/SettingsView').then((m) => ({ default: m.SettingsView }))
);

const ViewLoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center h-full min-h-[280px] p-8">
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs text-xs font-semibold text-slate-600 dark:text-slate-300">
      <div className="w-4 h-4 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
      <span>Loading module...</span>
    </div>
  </div>
);

const MainLayout: React.FC = () => {
  const { activeTab, isAuthenticated } = useApp();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // If user is not signed in, show the exact screenshot Portal view!
  if (!isAuthenticated) {
    return <LoginPortalView />;
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased overflow-hidden transition-colors">
      {/* Sidebar Navigation */}
      <Sidebar collapsed={isSidebarCollapsed} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        {/* Demo Data Alert Banner */}
        <DemoBanner />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-50/70 dark:bg-slate-950/80 focus:outline-none">
          <Suspense fallback={<ViewLoadingFallback />}>
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'inspection_summary' && <InspectionSummaryView />}
            {activeTab === 'upload' && <UploadView />}
            {activeTab === 'database' && <DatabaseView />}
            {activeTab === 'oql_analytics' && <OqlAnalyticsView />}
            {activeTab === 'defect_analytics' && <DefectAnalyticsView />}
            {activeTab === 'defect_master' && <DefectMasterView />}
            {activeTab === 'capa' && <CapaView />}
            {activeTab === 'monitoring' && <MonitoringView />}
            {activeTab === 'reports' && <ReportsView />}
            {activeTab === 'settings' && <SettingsView />}
          </Suspense>
        </main>

        {/* Bottom Application Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
      <PWAUpdateToast />
    </AppProvider>
  );
}
