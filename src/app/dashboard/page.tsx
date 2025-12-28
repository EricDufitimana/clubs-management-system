import type { Metadata } from 'next';

import { redirect } from 'next/navigation';

import { getCurrentUserRole } from '@/utils/get-user-role';

import { CONFIG } from '@/config-global';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Dashboard - ${CONFIG.appName}`,
  description: 'The starting point for your next project with Minimal UI Kit, built on the newest version of Material-UI ©, ready to be customized to your style',
  keywords: 'react,material,kit,application,dashboard,admin,template',
};

// Force dynamic rendering (uses cookies for auth)
export const dynamic = 'force-dynamic';

export default async function Page() {
  const role = await getCurrentUserRole();
  
  // Redirect to role-based dashboard
  if (role === 'super_admin') {
    redirect('/dashboard/super-admin');
  } else if (role === 'admin') {
    redirect('/dashboard/admin');
  }
  
  // If no role, show default dashboard (for non-authenticated or other users)
  return null;
}
