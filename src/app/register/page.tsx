import type { Metadata } from 'next';

import { CONFIG } from '@/config-global';
import { AuthLayout } from '@/layouts/auth';

import { SignUpView } from '@/sections/auth';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Register - ${CONFIG.appName}`,
};

export default function Page() {
  return (
    <AuthLayout>
      <SignUpView />
    </AuthLayout>
  );
}

