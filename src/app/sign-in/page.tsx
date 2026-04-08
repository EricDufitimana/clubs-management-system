import type { Metadata } from 'next';
import { Suspense } from 'react';

import { CONFIG } from 'src/config-global';
import { AuthLayout } from 'src/layouts/auth';

import { SignInView } from 'src/sections/auth';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Sign in - ${CONFIG.appName}`,
};

export default function Page() {
  return (
    <AuthLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <SignInView />
      </Suspense>
    </AuthLayout>
  );
}
