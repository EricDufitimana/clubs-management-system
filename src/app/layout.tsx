import 'src/global.css';
import { TRPCReactProvider } from '@/trpc/client';
import type { Metadata } from 'next';

import { Providers } from './providers';
import { ClerkProvider } from '@clerk/nextjs';
// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Clubs Management System',
  description: '',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <TRPCReactProvider>
      <ClerkProvider>
        <html lang="en">
          <body>
            <Providers>
              {children}
            </Providers>
          </body>
        </html>
      </ClerkProvider>
    </TRPCReactProvider>
  );
}
