'use client';

import { useState, useCallback, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Link from 'next/link';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { TableNoData } from '../table-no-data';
import { UserTableRow } from '../user-table-row';
import { UserTableHead } from '../user-table-head';
import { TableEmptyRows } from '../table-empty-rows';
import { UserTableToolbar } from '../user-table-toolbar';
import { emptyRows, applyFilter, getComparator } from '../utils';
import { useUserRole } from 'src/hooks/use-user-role';
import { AddMemberDialog } from 'src/sections/admin/components/add-member-dialog';
import { removeStudent } from 'src/actions/removeStudent';

import type { UserProps } from '../user-table-row';

// ----------------------------------------------------------------------

/**
 * Extracts acronym from combination string
 * Handles both formats:
 * - With dashes: "Mathematics-Physics-Computer Science" → "MPC"
 * - Prisma enum (camelCase): "MathematicsPhysicsComputerScience" → "MPC"
 */
function getCombinationAcronym(combination: string | null | undefined): string {
  if (!combination || combination === '-') return '-';
  
  // If it has dashes, split by dash (database format)
  if (combination.includes('-')) {
    return combination
      .split('-')
      .map(part => part.trim().charAt(0).toUpperCase())
      .join('');
  }
  
  // Otherwise, it's a Prisma enum (camelCase format)
  // Split by capital letters using regex
  const words = combination.split(/(?=[A-Z])/);
  
  // Group multi-word subjects (e.g., "Computer" + "Science" → "ComputerScience")
  const groupedWords: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const currentWord = words[i];
    const nextWord = words[i + 1];
    
    // Check if "Computer" is followed by "Science" - treat as one subject
    if (currentWord === 'Computer' && nextWord === 'Science') {
      groupedWords.push('ComputerScience');
      i++; // Skip the next word since we've merged it
    } else {
      groupedWords.push(currentWord);
    }
  }
  
  // Get first letter of each grouped word
  return groupedWords
    .map(word => word.charAt(0).toUpperCase())
    .join('');
}

// ----------------------------------------------------------------------

export function UserView() {
  const table = useTable();
  const { userId, role, isSuperAdmin } = useUserRole();

  const [filterName, setFilterName] = useState('');
  const [students, setStudents] = useState<UserProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentUserClubId, setCurrentUserClubId] = useState<string | null>(null);
  const [clubName, setClubName] = useState<string | null>(null);
  const [selectedClubFilter, setSelectedClubFilter] = useState<string>('all');
  const [clubs, setClubs] = useState<Array<{ id: string; club_name: string }>>([]);
  const [allStudents, setAllStudents] = useState<Array<{
    id: string;
    first_name: string;
    last_name: string;
    grade?: string;
    combination?: string;
    gender?: 'male' | 'female';
  }>>([]);
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchStudents = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // For super_admin, fetch all students from club-members table (all clubs)
      // For admin, fetch students from their specific club(s)
      const url = isSuperAdmin 
        ? '/api/students/fetch'  // No user_id = all students from all clubs
        : `/api/students/fetch?user_id=${userId}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      
      // Map student data to UserProps format
      const mappedStudents: UserProps[] = data.map((student: any) => ({
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        role: student.grade || '-',
        status: student.membership_status || 'active',
        company: student.combination || null, // Store full combination for badge display
        avatarUrl: student.avatarUrl || '',
        isVerified: true,
        club_name: student.club_name || null, // Include club_name for super_admin filtering
      }));
      
      setStudents(mappedStudents);
    } catch (error) {
      console.error('[USER_VIEW] Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, isSuperAdmin]);

  const fetchCurrentUserClub = useCallback(async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/user/club-by-user?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentUserClubId(data.club_id || null);
        setClubName(data.club_name || null);
      }
    } catch (error) {
      console.error('[USER_VIEW] Error fetching current user club:', error);
    }
  }, [userId]);

  const fetchClubs = useCallback(async () => {
    if (!isSuperAdmin) return;
    
    try {
      const response = await fetch('/api/clubs/fetch');
      if (response.ok) {
        const data = await response.json();
        const clubList = data
          .filter((club: any) => club.status === 'active')
          .map((club: any) => ({
            id: club.id,
            club_name: club.club_name,
          }));
        setClubs(clubList);
      }
    } catch (error) {
      console.error('[USER_VIEW] Error fetching clubs:', error);
    }
  }, [isSuperAdmin]);

  const fetchAllStudents = useCallback(async () => {
    // Preload all students in the background for the Add Members dialog
    try {
      const response = await fetch('/api/students/fetch');
      if (response.ok) {
        const data = await response.json();
        const studentList = data.map((student: any) => ({
          id: student.id,
          first_name: student.first_name,
          last_name: student.last_name,
          grade: student.grade,
          combination: student.combination,
          gender: student.gender,
        }));
        setAllStudents(studentList);
      }
    } catch (error) {
      console.error('[USER_VIEW] Error preloading all students:', error);
    }
  }, []);

  const handleOpenDialog = useCallback(() => {
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
  }, []);

  const handleAddMembers = useCallback(() => {
    setSnackbar({
      open: true,
      message: 'Members added successfully!',
      severity: 'success'
    });
    handleCloseDialog();
    fetchStudents();
  }, [handleCloseDialog, fetchStudents]);

  const handleError = useCallback((error: string) => {
    setSnackbar({
      open: true,
      message: error,
      severity: 'error'
    });
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  const handleRemove = useCallback(async (studentId: string) => {
    try {
      const result = await removeStudent(studentId);

      if ('error' in result) {
        throw new Error(result.error);
      }

      setSnackbar({
        open: true,
        message: result.message || 'Member removed successfully',
        severity: 'success'
      });
      
      // Refresh the student list
      fetchStudents();
    } catch (error: any) {
      console.error('[USER_VIEW] Error removing member:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to remove member',
        severity: 'error'
      });
    }
  }, [fetchStudents]);

  useEffect(() => {
    if (userId !== null) {
      fetchStudents();
      fetchCurrentUserClub();
      // Preload all students in the background
      fetchAllStudents();
      // Fetch clubs if super_admin
      if (isSuperAdmin) {
        fetchClubs();
      }
    }
  }, [fetchStudents, fetchCurrentUserClub, fetchAllStudents, fetchClubs, userId, isSuperAdmin]);

  // Filter by club if super_admin and club filter is selected
  const filteredByClub = isSuperAdmin && selectedClubFilter !== 'all'
    ? students.filter(user => {
        // Handle null club_name - filter it out unless "No Club" is selected
        if (!user.club_name) {
          return selectedClubFilter === 'No Club';
        }
        return user.club_name === selectedClubFilter;
      })
    : students;

  const dataFiltered: UserProps[] = applyFilter({
    inputData: filteredByClub,
    comparator: getComparator(table.order, table.orderBy),
    filterName,
  });

  const notFound = !dataFiltered.length && !!filterName;
  const noStudents = !loading && students.length === 0 && !filterName;

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
            Users
          </Typography>
          {clubName && (
            <span className="text-mui-primary-main mt-1 block">
              Club: {clubName}
            </span>
          )}
        </Box>
        {!isSuperAdmin && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              component={Link}
              href="/dashboard/admin/users/left"
              variant="outlined"
              color="inherit"
            >
              View Left Members
            </Button>
            <Button
              variant="contained"
              color="inherit"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleOpenDialog}
              disabled={!currentUserClubId}
            >
              Add Members
            </Button>
          </Box>
        )}
      </Box>

      <Card>
        <UserTableToolbar
          numSelected={table.selected.length}
          filterName={filterName}
          onFilterName={(event: React.ChangeEvent<HTMLInputElement>) => {
            setFilterName(event.target.value);
            table.onResetPage();
          }}
          isSuperAdmin={isSuperAdmin}
          clubs={clubs}
          selectedClub={selectedClubFilter}
          onClubChange={(club: string) => {
            setSelectedClubFilter(club);
            table.onResetPage();
          }}
        />

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <UserTableHead
                order={table.order}
                orderBy={table.orderBy}
                rowCount={students.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
                onSelectAllRows={(checked) =>
                  table.onSelectAllRows(
                    checked,
                    students.map((student) => student.id)
                  )
                }
                headLabel={[
                  { id: 'name', label: 'Name' },
                  { id: 'company', label: 'Combination' },
                  { id: 'role', label: 'Grade' },
                  ...(isSuperAdmin ? [{ id: 'club_name', label: 'Club' }] : []),
                  { id: 'status', label: 'Status' },
                  { id: '' },
                ]}
              />
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={isSuperAdmin ? 6 : 6} align="center">
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
                        <UserTableRow
                          key={row.id}
                          row={row}
                          selected={table.selected.includes(row.id)}
                          onSelectRow={() => table.onSelectRow(row.id)}
                          onRemove={isSuperAdmin ? undefined : () => handleRemove(row.id)}
                          isSuperAdmin={isSuperAdmin}
                        />
                      ))}

                    <TableEmptyRows
                      height={68}
                      emptyRows={emptyRows(table.page, table.rowsPerPage, students.length)}
                    />

                    {noStudents && (
                      <TableRow>
                        <TableCell align="center" colSpan={isSuperAdmin ? 6 : 6}>
                          <Box sx={{ py: 15, textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                              {isSuperAdmin ? 'No Users Found' : 'No Students Found'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {isSuperAdmin 
                                ? 'There are no users in the system yet.' 
                                : 'There are no students in the system yet.'}
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
          count={students.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          rowsPerPageOptions={[5, 10, 25]}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>

      <AddMemberDialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        onAdd={handleAddMembers} 
        onError={handleError}
        clubId={currentUserClubId || undefined}
        preloadedStudents={allStudents}
      />

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
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

export function useTable() {
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState('name');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selected, setSelected] = useState<string[]>([]);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

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
