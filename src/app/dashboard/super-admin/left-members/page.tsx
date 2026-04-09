import type { Metadata } from 'next';

import { CONFIG } from '@/config-global';

import { SuperAdminLeftMembersView } from '@/sections/super-admin/view/super-admin-left-members-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Left Members - ${CONFIG.appName}`,
};

// Force dynamic rendering (uses cookies for auth via tRPC context)
export const dynamic = 'force-dynamic';

export default async function SuperAdminLeftMembersPage() {
  // Middleware handles authentication and role-based access
  return <SuperAdminLeftMembersView />;
}
