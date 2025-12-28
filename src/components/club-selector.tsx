'use client';

import { useState, useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { menuItemClasses } from '@mui/material/MenuItem';

import { useClubContext } from '@/contexts/club-context';
import { Iconify } from '@/components/iconify';
import { Label } from '@/components/label';

type ClubSelectorProps = {
  sx?: any;
};

export function ClubSelector({ sx }: ClubSelectorProps) {
  const { selectedClub, clubs, setSelectedClub, isLoading } = useClubContext();
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  const handleChangeClub = useCallback(
    (club: any) => {
      setSelectedClub(club);
      handleClosePopover();
    },
    [setSelectedClub, handleClosePopover]
  );

  if (isLoading) {
    return (
      <Box
        sx={{
          pl: 2,
          py: 3,
          gap: 1.5,
          pr: 1.5,
          width: 1,
          display: 'flex',
          alignItems: 'center',
          borderRadius: 1.5,
          bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
          ...sx,
        }}
      >
        <CircularProgress size={20} />
        <Box sx={{ typography: 'body2', color: 'text.secondary' }}>Loading clubs...</Box>
      </Box>
    );
  }

  if (clubs.length === 0) {
    return null;
  }

  const hasMultipleClubs = clubs.length > 1;

  const renderAvatar = (clubName: string) => (
    <Box
      sx={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: (theme) => varAlpha(theme.vars.palette.primary.mainChannel, 0.16),
        color: 'primary.main',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {clubName.charAt(0).toUpperCase()}
    </Box>
  );

  return (
    <>
      <ButtonBase
        disableRipple
        onClick={hasMultipleClubs ? handleOpenPopover : undefined}
        disabled={!hasMultipleClubs}
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
          cursor: hasMultipleClubs ? 'pointer' : 'default',
          ...sx,
        }}
      >
        {selectedClub && renderAvatar(selectedClub.club_name)}

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
          {selectedClub?.club_name || 'Select Club'}
          <Label color="info">Active</Label>
        </Box>

        {hasMultipleClubs && (
          <Iconify width={16} icon="carbon:chevron-sort" sx={{ color: 'text.disabled' }} />
        )}
      </ButtonBase>

      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
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
          {clubs.map((club) => (
            <MenuItem
              key={club.id}
              selected={club.id === selectedClub?.id}
              onClick={() => handleChangeClub(club)}
            >
              {renderAvatar(club.club_name)}

              <Box component="span" sx={{ flexGrow: 1 }}>
                {club.club_name}
              </Box>

              <Label color="info">Active</Label>
            </MenuItem>
          ))}
        </MenuList>
      </Popover>
    </>
  );
}

