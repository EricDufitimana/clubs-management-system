'use client';

import type { LinkProps } from 'next/link';

import Link from 'next/link';
import { forwardRef } from 'react';

// ----------------------------------------------------------------------

interface RouterLinkProps extends Omit<LinkProps, 'href'> {
  href: string;
}

export const RouterLink = forwardRef<HTMLAnchorElement, RouterLinkProps>(
  function RouterLink({ href, ...other }, ref) {
    return <Link ref={ref} href={href} {...other} />;
  }
);
