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
import { alpha } from '@mui/material/styles';

import { useClubContext } from '@/contexts/club-context';
import { Iconify } from '@/components/iconify';
import { Label } from '@/components/label';

export function ClubSelectorHeader() {
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
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1,
          borderRadius: 1.5,
          bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
          minWidth: 180,
        }}
      >
        <CircularProgress size={16} />
        <Typography variant="body2" color="text.secondary">
          Loading clubs...
        </Typography>
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
        width: 20,
        height: 20,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: (theme) => varAlpha(theme.vars.palette.primary.mainChannel, 0.16),
        color: 'primary.main',
        fontSize: 10,
        fontWeight: 700,
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
          px: 1.5,
          py: 0.75,
          gap: 1,
          borderRadius: 1.5,
          textAlign: 'left',
          justifyContent: 'flex-start',
          bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
          transition: 'all 0.2s',
          cursor: hasMultipleClubs ? 'pointer' : 'default',
          '&:hover': {
            bgcolor: (theme) => hasMultipleClubs 
              ? varAlpha(theme.vars.palette.grey['500Channel'], 0.12)
              : varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
          },
        }}
      >
        {selectedClub && renderAvatar(selectedClub.club_name)}

        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            maxWidth: 120,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {selectedClub?.club_name || 'Select Club'}
        </Typography>

        {hasMultipleClubs && (
          <Iconify width={14} icon="carbon:chevron-sort" sx={{ color: 'text.disabled' }} />
        )}
      </ButtonBase>

      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { mt: 1 },
          },
        }}
      >
        <MenuList
          disablePadding
          sx={{
            p: 0.5,
            gap: 0.5,
            minWidth: 220,
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

              {club.id === selectedClub?.id && (
                <Iconify icon="eva:checkmark-fill" width={18} sx={{ color: 'primary.main' }} />
              )}
            </MenuItem>
          ))}
        </MenuList>
      </Popover>
    </>
  );
}

