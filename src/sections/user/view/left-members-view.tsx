'use client';

import { useState, useCallback, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import CircularProgress from '@mui/material/CircularProgress';
import Avatar from '@mui/material/Avatar';
import Link from 'next/link';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { TableEmptyRows } from '../table-empty-rows';
import { UserTableToolbar } from '../user-table-toolbar';
import { TableNoData } from '../table-no-data';
import { emptyRows, getComparator, visuallyHidden } from '../utils';
import { useUserRole } from 'src/hooks/use-user-role';

// ----------------------------------------------------------------------

type LeftMember = {
  id: string;
  name: string;
  grade?: string;
  combination?: string;
  avatarUrl?: string;
  joined_at: string;
  left_at: string;
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

export function LeftMembersView() {
  const table = useTable();
  const { userId } = useUserRole();

  const [filterName, setFilterName] = useState('');
  const [members, setMembers] = useState<LeftMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [clubName, setClubName] = useState<string | null>(null);

  const fetchLeftMembers = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const url = `/api/students/left?user_id=${userId}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch left members');
      }
      const data = await response.json();
      
      const mappedMembers = data.map((member: any) => ({
        id: member.id,
        name: member.name,
        grade: member.grade || '-',
        combination: getCombinationAcronym(member.combination),
        avatarUrl: member.avatarUrl || '',
        joined_at: member.joined_at,
        left_at: member.left_at,
      }));
      
      setMembers(mappedMembers);
    } catch (error) {
      console.error('[LEFT_MEMBERS_VIEW] Error fetching left members:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchCurrentUserClub = useCallback(async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/user/club-by-user?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setClubName(data.club_name || null);
      }
    } catch (error) {
      console.error('[LEFT_MEMBERS_VIEW] Error fetching current user club:', error);
    }
  }, [userId]);

  useEffect(() => {
    if (userId !== null) {
      fetchLeftMembers();
      fetchCurrentUserClub();
    }
  }, [fetchLeftMembers, fetchCurrentUserClub, userId]);

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
          {clubName && (
            <span className="text-mui-primary-main mt-1 block">
              Club: {clubName}
            </span>
          )}
        </Box>
        <Button
          component={Link}
          href="/dashboard/admin/users"
          variant="outlined"
          color="inherit"
        >
          Back to Active Members
        </Button>
      </Box>

      <Card>
        <UserTableToolbar
          numSelected={0}
          filterName={filterName}
          onFilterName={(event: React.ChangeEvent<HTMLInputElement>) => {
            setFilterName(event.target.value);
            table.onResetPage();
          }}
        />

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  {[
                    { id: 'name', label: 'Name' },
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
                    <TableCell colSpan={5} align="center">
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
                        <TableCell align="center" colSpan={5}>
                          <Box sx={{ py: 15, textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                              No Left Members Found
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              There are no members who have left the club yet.
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

