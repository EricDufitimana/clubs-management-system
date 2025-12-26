import type { Metadata } from 'next';

import { CONFIG } from 'src/config-global';

import { AdminUsersView } from 'src/sections/admin/view/admin-users-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Members - ${CONFIG.appName}`,
};

// Force dynamic rendering (uses cookies for auth via tRPC context)
export const dynamic = 'force-dynamic';

export default async function AdminMembersPage() {
  // Middleware handles authentication and role-based access
  return <AdminUsersView />;
}

