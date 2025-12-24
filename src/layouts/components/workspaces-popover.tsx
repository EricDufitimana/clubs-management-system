'use client';

import type { ButtonBaseProps } from '@mui/material/ButtonBase';

import { useState, useCallback, useEffect } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import MenuList from '@mui/material/MenuList';
import ButtonBase from '@mui/material/ButtonBase';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { useTRPC } from '@/trpc/client';
import { useUserRole } from 'src/hooks/use-user-role';

// ----------------------------------------------------------------------

export type WorkspacesPopoverProps = ButtonBaseProps & {
  data?: {
    id: string;
    name: string;
    logo: string;
    plan: string;
  }[];
};

export function WorkspacesPopover({ data = [], sx, ...other }: WorkspacesPopoverProps) {
  const trpc = useTRPC();
  const { userId, isSuperAdmin } = useUserRole();
  
  // Fetch club name for admin users
  const { data: clubData } = useQuery({
    ...trpc.clubs.getCurrentUserClub.queryOptions(),
    enabled: !!userId && !isSuperAdmin,
  });

  // Fetch all clubs for super admin
  const { data: allClubsData } = useQuery({
    ...trpc.clubs.getAllClubs.queryOptions(),
    enabled: !!userId && isSuperAdmin,
  });

  // Determine workspace name based on role
  const workspaceName = isSuperAdmin 
    ? 'All Clubs' 
    : (clubData?.club_name || 'My Club');

  // Create dynamic workspace data
  const dynamicWorkspace = {
    id: 'current-club',
    name: workspaceName,
    plan: 'Active',
    logo: '/assets/icons/workspaces/logo-1.webp',
  };

  const [workspace, setWorkspace] = useState(dynamicWorkspace);
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);

  // Update workspace when club data changes
  useEffect(() => {
    if (workspaceName) {
      setWorkspace({
        id: 'current-club',
        name: workspaceName,
        plan: 'Active',
        logo: '/assets/icons/workspaces/logo-1.webp',
      });
    }
  }, [workspaceName]);

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleChangeWorkspace = useCallback(
    (newValue: (typeof data)[number]) => {
      setWorkspace(newValue);
      handleClosePopover();
    },
    [handleClosePopover]
  );

  const renderAvatar = (alt: string, src: string) => (
    <Box component="img" alt={alt} src={src} sx={{ width: 24, height: 24, borderRadius: '50%' }} />
  );

  const renderLabel = (plan: string) => (
    <Label color={plan === 'Free' ? 'default' : 'info'}>{plan}</Label>
  );

  return (
    <>
      <ButtonBase
        disableRipple
        onClick={handleOpenPopover}
        sx={{
          pl: 2,
          py: 3,
          gap: 1.5,
          pr: 1.5,
          width: 1,
          borderRadius: 1.5,
          textAlign: 'left',
          justifyContent: 'flex-start',
          bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
          ...sx,
        }}
        {...other}
      >
        {renderAvatar(workspace?.name, workspace?.logo)}

        <Box
          sx={{
            gap: 1,
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            typography: 'body2',
            fontWeight: 'fontWeightSemiBold',
          }}
        >
          {workspace?.name}
          {renderLabel(workspace?.plan)}
        </Box>

        <Iconify width={16} icon="carbon:chevron-sort" sx={{ color: 'text.disabled' }} />
      </ButtonBase>

      <Popover open={!!openPopover} anchorEl={openPopover} onClose={handleClosePopover}>
        <MenuList
          disablePadding
          sx={{
            p: 0.5,
            gap: 0.5,
            width: 260,
            display: 'flex',
            flexDirection: 'column',
            [`& .${menuItemClasses.root}`]: {
              p: 1.5,
              gap: 1.5,
              borderRadius: 0.75,
              [`&.${menuItemClasses.selected}`]: {
                bgcolor: 'action.selected',
                fontWeight: 'fontWeightSemiBold',
              },
            },
          }}
        >
          {/* Show current club/workspace */}
          <MenuItem
            key={workspace.id}
            selected={true}
            onClick={() => handleChangeWorkspace(workspace)}
          >
            {renderAvatar(workspace.name, workspace.logo)}

            <Box component="span" sx={{ flexGrow: 1 }}>
              {workspace.name}
            </Box>

            {renderLabel(workspace.plan)}
          </MenuItem>
          
          {/* Show additional workspaces if provided */}
          {data.map((option) => (
            <MenuItem
              key={option.id}
              selected={option.id === workspace?.id}
              onClick={() => handleChangeWorkspace(option)}
            >
              {renderAvatar(option.name, option.logo)}

              <Box component="span" sx={{ flexGrow: 1 }}>
                {option.name}
              </Box>

              {renderLabel(option.plan)}
            </MenuItem>
          ))}
        </MenuList>
      </Popover>
    </>
  );
}
