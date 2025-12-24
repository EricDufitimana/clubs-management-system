import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { CONFIG } from 'src/config-global';
import { trpc, getQueryClient } from '@/trpc/server';

import { SessionsView } from 'src/sections/sessions/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Sessions - ${CONFIG.appName}`,
};

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

