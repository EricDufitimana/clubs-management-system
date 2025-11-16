import type { Metadata } from 'next';

import { CONFIG } from 'src/config-global';

import { ClubsView } from 'src/sections/clubs/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Clubs - ${CONFIG.appName}`,
};

export default function SuperAdminClubsPage() {
  return <ClubsView />;
}

