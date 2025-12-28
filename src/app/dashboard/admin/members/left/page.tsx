import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { CONFIG } from '@/config-global';
import { trpc, getQueryClient } from '@/trpc/server';

import { LeftMembersView } from '@/sections/member/view/left-members-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Left Members - ${CONFIG.appName}`,
};

// Force dynamic rendering (uses cookies for auth via tRPC context)
export const dynamic = 'force-dynamic';

export default async function AdminLeftMembersPage() {
  const queryClient = getQueryClient();
  
  // Prefetch left members data
  await queryClient.prefetchQuery(trpc.users.getLeftMembers.queryOptions());
  await queryClient.prefetchQuery(trpc.clubs.getCurrentUserClub.queryOptions());
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LeftMembersView />
    </HydrationBoundary>
  );
}

