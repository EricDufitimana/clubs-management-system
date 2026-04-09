'use client';

import { useEffect } from 'react';

import { usePathname } from '@/routes/hooks';

import { ThemeProvider } from '@/theme/theme-provider';
import { ClubProvider } from '@/contexts/club-context';

// ----------------------------------------------------------------------

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  useScrollToTop();

  return (
    <ThemeProvider>
      <ClubProvider>
        {children}
      </ClubProvider>
    </ThemeProvider>
  );
}

// ----------------------------------------------------------------------

function useScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
