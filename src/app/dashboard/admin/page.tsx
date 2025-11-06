import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { CONFIG } from 'src/config-global';
import { OverviewAnalyticsView as DashboardView } from 'src/sections/overview/view';
import { getCurrentUserRole } from 'src/utils/get-user-role';
import { RoleGuard } from 'src/components/role-guard';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Admin Dashboard - ${CONFIG.appName}`,
  description: 'The starting point for your next project with Minimal UI Kit, built on the newest version of Material-UI ©, ready to be customized to your style',
  keywords: 'react,material,kit,application,dashboard,admin,template',
};

export default async function AdminPage() {
  const role = await getCurrentUserRole();
  
  // Redirect super_admin to their dashboard
  if (role === 'super_admin') {
    redirect('/dashboard/super-admin');
  }
  
  // If no role, redirect to sign in
  if (!role) {
    redirect('/sign-in');
  }
  
  return (
    <RoleGuard allowedRoles={['admin']}>
      <DashboardView />
    </RoleGuard>
  );
}

