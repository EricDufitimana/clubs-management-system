'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import type { LinkProps } from 'next/link';

// ----------------------------------------------------------------------

interface RouterLinkProps extends Omit<LinkProps, 'href'> {
  href: string;
}

export const RouterLink = forwardRef<HTMLAnchorElement, RouterLinkProps>(
  function RouterLink({ href, ...other }, ref) {
    return <Link ref={ref} href={href} {...other} />;
  }
);
