'use client';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Popover from '@mui/material/Popover';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import MenuList from '@mui/material/MenuList';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';

import { Label } from '@/components/label';
import { Iconify } from '@/components/iconify';

import { getGradeColor, formatCombination, getCombinationColor } from 'src/sections/user/utils/colors';

// ----------------------------------------------------------------------

export type UserProps = {
  id: string;
  name: string;
  role?: string;
  status: string;
  company?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  club_name?: string | null;
};

type UserTableRowProps = {
  row: UserProps;
  selected: boolean;
  onSelectRow: () => void;
  onRemove?: () => void;
  isSuperAdmin?: boolean;
};

export function UserTableRow({ row, selected, onSelectRow, onRemove, isSuperAdmin = false }: UserTableRowProps) {
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    if (!isRemoving) {
      setOpenPopover(null);
    }
  }, [isRemoving]);

  const handleRemove = useCallback(async () => {
    if (!onRemove || isRemoving) return;
    
    setIsRemoving(true);
    try {
      await onRemove();
    } finally {
      setIsRemoving(false);
      setOpenPopover(null);
    }
  }, [onRemove, isRemoving]);


  return (
    <>
      <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox disableRipple checked={selected} onChange={onSelectRow} />
        </TableCell>

        <TableCell component="th" scope="row">
          <Box
            sx={{
              gap: 2,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Avatar alt={row.name} src={row.avatarUrl} />
            {row.name}
          </Box>
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {row.company ? (
              <Label color={getCombinationColor(row.company)} variant="soft">
                {formatCombination(row.company)}
              </Label>
            ) : (
              '-'
            )}
          </Box>
        </TableCell>

        <TableCell>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {row.role && row.role !== '-' ? (
              <Label 
                color={getGradeColor(row.role)} 
                variant="soft"
              >
                {row.role}
              </Label>
            ) : (
              '-'
            )}
          </Box>
        </TableCell>

        {isSuperAdmin && (
          <TableCell>
            {row.club_name ? (
              <Label color="default" variant="soft">
                {row.club_name}
              </Label>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No Club
              </Typography>
            )}
          </TableCell>
        )}

        <TableCell>
          <Label color={(row.status === 'left' && 'error') || 'success'}>
            {row.status === 'left' ? 'Left' : 'Active'}
          </Label>
        </TableCell>

        <TableCell align="right">
          <IconButton onClick={handleOpenPopover}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <Popover
        open={!!openPopover}
        anchorEl={openPopover}
        onClose={handleClosePopover}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuList
          disablePadding
          sx={{
            p: 0.5,
            gap: 0.5,
            width: 140,
            display: 'flex',
            flexDirection: 'column',
            [`& .${menuItemClasses.root}`]: {
              px: 1,
              gap: 2,
              borderRadius: 0.75,
              [`&.${menuItemClasses.selected}`]: { bgcolor: 'action.selected' },
            },
          }}
        >
          {onRemove && (
            <MenuItem 
              onClick={handleRemove}
              disabled={isRemoving}
              sx={{ color: 'error.main' }}
            >
              {isRemoving ? (
                <CircularProgress size={16} sx={{ mr: 1 }} />
              ) : null}
              {isRemoving ? 'Removing...' : 'Remove'}
            </MenuItem>
          )}
        </MenuList>
      </Popover>
    </>
  );
}
