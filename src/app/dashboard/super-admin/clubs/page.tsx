import type { Metadata } from 'next';

import { CONFIG } from '@/config-global';

import { ClubsView } from '@/sections/clubs/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Clubs - ${CONFIG.appName}`,
};

export default function SuperAdminClubsPage() {
  return <ClubsView />;
}

