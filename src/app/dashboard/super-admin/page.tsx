import type { Metadata } from 'next';

import { CONFIG } from 'src/config-global';
import { trpc, getQueryClient } from 'src/trpc/server';

import { OverviewAnalyticsView as DashboardView } from 'src/sections/overview/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Super Admin Dashboard - ${CONFIG.appName}`,
  description: 'The starting point for your next project with Minimal UI Kit, built on the newest version of Material-UI ©, ready to be customized to your style',
  keywords: 'react,material,kit,application,dashboard,admin,template',
};

export default async function SuperAdminPage() {
  // Prefetch dashboard stats for better performance
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(trpc.dashboard.getStats.queryOptions());
  
  return <DashboardView />;
}

