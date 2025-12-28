import type { Metadata } from 'next';

import { redirect } from 'next/navigation';

import { getCurrentUserRole } from '@/utils/get-user-role';

import { CONFIG } from '@/config-global';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Clubs - ${CONFIG.appName}`,
};

// Force dynamic rendering (uses cookies for auth)
export const dynamic = 'force-dynamic';

export default async function ClubsPage() {
  const role = await getCurrentUserRole();
  
  // Redirect to role-based clubs page
  if (role === 'super_admin') {
    redirect('/dashboard/super-admin/clubs');
  } else {
    // If not super_admin, redirect to dashboard
    redirect('/dashboard');
  }
}

