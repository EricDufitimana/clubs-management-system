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

import { getGradeColor, formatCombination, getCombinationColor } from '@/sections/member/utils/colors';

// ----------------------------------------------------------------------
function getCombinationAcronym(combination: string | null | undefined): string {
  if (!combination || combination === '-') return '-';

  if(combination.startsWith('Ey')){
    return combination;
  }
  else if (combination.includes('-')) {
    return combination
      .split('-')
      .map(part => part.trim().charAt(0).toUpperCase())
      .join('');
  }
  
  
  const words = combination.split(/(?=[A-Z])/);
  
  const groupedWords: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const currentWord = words[i];
    const nextWord = words[i + 1];
    
    if (currentWord === 'Computer' && nextWord === 'Science') {
      groupedWords.push('ComputerScience');
      i++; 
    } else {
      groupedWords.push(currentWord);
    }
  }
  
  return groupedWords
    .map(word => word.charAt(0).toUpperCase())
    .join('');
}


export type UserProps = {
  id: string;
  name: string;
  role?: string;
  status: string;
  company?: string;
  avatarUrl?: string;
  isVerified?: boolean;
  club_name?: string | null;
  club_category?: 'subject_oriented_clubs' | 'soft_skills_oriented_clubs' | null;
  subject_oriented_club?: string | null;
  soft_oriented_club?: string | null;
};

type MemberTableRowProps = {
  row: UserProps;
  selected: boolean;
  onSelectRow: () => void;
  onRemove?: () => void;
  onDelete?: () => void;
  isSuperAdmin?: boolean;
  showAllClubs?: boolean;
};


export function MemberTableRow({ row, selected, onSelectRow, onRemove, onDelete, isSuperAdmin = false, showAllClubs = false }: MemberTableRowProps) {
  const [openPopover, setOpenPopover] = useState<HTMLButtonElement | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  console.log("The Is Super Admin From the Member Table Row: ", isSuperAdmin);  
  const handleOpenPopover = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setOpenPopover(event.currentTarget);
  }, []);

  const handleClosePopover = useCallback(() => {
    if (!isRemoving && !isDeleting) {
      setOpenPopover(null);
    }
  }, [isRemoving, isDeleting]);

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

  const handleDelete = useCallback(async () => {
    if (!onDelete || isDeleting) return;
    
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
      setOpenPopover(null);
    }
  }, [onDelete, isDeleting]);


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
                {
                  isSuperAdmin ?
                  getCombinationAcronym(row.company)
                  :
                  formatCombination(row.company)
                }
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
          <>
            {showAllClubs ? (
              <>
                <TableCell>
                  {row.subject_oriented_club ? (
                    <Label color="primary" variant="soft">
                      {row.subject_oriented_club}
                    </Label>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {row.soft_oriented_club ? (
                    <Label color="secondary" variant="soft">
                      {row.soft_oriented_club}
                    </Label>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  )}
                </TableCell>
              </>
            ) : (
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
          </>
        )}

   

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
            width: 180,
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
          {isSuperAdmin ? (
              <>
              {onRemove && (
                <MenuItem 
                  onClick={handleRemove}
                  disabled={isRemoving || isDeleting}
                >
                  {isRemoving ? (
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                  ) : null}
                  {isRemoving ? 'Marking as left...' : 'Mark as Left'}
                </MenuItem>
              )}
              {onDelete && (
                <MenuItem 
                  onClick={handleDelete}
                  disabled={isRemoving || isDeleting}
                  sx={{ color: 'error.main' }}
                >
                  {isDeleting ? (
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                  ) : null}
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </MenuItem>
              )}
            </>
  
          ) : (
            <>
              <MenuItem disabled sx={{ color: 'text.secondary' }}>
                <Iconify icon="eva:lock-outline" sx={{ mr: 1 }} />
                Super Admin View
              </MenuItem>
              <MenuItem disabled sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>
                Contact club admin to manage members
              </MenuItem>
            </>

          )}
        </MenuList>
      </Popover>
    </>
  );
}
