'use client';

import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Popover from '@mui/material/Popover';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import MenuList from '@mui/material/MenuList';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem, { menuItemClasses } from '@mui/material/MenuItem';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export type ClubProps = {
  id: string;
  name: string;
  description: string;
  members: number;
  status: 'active' | 'inactive';
};

type ClubTableRowProps = {
  row: ClubProps;
  selected: boolean;
  onSelectRow: () => void;
  onEdit: (club: ClubProps) => void;
  onDeactivate: (clubId: string) => void;
  onActivate: (clubId: string) => void;
  onInvite: (clubId: string) => void;
  isLoading?: boolean;
};

export function ClubTableRow({ row, selected, onSelectRow, onEdit, onDeactivate, onActivate, onInvite, isLoading = false }: ClubTableRowProps) {
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);

  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    setOpenPopover(null);
  }, []);

  return (
    <>
      <TableRow hover tabIndex={-1} role="checkbox" selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox disableRipple checked={selected} onChange={onSelectRow} />
        </TableCell>

        <TableCell component="th" scope="row">
          {row.name}
        </TableCell>

        <TableCell>{row.description}</TableCell>

        <TableCell align="center">{row.members}</TableCell>

        <TableCell>
          <Label color={row.status === 'active' ? 'success' : 'default'}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {isLoading && <CircularProgress size={12} sx={{ color: 'inherit' }} />}
              {row.status}
            </Box>
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
          <MenuItem 
            onClick={() => {
              handleClosePopover();
              onEdit(row);
            }}
          >
            <Iconify icon="solar:pen-bold" />
            Edit
          </MenuItem>

          {row.status === 'active' && (
            <MenuItem 
              onClick={() => {
                handleClosePopover();
                onInvite(row.id);
              }}
            >
              <Iconify icon="mingcute:add-line" />
              Invite leaders
            </MenuItem>
          )}

          {row.status === 'active' ? (
            <MenuItem 
              onClick={() => {
                handleClosePopover();
                onDeactivate(row.id);
              }} 
              sx={{ color: 'error.main' }}
            >
              <Iconify icon="solar:trash-bin-trash-bold" />
              Deactivate
            </MenuItem>
          ) : (
            <MenuItem 
              onClick={() => {
                handleClosePopover();
                onActivate(row.id);
              }} 
              sx={{ color: 'success.main' }}
            >
              <Iconify icon="solar:check-circle-bold" />
              Activate
            </MenuItem>
          )}
        </MenuList>
      </Popover>
    </>
  );
}

