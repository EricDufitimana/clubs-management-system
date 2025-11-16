import type { Metadata } from 'next';

import { CONFIG } from 'src/config-global';
import { UserView } from 'src/sections/user/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Users - ${CONFIG.appName}`,
};

export default async function SuperAdminUsersPage() {
  // Middleware handles authentication and role-based access
  return <UserView />;
}

