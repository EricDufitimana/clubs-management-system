import type { Metadata } from 'next';

import { CONFIG } from 'src/config-global';
import { SessionsView } from 'src/sections/sessions/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Sessions - ${CONFIG.appName}`,
};

export default async function AdminSessionsPage() {
  // Middleware handles authentication and role-based access
  return <SessionsView />;
}

