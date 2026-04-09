import type { Metadata } from 'next';
import { InviteRegisterView } from '@/sections/auth/invite-register-view';
import AuthLayout from '@/components/auth/invite-register';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Complete Registration',
};

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function RegisterWithInvitePage({ params }: PageProps) {
  const { token } = await params;
  return (
    <AuthLayout 
      title="Complete Your Registration"
      subtitle="You've been invited to join as a club leader. Please complete your registration below."
    >
      <InviteRegisterView token={token} />
    </AuthLayout>
  );
}
