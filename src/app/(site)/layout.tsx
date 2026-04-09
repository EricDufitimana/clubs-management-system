'use client';

import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer/Footer';
import ScrollToTop from '@/components/scroll-to-top';

// ----------------------------------------------------------------------

export default function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
      <ScrollToTop />
    </>
  );
}
