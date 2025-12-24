'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { useUserRole } from 'src/hooks/use-user-role';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { AddMemberDialog } from 'src/sections/admin/components/add-member-dialog';

import { TableNoData } from '../table-no-data';
import { UserTableRow } from '../user-table-row';
import { UserTableHead } from '../user-table-head';
import { TableEmptyRows } from '../table-empty-rows';
import { UserTableToolbar } from '../user-table-toolbar';
import { emptyRows, applyFilter, getComparator } from '../utils';

import type { UserProps } from '../user-table-row';
import { useTRPC } from '@/trpc/client';

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

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Fetch users based on role
  const { data: usersByClub, isLoading: loadingByClub } = useQuery({
    ...trpc.users.getUsersByClub.queryOptions(),
    enabled: !!userId && !isSuperAdmin,
  });
  
  const { data: allUsers, isLoading: loadingAllUsers } = useQuery({
    ...trpc.users.getAllUsers.queryOptions(),
    enabled: !!userId && isSuperAdmin,
  });

  // Fetch current user's club info
  const { data: currentUserClubData } = useQuery({
    ...trpc.clubs.getCurrentUserClub.queryOptions(),
    enabled: !!userId && !isSuperAdmin,
  });

  // Fetch clubs list (for super admin)
  const { data: clubsList } = useQuery({
    ...trpc.clubs.getClubs.queryOptions(),
    enabled: !!userId && isSuperAdmin,
  });

  // Fetch all students (for Add Members dialog)
  const { data: allStudentsData } = useQuery({
    ...trpc.students.getAllStudents.queryOptions(),
    enabled: !!userId,
  });

  // Remove student mutation
  const removeStudentMutation = useMutation({
    ...trpc.students.removeStudent.mutationOptions(),
    onSuccess: () => {
      setSnackbar({
        open: true,
        message: 'Member removed successfully',
        severity: 'success',
      });
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: trpc.users.getUsersByClub.queryKey() });
      queryClient.invalidateQueries({ queryKey: trpc.users.getAllUsers.queryKey() });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to remove member',
        severity: 'error',
      });
    },
  });

  const users = isSuperAdmin ? allUsers : usersByClub;
  const queryLoading = isSuperAdmin ? loadingAllUsers : loadingByClub;

  // Update students when users data changes
  useEffect(() => {
    if (users) {
      setStudents(users);
    } else {
      setStudents([]);
    }
    setLoading(queryLoading);
  }, [users, queryLoading]);

  // Update current user club when data changes
  useEffect(() => {
    if (currentUserClubData) {
      setCurrentUserClubId(currentUserClubData.club_id);
      setClubName(currentUserClubData.club_name);
    }
  }, [currentUserClubData]);

  // Update clubs list when data changes
  useEffect(() => {
    if (clubsList) {
      const clubList = clubsList
          .filter((club: any) => club.status === 'active')
          .map((club: any) => ({
          id: club.id.toString(),
            club_name: club.club_name,
          }));
        setClubs(clubList);
      }
  }, [clubsList]);

  // Update all students when data changes
  useEffect(() => {
    if (allStudentsData) {
      setAllStudents(allStudentsData as any);
    }
  }, [allStudentsData]);


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
    // Invalidate queries to refetch data
    queryClient.invalidateQueries({ queryKey: trpc.users.getUsersByClub.queryKey() });
    queryClient.invalidateQueries({ queryKey: trpc.users.getAllUsers.queryKey() });
  }, [handleCloseDialog, queryClient, trpc]);

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

  const handleRemove = useCallback((studentId: string) => {
    removeStudentMutation.mutate({
      studentId,
      clubId: currentUserClubId || undefined,
    });
  }, [removeStudentMutation, currentUserClubId]);


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
