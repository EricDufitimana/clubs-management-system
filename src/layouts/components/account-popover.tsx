'use client';

import type { IconButtonProps } from '@mui/material/IconButton';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Popover from '@mui/material/Popover';
import Snackbar from '@mui/material/Snackbar';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';

import { useRouter, usePathname } from '@/routes/hooks';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useTRPC } from '@/trpc/client';

import { Iconify } from '@/components/iconify';
import { ProfileAvatarDialog } from '@/sections/user/profile-avatar-dialog';

// ----------------------------------------------------------------------

export type AccountPopoverProps = IconButtonProps & {
  data?: {
    label: string;
    href: string;
    icon?: React.ReactNode;
    info?: React.ReactNode;
  }[];
};

export function AccountPopover({ data = [], sx, ...other }: AccountPopoverProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useCurrentUser();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);
  const [openProfile, setOpenProfile] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'error',
  });

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleOpenProfile = useCallback(() => {
    handleClosePopover();
    setOpenProfile(true);
  }, [handleClosePopover]);

  const handleCloseProfile = useCallback(() => {
    setOpenProfile(false);
  }, []);

  const handleClickItem = useCallback(
    (path: string) => {
      handleClosePopover();
      router.push(path);
    },
    [handleClosePopover, router]
  );

  const logoutMutation = useMutation({
    ...trpc.auth.logout.mutationOptions(),
    onSuccess: () => {
      // Clear all query cache to prevent stale authenticated data
      queryClient.clear();
      router.push('/');
    },
    onError: (error) => {
      console.error('[ACCOUNT_POPOVER] Logout error:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to logout. Please try again.',
        severity: 'error',
      });
    },
  });

  const handleLogout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <>
      <IconButton
        onClick={handleOpenPopover}
        sx={{
          p: '2px',
          width: 40,
          height: 40,
          background: (theme) =>
            `conic-gradient(${theme.vars?.palette?.primary?.light || theme.palette.primary.light}, ${theme.vars?.palette?.warning?.light || theme.palette.warning.light}, ${theme.vars?.palette?.primary?.light || theme.palette.primary.light})`,
          ...sx,
        }}
        {...other}
      >
        <Avatar 
          src={user.avatarUrl || undefined} 
          alt={user.displayName || 'User'} 
          sx={{ width: 1, height: 1 }}
        >
          {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
        </Avatar>
      </IconButton>

      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { width: 200 },
          },
        }}
      >
        <Box sx={{ p: 2, pb: 1.5 }}>
          {loading ? (
            <>
              <Typography variant="subtitle2" noWrap>
                Loading...
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                ...
              </Typography>
            </>
          ) : (
            <>
          <Typography variant="subtitle2" noWrap>
                {user.displayName || user.email || 'User'}
          </Typography>
              {user.email && (
          <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
                  {user.email}
          </Typography>
              )}
            </>
          )}
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <MenuList
          disablePadding
          sx={{
            p: 1,
            gap: 0.5,
            display: 'flex',
            flexDirection: 'column',
            [`& .${menuItemClasses.root}`]: {
              px: 1,
              gap: 2,
              borderRadius: 0.75,
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' },
              [`&.${menuItemClasses.selected}`]: {
                color: 'text.primary',
                bgcolor: 'action.selected',
                fontWeight: 'fontWeightSemiBold',
              },
            },
          }}
        >
          {data.map((option) => (
            <MenuItem
              key={option.label}
              selected={option.href === pathname}
              onClick={() => handleClickItem(option.href)}
            >
              {option.icon}
              {option.label}
            </MenuItem>
          ))}

          <MenuItem onClick={handleOpenProfile}>
            <Iconify icon="solar:user-id-bold-duotone" width={22} />
            Profile
          </MenuItem>
        </MenuList>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Box sx={{ p: 1 }}>
          <Button 
            fullWidth 
            color="error" 
            size="medium" 
            variant="text"
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            startIcon={logoutMutation.isPending ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
          </Button>
        </Box>
      </Popover>

      <ProfileAvatarDialog open={openProfile} onClose={handleCloseProfile} />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
