import type { Metadata } from 'next';

import { _posts } from 'src/_mock';
import { CONFIG } from 'src/config-global';
import { BlogView } from 'src/sections/blog/view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: `Blog - ${CONFIG.appName}`,
};

export default function AdminBlogPage() {
  return <BlogView posts={_posts} />;
}

