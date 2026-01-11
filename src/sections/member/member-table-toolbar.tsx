import Box from '@mui/material/Box';
import Select from '@mui/material/Select';
import Tooltip from '@mui/material/Tooltip';
import Toolbar from '@mui/material/Toolbar';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from '@/components/iconify';

// ----------------------------------------------------------------------

type MemberTableToolbarProps = {
  numSelected: number;
  filterName: string;
  onFilterName: (event: React.ChangeEvent<HTMLInputElement>) => void;
  currentUserClub?: string | null;
  isSuperAdmin?: boolean;
  clubs?: Array<{ id: string; club_name: string }>;
  selectedClub?: string;
  onClubChange?: (club: string) => void;
  onDeleteSelected?: () => void;
};

export function MemberTableToolbar({ 
  numSelected, 
  filterName, 
  onFilterName, 
  currentUserClub,
  isSuperAdmin = false,
  clubs = [],
  selectedClub = 'all',
  onClubChange,
  onDeleteSelected,
}: MemberTableToolbarProps) {
  return (
    <Toolbar
      sx={{
        height: 96,
        display: 'flex',
        justifyContent: 'space-between',
        p: (theme) => theme.spacing(0, 1, 0, 3),
        ...(numSelected > 0 && {
          color: 'primary.main',
          bgcolor: 'primary.lighter',
        }),
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
      {numSelected > 0 ? (
        <Typography component="div" variant="subtitle1">
          {numSelected} selected
        </Typography>
      ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <OutlinedInput
          value={filterName}
          onChange={onFilterName}
          placeholder={isSuperAdmin ? "Search member..." : "Search member..."}
          startAdornment={
            <InputAdornment position="start">
              <Iconify width={20} icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
            </InputAdornment>
          }
          sx={{ maxWidth: 320 }}
        />
            {isSuperAdmin && clubs.length > 0 && (
              <FormControl sx={{ minWidth: 200 }}>
                <Select
                  value={selectedClub}
                  onChange={(e) => onClubChange?.(e.target.value)}
                  displayEmpty
                >
                  <MenuItem value="all">All Clubs</MenuItem>
                  {clubs.map((club) => (
                    <MenuItem key={club.id} value={club.club_name}>
                      {club.club_name}
                    </MenuItem>
                  ))}
                  <MenuItem value="No Club">No Club</MenuItem>
                </Select>
              </FormControl>
            )}
            {!isSuperAdmin && currentUserClub && (
              <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>
                Club: <strong>{currentUserClub}</strong>
              </Typography>
            )}
          </Box>
      )}
      </Box>

      {numSelected > 0 ? (
        <Tooltip title="Delete selected">
          <IconButton onClick={onDeleteSelected}>
            <Iconify icon="solar:trash-bin-trash-bold" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Filter list">
          <IconButton>
            <Iconify icon="ic:round-filter-list" />
          </IconButton>
        </Tooltip>
      )}
    </Toolbar>
  );
}
