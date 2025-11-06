import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { CONFIG } from 'src/config-global';
import { SessionsView } from 'src/sections/sessions/view';
import { getCurrentUserRole } from 'src/utils/get-user-role';
import { RoleGuard } from 'src/components/role-guard';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Sessions - ${CONFIG.appName}`,
};

export default async function AdminSessionsPage() {
  const role = await getCurrentUserRole();

  if (role === 'super_admin') {
    redirect('/dashboard/super-admin/users');
  }

  if (!role) {
    redirect('/sign-in');
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <SessionsView />
    </RoleGuard>
  );
}

