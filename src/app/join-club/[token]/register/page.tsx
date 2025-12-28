import type { Metadata } from 'next';
import { InviteRegisterView } from '@/sections/auth/invite-register-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Complete Registration',
};

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function RegisterWithInvitePage({ params }: PageProps) {
  const { token } = await params;
  return <InviteRegisterView token={token} />;
}
