import type { Metadata } from 'next';
import { Suspense } from 'react';

import { CONFIG } from '@/config-global';
import { AuthLayout } from '@/layouts/auth';

import { SignInView } from '@/sections/auth';

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
