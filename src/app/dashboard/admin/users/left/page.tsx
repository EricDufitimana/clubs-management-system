import type { Metadata } from 'next';

import { CONFIG } from 'src/config-global';

import { LeftMembersView } from 'src/sections/user/view/left-members-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Left Members - ${CONFIG.appName}`,
};

export default async function AdminLeftMembersPage() {
  // Middleware handles authentication and role-based access
  return <LeftMembersView />;
}

