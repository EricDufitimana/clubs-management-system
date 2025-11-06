'use client';

import { useState, useCallback, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Snackbar from '@mui/material/Snackbar';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Label } from 'src/components/label';

import { AddMemberDialog } from '../components/add-member-dialog';
import { UserTableHead } from 'src/sections/user/user-table-head';
import { TableNoData } from 'src/sections/user/table-no-data';
import { TableEmptyRows } from 'src/sections/user/table-empty-rows';
import { UserTableToolbar } from 'src/sections/user/user-table-toolbar';
import { emptyRows, applyFilter, getComparator } from 'src/sections/user/utils';
import { useTable } from './use-table';

// ----------------------------------------------------------------------

type UserData = {
  id: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'super_admin';
  created_at: string;
  club_name: string | null;
  avatarUrl?: string;
};

export function AdminUsersView() {
  const table = useTable();
  const [openDialog, setOpenDialog] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [users, setUsers] = useState<UserData[]>([]);
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });
  const [loading, setLoading] = useState(true);
  const [currentUserClub, setCurrentUserClub] = useState<string | null>(null);
  const [currentUserClubId, setCurrentUserClubId] = useState<string | null>(null);

  // Map user data to format expected by filter/comparator
  const mappedUsers = users.map(user => {
    const mapped = {
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      role: user.role,
      status: 'active',
      company: '-',
      avatarUrl: user.avatarUrl || '',
      isVerified: true,
    };
    console.log('[ADMIN_USERS] Mapped user:', mapped.name, 'Avatar URL:', mapped.avatarUrl);
    return mapped;
  });

  const dataFiltered = applyFilter({
    inputData: mappedUsers,
    comparator: getComparator(table.order, table.orderBy),
    filterName,
  });

  const notFound = !dataFiltered.length && !!filterName;

  const handleOpenDialog = useCallback(() => {
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users/fetch');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      console.log('[ADMIN_USERS] Fetched users data:', data);
      console.log('[ADMIN_USERS] Users with avatarUrl:', data.map((u: any) => ({
        name: `${u.first_name} ${u.last_name}`,
        id: u.id,
        avatarUrl: u.avatarUrl
      })));
      setUsers(data);
    } catch (error) {
      console.error('[ADMIN_USERS] Error fetching users:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch users',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAddUser = useCallback(() => {
    setSnackbar({
      open: true,
      message: 'User added successfully!',
      severity: 'success'
    });
    handleCloseDialog();
    fetchUsers();
  }, [handleCloseDialog, fetchUsers]);

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

  const fetchCurrentUserClub = useCallback(async () => {
    try {
      const response = await fetch('/api/user/club');
      if (response.ok) {
        const data = await response.json();
        setCurrentUserClub(data.club_name || null);
        setCurrentUserClubId(data.club_id || null);
      }
    } catch (error) {
      console.error('[ADMIN_USERS] Error fetching current user club:', error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchCurrentUserClub();
  }, [fetchUsers, fetchCurrentUserClub]);

  return (
    <DashboardContent>
      <Box
        sx={{
          mb: 5,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" sx={{ flexGrow: 1 }}>
          User Management
        </Typography>
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

      <Card>
        <UserTableToolbar
          numSelected={table.selected.length}
          filterName={filterName}
          onFilterName={(event: React.ChangeEvent<HTMLInputElement>) => {
            setFilterName(event.target.value);
            table.onResetPage();
          }}
          currentUserClub={currentUserClub}
        />

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <UserTableHead
                order={table.order}
                orderBy={table.orderBy}
                rowCount={users.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
                onSelectAllRows={(checked) =>
                  table.onSelectAllRows(
                    checked,
                    users.map((user) => user.id)
                  )
                }
                headLabel={[
                  { id: 'name', label: 'Name' },
                  { id: 'role', label: 'Role' },
                  { id: 'created_at', label: 'Created At' },
                  { id: 'status', label: 'Status' },
                  { id: '' },
                ]}
              />
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : dataFiltered
                  .slice(table.page * table.rowsPerPage, table.page * table.rowsPerPage + table.rowsPerPage)
                  .map((row) => {
                    const user = users.find(u => u.id === row.id);
                    return (
                      <TableRow key={row.id} hover tabIndex={-1} role="checkbox" selected={table.selected.includes(row.id)}>
                        <TableCell padding="checkbox">
                          <Checkbox disableRipple checked={table.selected.includes(row.id)} onChange={() => table.onSelectRow(row.id)} />
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
                          <Label color={user?.role === 'super_admin' ? 'warning' : 'info'}>
                            {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                          </Label>
                        </TableCell>
                        <TableCell>
                          {user ? new Date(user.created_at).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <Label color="success">Active</Label>
                        </TableCell>
                        <TableCell align="right">
                          {/* Actions can be added here */}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                <TableEmptyRows
                  height={77}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, users.length)}
                />

                {notFound && <TableNoData searchQuery={filterName} />}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <TablePagination
          page={table.page}
          component="div"
          count={users.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          rowsPerPageOptions={[5, 10, 25]}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>

      <AddMemberDialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        onAdd={handleAddUser} 
        onError={handleError}
        clubId={currentUserClubId || undefined}
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

