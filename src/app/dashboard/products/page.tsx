import type { Metadata } from 'next';

import { CONFIG } from '@/config-global';

import { ProductsView } from '@/sections/product/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Products - ${CONFIG.appName}`,
};

export default function Page() {
  return <ProductsView />;
}
