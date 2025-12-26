import type { Metadata } from 'next';

import { CONFIG } from 'src/config-global';

import { MemberView } from 'src/sections/member/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Members - ${CONFIG.appName}`,
};

// Force dynamic rendering (uses cookies for auth via tRPC context)
export const dynamic = 'force-dynamic';

export default async function SuperAdminMembersPage() {
  // Middleware handles authentication and role-based access
  return <MemberView />;
}

