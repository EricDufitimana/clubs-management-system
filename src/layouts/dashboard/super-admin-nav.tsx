'use client';

import type { Breakpoint } from '@mui/material/styles';

import { NavMobile, NavDesktop } from './nav';
import { superAdminNavItems } from '../nav-config-dashboard';
import { _workspaces } from '../nav-config-workspace';

// ----------------------------------------------------------------------

type SuperAdminNavProps = {
  layoutQuery?: Breakpoint;
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
};

export function SuperAdminNav({ layoutQuery = 'lg', open, onClose, onOpen }: SuperAdminNavProps) {
  return (
    <>
      <NavMobile data={superAdminNavItems} open={open} onClose={onClose} workspaces={_workspaces} />
      <NavDesktop data={superAdminNavItems} layoutQuery={layoutQuery} workspaces={_workspaces} sx={{ ml: 3 }} />
    </>
  );
}

