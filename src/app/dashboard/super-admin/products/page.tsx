import type { Metadata } from 'next';

import { CONFIG } from 'src/config-global';
import { ProductsView } from 'src/sections/product/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Products - ${CONFIG.appName}`,
};

export default function SuperAdminProductsPage() {
  return <ProductsView />;
}

