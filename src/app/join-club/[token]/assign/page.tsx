import type { Metadata } from 'next';
import { InviteAssignView } from '@/sections/auth/invite-assign-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Assigning Club',
};

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function AssignClubPage({ params }: PageProps) {
  const { token } = await params;
  return <InviteAssignView token={token} />;
}

