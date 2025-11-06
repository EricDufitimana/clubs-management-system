import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { CONFIG } from 'src/config-global';
import { LeftMembersView } from 'src/sections/user/view/left-members-view';
import { getCurrentUserRole } from 'src/utils/get-user-role';
import { RoleGuard } from 'src/components/role-guard';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Left Members - ${CONFIG.appName}`,
};

export default async function AdminLeftMembersPage() {
  const role = await getCurrentUserRole();
  
  // Redirect super_admin to their users page
  if (role === 'super_admin') {
    redirect('/dashboard/super-admin/users');
  }
  
  // If no role, redirect to sign in
  if (!role) {
    redirect('/sign-in');
  }
  
  return (
    <RoleGuard allowedRoles={['admin']}>
      <LeftMembersView />
    </RoleGuard>
  );
}

