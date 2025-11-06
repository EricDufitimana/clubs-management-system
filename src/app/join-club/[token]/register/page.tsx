import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CONFIG } from 'src/config-global';
import { AuthLayout } from 'src/layouts/auth';
import { InviteRegisterView } from 'src/sections/auth/invite-register-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Complete Registration - ${CONFIG.appName}`,
};

type Props = {
  params: Promise<{ token: string }>;
};

export default async function Page(props: Props) {
  const params = await props.params;
  const token = params.token;

  if (!token) {
    notFound();
  }

  return (
    <AuthLayout>
      <InviteRegisterView token={token} />
    </AuthLayout>
  );
}

