import type { Metadata } from 'next';

import { CONFIG } from '@/config-global';

import { SuperAdminNoAttendanceView } from '@/sections/super-admin/view/super-admin-no-attendance-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Students Without Attendance - ${CONFIG.appName}`,
};

export default function SuperAdminNoAttendancePage() {
  return <SuperAdminNoAttendanceView />;
}
