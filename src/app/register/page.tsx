import type { Metadata } from 'next';

import { CONFIG } from 'src/config-global';

import { SignUpView } from 'src/sections/auth';
import { AuthLayout } from 'src/layouts/auth';

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

