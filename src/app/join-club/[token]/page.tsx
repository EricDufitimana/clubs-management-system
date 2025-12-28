import type { Metadata } from 'next';
import { InviteChoiceView } from 'src/sections/auth/invite-choice-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Accept Invitation',
};

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function JoinClubPage({ params }: PageProps) {
  const { token } = await params;
  return <InviteChoiceView token={token} />;
}
