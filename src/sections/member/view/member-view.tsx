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

import { useUserRole } from '@/hooks/use-user-role';

import { DashboardContent } from '@/layouts/dashboard';

import { Iconify } from '@/components/iconify';
import { Scrollbar } from '@/components/scrollbar';

import { AddMemberDialog } from '@/sections/admin/components/add-member-dialog';

import { TableNoData } from '../table-no-data';
import { MemberTableRow } from '../member-table-row';
import { MemberTableHead } from '../member-table-head';
import { TableEmptyRows } from '../table-empty-rows';
import { MemberTableToolbar } from '../member-table-toolbar';
import { emptyRows, applyFilter, getComparator } from '../utils';

import type { UserProps } from '../member-table-row';
import { useTRPC } from '@/trpc/client';


export function MemberView() {
  const table = useTable();
  const { userId, role, isSuperAdmin } = useUserRole();
  console.log("The Is Super Admin From the Member View: ", isSuperAdmin);

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
        message: 'Member marked as left successfully',
        severity: 'success',
      });
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: trpc.users.getUsersByClub.queryKey() });
      queryClient.invalidateQueries({ queryKey: trpc.users.getAllUsers.queryKey() });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to mark member as left',
        severity: 'error',
      });
    },
  });

  // Delete member mutation
  const deleteMemberMutation = useMutation({
    ...trpc.students.deleteMember.mutationOptions(),
    onSuccess: () => {
      setSnackbar({
        open: true,
        message: 'Member deleted successfully',
        severity: 'success',
      });
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: trpc.users.getUsersByClub.queryKey() });
      queryClient.invalidateQueries({ queryKey: trpc.users.getAllUsers.queryKey() });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to delete member',
        severity: 'error',
      });
    },
  });

  // Delete multiple members mutation
  const deleteMultipleMembersMutation = useMutation({
    ...trpc.students.deleteMultipleMembers.mutationOptions(),
    onSuccess: (data) => {
      setSnackbar({
        open: true,
        message: data.message || 'Members deleted successfully',
        severity: 'success',
      });
      // Clear selection
      table.setSelected([]);
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: trpc.users.getUsersByClub.queryKey() });
      queryClient.invalidateQueries({ queryKey: trpc.users.getAllUsers.queryKey() });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to delete members',
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

  const handleDelete = useCallback((studentId: string) => {
    deleteMemberMutation.mutate({
      studentId,
      clubId: currentUserClubId || undefined,
    });
  }, [deleteMemberMutation, currentUserClubId]);

  const handleDeleteSelected = useCallback(() => {
    if (table.selected.length === 0) return;
    
    // Show confirmation dialog
    if (window.confirm(`Are you sure you want to delete ${table.selected.length} member(s)? This action cannot be undone.`)) {
      deleteMultipleMembersMutation.mutate({
        studentIds: table.selected,
        clubId: currentUserClubId || undefined,
      });
    }
  }, [table.selected, deleteMultipleMembersMutation, currentUserClubId]);


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
            Members
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
              href="/dashboard/admin/members/left"
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
        <MemberTableToolbar
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
          onDeleteSelected={!isSuperAdmin ? handleDeleteSelected : undefined}
        />

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <MemberTableHead
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
                  ...(isSuperAdmin && selectedClubFilter === 'all' ? [
                    { id: 'subject_oriented_club', label: 'Subject Oriented Club' },
                    { id: 'soft_oriented_club', label: 'Soft Oriented Club' }
                  ] : isSuperAdmin ? [{ id: 'club_name', label: 'Club' }] : []),
                  { id: 'status', label: 'Status' },
                  { id: '' },
                ]}
              />
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={isSuperAdmin && selectedClubFilter === 'all' ? 7 : isSuperAdmin ? 6 : 6} align="center">
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
                        <MemberTableRow
                          key={row.id}
                          row={row}
                          selected={table.selected.includes(row.id)}
                          onSelectRow={() => table.onSelectRow(row.id)}
                          onRemove={() => handleRemove(row.id)}
                          onDelete={() => handleDelete(row.id)}
                          isSuperAdmin={isSuperAdmin}
                          showAllClubs={isSuperAdmin && selectedClubFilter === 'all'}
                          clubs={clubs}
                        />
                      ))}

                    <TableEmptyRows
                      height={68}
                      emptyRows={emptyRows(table.page, table.rowsPerPage, students.length)}
                    />

                    {noStudents && (
                      <TableRow>
                        <TableCell align="center" colSpan={isSuperAdmin && selectedClubFilter === 'all' ? 7 : isSuperAdmin ? 6 : 6}>
                          <Box sx={{ py: 15, textAlign: 'center' }}>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                              No Members Found
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {isSuperAdmin 
                                ? 'There are no members in the system yet. Club leaders can add members to their clubs.' 
                                : 'There are no members in your club yet. Use the "Add Members" button to get started.'}
                            </Typography>
                            {!isSuperAdmin && currentUserClubId && (
                              <Button
                                variant="contained"
                                startIcon={<Iconify icon="mingcute:add-line" />}
                                onClick={handleOpenDialog}
                                sx={{ mt: 2 }}
                              >
                                Add Your First Member
                              </Button>
                            )}
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
    setSelected,
  };
}

