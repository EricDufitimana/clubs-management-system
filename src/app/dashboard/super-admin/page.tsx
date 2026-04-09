import type { Metadata } from 'next';
import { Suspense } from 'react';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

import { CONFIG } from '@/config-global';
import { trpc, getQueryClient } from '@/trpc/server';

import { PageLoading } from '@/components/shared/page-loading';
import { OverviewAnalyticsView as DashboardView } from '@/sections/overview/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Super Admin Dashboard - ${CONFIG.appName}`,
  description: 'The starting point for your next project with Minimal UI Kit, built on the newest version of Material-UI ©, ready to be customized to your style',
  keywords: 'react,material,kit,application,dashboard,admin,template',
};

// Force dynamic rendering (uses cookies for auth via tRPC context)
export const dynamic = 'force-dynamic';

export default async function SuperAdminPage() {
  // Prefetch dashboard stats for better performance
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(trpc.dashboard.getStats.queryOptions());
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<PageLoading />}>
        <DashboardView />
      </Suspense>
    </HydrationBoundary>
  );
}

