import type { Metadata } from 'next';

import { CONFIG } from 'src/config-global';
import { AuthLayout } from 'src/layouts/auth';

import { SignUpView } from 'src/sections/auth';

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

