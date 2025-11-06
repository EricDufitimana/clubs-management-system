import 'src/global.css';

import type { Metadata } from 'next';

import { Providers } from './providers';
import { GithubButton } from './github-button';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Minimal UI Kit',
  description: 'The starting point for your next project with Minimal UI Kit',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <GithubButton />
        </Providers>
      </body>
    </html>
  );
}
