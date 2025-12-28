import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { CONFIG } from '@/config-global';
import { trpc, getQueryClient } from '@/trpc/server';

import { SessionsView } from '@/sections/sessions/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Sessions - ${CONFIG.appName}`,
};

// Force dynamic rendering (uses cookies for auth via tRPC context)
export const dynamic = 'force-dynamic';

export default async function AdminSessionsPage() {
  const queryClient = getQueryClient();
  
  // Prefetch sessions data
  await queryClient.prefetchQuery(trpc.sessions.getSessions.queryOptions());
  await queryClient.prefetchQuery(trpc.clubs.getCurrentUserClub.queryOptions());
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SessionsView />
    </HydrationBoundary>
  );
}

