import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { CONFIG } from 'src/config-global';
import { UserView } from 'src/sections/user/view';
import { getCurrentUserRole } from 'src/utils/get-user-role';
import { RoleGuard } from 'src/components/role-guard';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Users - ${CONFIG.appName}`,
};

export default async function SuperAdminUsersPage() {
  const role = await getCurrentUserRole();
  
  // Redirect admin to their users page
  if (role === 'admin') {
    redirect('/dashboard/admin/users');
  }
  
  // If no role, redirect to sign in
  if (!role) {
    redirect('/sign-in');
  }
  
  return (
    <RoleGuard allowedRoles={['super_admin']}>
      <UserView />
    </RoleGuard>
  );
}

