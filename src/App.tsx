/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { DemoBanner } from './components/common/DemoBanner';
import { FilterBar } from './components/common/FilterBar';
import { PWAUpdateToast } from './components/common/PWAUpdateToast';

import { LoginPortalView } from './components/auth/LoginPortalView';
import { DashboardView } from './components/dashboard/DashboardView';
import { InspectionSummaryView } from './components/summary/InspectionSummaryView';
import { UploadView } from './components/upload/UploadView';
import { DatabaseView } from './components/database/DatabaseView';
import { OqlAnalyticsView } from './components/analytics/OqlAnalyticsView';
import { DefectAnalyticsView } from './components/analytics/DefectAnalyticsView';
import { DefectMasterView } from './components/defects/DefectMasterView';
import { CapaView } from './components/capa/CapaView';
import { MonitoringView } from './components/monitoring/MonitoringView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';

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

        {/* Global Filter Toolbar */}
        <FilterBar />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-50/70 dark:bg-slate-950/80 focus:outline-none">
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
