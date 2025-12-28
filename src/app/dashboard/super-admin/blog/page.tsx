import type { Metadata } from 'next';

import { _posts } from '@/_mock';
import { CONFIG } from '@/config-global';

import { BlogView } from '@/sections/blog/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Blog - ${CONFIG.appName}`,
};

export default function SuperAdminBlogPage() {
  return <BlogView posts={_posts} />;
}

