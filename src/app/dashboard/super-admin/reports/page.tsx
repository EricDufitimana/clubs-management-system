import type { Metadata } from 'next';

import { CONFIG } from '@/config-global';

import { SuperAdminReportsView } from '@/sections/super-admin/view/super-admin-reports-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Reports - ${CONFIG.appName}`,
};

export default async function SuperAdminReportsPage() {
  // Middleware handles authentication and role-based access
  return <SuperAdminReportsView />;
}


