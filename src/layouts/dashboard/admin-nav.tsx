'use client';

import type { Breakpoint } from '@mui/material/styles';

import { NavMobile, NavDesktop } from './nav';
import { adminNavItems } from '../nav-config-dashboard';
import { _workspaces } from '../nav-config-workspace';

// ----------------------------------------------------------------------

type AdminNavProps = {
  layoutQuery?: Breakpoint;
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
};

export function AdminNav({ layoutQuery = 'lg', open, onClose, onOpen }: AdminNavProps) {
  return (
    <>
      <NavMobile data={adminNavItems} open={open} onClose={onClose} workspaces={_workspaces} />
      <NavDesktop data={adminNavItems} layoutQuery={layoutQuery} workspaces={_workspaces} sx={{ ml: 3 }} />
    </>
  );
}

