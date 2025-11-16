import type { Metadata } from 'next';

import { CONFIG } from 'src/config-global';

import { OverviewAnalyticsView as DashboardView } from 'src/sections/overview/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Admin Dashboard - ${CONFIG.appName}`,
  description: 'The starting point for your next project with Minimal UI Kit, built on the newest version of Material-UI ©, ready to be customized to your style',
  keywords: 'react,material,kit,application,dashboard,admin,template',
};

export default async function AdminPage() {
  // Middleware handles authentication and role-based access
  return <DashboardView />;
}

