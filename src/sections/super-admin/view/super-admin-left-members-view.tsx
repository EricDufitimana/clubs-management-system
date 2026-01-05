'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TableSortLabel from '@mui/material/TableSortLabel';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

import { useUserRole } from '@/hooks/use-user-role';

import { DashboardContent } from '@/layouts/dashboard';

import { Scrollbar } from '@/components/scrollbar';

import { TableNoData } from '@/sections/member/table-no-data';
import { TableEmptyRows } from '@/sections/member/table-empty-rows';
import { emptyRows, getComparator, visuallyHidden } from '@/sections/member/utils';
import { useTRPC } from '@/trpc/client';

// ----------------------------------------------------------------------

type LeftMember = {
  id: string;
  name: string;
  grade?: string;
  combination?: string;
  avatarUrl?: string;
  joined_at: string;
  left_at: string;
  clubName?: string;
};

type Club = {
  id: string;
  club_name: string;
};

// ----------------------------------------------------------------------

/**
 * Extracts acronym from combination string
 */
function getCombinationAcronym(combination: string | null | undefined): string {
  if (!combination || combination === '-') return '-';
  
  if (combination.includes('-')) {
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

// ----------------------------------------------------------------------

export function SuperAdminLeftMembersView() {
  const table = useTable();
  const { userId } = useUserRole();
  const trpc = useTRPC();

  const [filterName, setFilterName] = useState('');
  const [members, setMembers] = useState<LeftMember[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string>('all');

  // Fetch all clubs for super admin
  const { data: clubsData } = useQuery({
    ...trpc.clubs.getAllClubs.queryOptions(),
    enabled: !!userId,
  });

  // Fetch left members for all clubs or specific club
  const { data: leftMembersData, isLoading: loading } = useQuery({
    ...trpc.users.getLeftMembers.queryOptions({ 
      clubId: selectedClubId === 'all' ? undefined : selectedClubId 
    }),
    enabled: !!userId,
  });

  // Update local state when data changes
  useEffect(() => {
    if (leftMembersData) {
      const mappedMembers = leftMembersData.map((member: any) => ({
        id: member.id,
        name: member.name,
        grade: member.grade || '-',
        combination: getCombinationAcronym(member.combination),
        avatarUrl: member.avatarUrl || '',
        joined_at: member.joined_at,
        left_at: member.left_at,
        clubName: member.clubName || 'Unknown Club',
      }));
      setMembers(mappedMembers);
    }
  }, [leftMembersData]);

  const dataFiltered = members
    .filter((member) => {
      if (!filterName) return true;
      return member.name.toLowerCase().includes(filterName.toLowerCase());
    })
    .sort((a, b) => {
      const order = getComparator(table.order, table.orderBy)(a, b);
      return order;
    });

  const notFound = !dataFiltered.length && !!filterName;
  const noMembers = !loading && members.length === 0 && !filterName;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleClubChange = (event: SelectChangeEvent<string>) => {
    setSelectedClubId(event.target.value);
    table.onResetPage();
  };

  return (
    <DashboardContent>
      <Box
        sx={{
          mb: 5,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4">
            Left Members
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            View all members who have left clubs across all organizations
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/dashboard/super-admin/members"
          variant="outlined"
          color="inherit"
        >
          Back to Active Members
        </Button>
      </Box>

      <Card>
        <Box sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Club</InputLabel>
            <Select
              value={selectedClubId}
              label="Filter by Club"
              onChange={handleClubChange}
            >
              <MenuItem value="all">All Clubs</MenuItem>
              {clubsData?.map((club: Club) => (
                <MenuItem key={club.id} value={club.id}>
                  {club.club_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  {[
                    { id: 'name', label: 'Name' },
                    { id: 'clubName', label: 'Club' },
                    { id: 'combination', label: 'Combination' },
                    { id: 'grade', label: 'Grade' },
                    { id: 'joined_at', label: 'Joined Date' },
                    { id: 'left_at', label: 'Left Date' },
                  ].map((headCell) => (
                    <TableCell
                      key={headCell.id}
                      align={headCell.id === 'joined_at' || headCell.id === 'left_at' ? 'right' : 'left'}
                      sortDirection={table.orderBy === headCell.id ? table.order : false}
                    >
                      <TableSortLabel
                        hideSortIcon
                        active={table.orderBy === headCell.id}
                        direction={table.orderBy === headCell.id ? table.order : 'asc'}
                        onClick={() => table.onSort(headCell.id)}
                      >
                        {headCell.label}
                        {table.orderBy === headCell.id ? (
                          <Box sx={{ ...visuallyHidden }}>
                            {table.order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                          </Box>
                        ) : null}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {dataFiltered
                      .slice(
                        table.page * table.rowsPerPage,
                        table.page * table.rowsPerPage + table.rowsPerPage
                      )
                      .map((row) => (
                        <TableRow key={row.id} hover>
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
                          <TableCell>{row.clubName}</TableCell>
                          <TableCell>{row.combination || '-'}</TableCell>
                          <TableCell>{row.grade || '-'}</TableCell>
                          <TableCell align="right">{formatDate(row.joined_at)}</TableCell>
                          <TableCell align="right">{formatDate(row.left_at)}</TableCell>
                        </TableRow>
                      ))}

                    <TableEmptyRows
                      height={68}
                      emptyRows={emptyRows(table.page, table.rowsPerPage, members.length)}
                    />

                    {noMembers && (
                      <TableRow>
                        <TableCell align="center" colSpan={6}>
                          <Box sx={{ py: 15, textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                              No Left Members Found
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              There are no members who have left any clubs yet.
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}

                    {notFound && <TableNoData searchQuery={filterName} />}
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <TablePagination
          component="div"
          page={table.page}
          count={members.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          rowsPerPageOptions={[5, 10, 25]}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function useTable() {
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState('left_at');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  const onSort = useCallback(
    (id: string) => {
      const isAsc = orderBy === id && order === 'asc';
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(id);
    },
    [order, orderBy]
  );

  const onSelectAllRows = useCallback((checked: boolean, newSelecteds: string[]) => {
    if (checked) {
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  }, []);

  const onSelectRow = useCallback(
    (inputValue: string) => {
      const newSelected = selected.includes(inputValue)
        ? selected.filter((value) => value !== inputValue)
        : [...selected, inputValue];

      setSelected(newSelected);
    },
    [selected]
  );

  const onResetPage = useCallback(() => {
    setPage(0);
  }, []);

  const onChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const onChangeRowsPerPage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      onResetPage();
    },
    [onResetPage]
  );

  return {
    page,
    order,
    onSort,
    orderBy,
    selected,
    rowsPerPage,
    onSelectRow,
    onResetPage,
    onChangePage,
    onSelectAllRows,
    onChangeRowsPerPage,
  };
}
