'use client';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@/theme/theme-provider';
import { DashboardLayout } from '@/layouts/dashboard';

// ----------------------------------------------------------------------

export default function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <CssBaseline />
      <DashboardLayout>{children}</DashboardLayout>
    </ThemeProvider>
  );
}
