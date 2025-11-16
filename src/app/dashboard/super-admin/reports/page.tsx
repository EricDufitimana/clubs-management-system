import type { Metadata } from 'next';

import { CONFIG } from 'src/config-global';

import { SuperAdminReportsView } from 'src/sections/super-admin/view/super-admin-reports-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Reports - ${CONFIG.appName}`,
};

export default async function SuperAdminReportsPage() {
  // Middleware handles authentication and role-based access
  return <SuperAdminReportsView />;
}


