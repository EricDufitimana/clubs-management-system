import type { Metadata } from 'next';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

import { CONFIG } from 'src/config-global';
import { trpc, getQueryClient } from '@/trpc/server';

import { AttendanceView } from 'src/sections/attendance/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Attendance - ${CONFIG.appName}`,
};

export default async function AttendancePage() {
  const queryClient = getQueryClient();
  
  // Prefetch attendance data
  await queryClient.prefetchQuery(trpc.attendance.getAttendanceRecords.queryOptions());
  await queryClient.prefetchQuery(trpc.sessions.getSessionsWithoutAttendance.queryOptions());
  await queryClient.prefetchQuery(trpc.users.getUsersByClub.queryOptions());
  await queryClient.prefetchQuery(trpc.clubs.getCurrentUserClub.queryOptions());
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AttendanceView />
    </HydrationBoundary>
  );
}

