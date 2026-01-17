'use client';

import { ThemeProvider } from '@/theme/theme-provider';
import { DashboardLayout } from '@/layouts/dashboard';

// ----------------------------------------------------------------------

export default function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <DashboardLayout>{children}</DashboardLayout>
    </ThemeProvider>
  );
}
