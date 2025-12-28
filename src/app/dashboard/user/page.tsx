import type { Metadata } from 'next';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

import { CONFIG } from '@/config-global';
import { trpc, getQueryClient } from '@/trpc/server';

import { UserView } from '@/sections/user/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Users - ${CONFIG.appName}`,
};

// Force dynamic rendering (uses cookies for auth via tRPC context)
export const dynamic = 'force-dynamic';

export default async function Page() {
  // Prefetch data for better performance
  const queryClient = getQueryClient();
  
  // Prefetch user lists
  await queryClient.prefetchQuery(trpc.users.getUsersByClub.queryOptions());
  await queryClient.prefetchQuery(trpc.users.getAllUsers.queryOptions());
  
  // Prefetch clubs data
  await queryClient.prefetchQuery(trpc.clubs.getClubs.queryOptions());
  await queryClient.prefetchQuery(trpc.clubs.getCurrentUserClub.queryOptions());
  
  // Prefetch all students for Add Members dialog
  await queryClient.prefetchQuery(trpc.students.getAllStudents.queryOptions());
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UserView />
    </HydrationBoundary>
  );
}
