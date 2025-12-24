import type { Metadata } from 'next';

import { CONFIG } from 'src/config-global';
import { trpc, getQueryClient } from 'src/trpc/server';

import { UserView } from 'src/sections/user/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Users - ${CONFIG.appName}`,
};

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
  
  return <UserView />;
}
