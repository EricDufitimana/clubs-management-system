'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Snackbar from '@mui/material/Snackbar';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

import { DashboardContent } from '@/layouts/dashboard';
import { useTRPC } from '@/trpc/client';
import { useClubContext } from '@/contexts/club-context';

import { Label } from '@/components/label';
import { Iconify } from '@/components/iconify';
import { Scrollbar } from '@/components/scrollbar';

import { TableNoData } from '@/sections/member/table-no-data';
import { MemberTableHead } from '@/sections/member/member-table-head';
import { TableEmptyRows } from '@/sections/member/table-empty-rows';
import { MemberTableToolbar } from '@/sections/member/member-table-toolbar';
import { emptyRows, applyFilter, getComparator } from '@/sections/member/utils';

import { useTable } from './use-table';
import { AddMemberDialog } from '../components/add-member-dialog';
import { BulkImportDialog } from '../components/bulk-import-dialog';

// ----------------------------------------------------------------------

type MemberData = {
  id: string;
  name: string;
  role?: string;
  status: 'active' | 'left';
  company?: string;
  avatarUrl?: string;
  club_name: string | null;
};

export function AdminUsersView() {
  const trpc = useTRPC();
  const table = useTable();
  const [openDialog, setOpenDialog] = useState(false);
  const [openBulkImportDialog, setOpenBulkImportDialog] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Use club context for selected club
  const { selectedClub } = useClubContext();
  const currentUserClub = selectedClub?.club_name || null;
  const currentUserClubId = selectedClub?.id || null;

  console.log('[ADMIN_MEMBERS] selectedClub:', selectedClub);
  console.log('[ADMIN_MEMBERS] currentUserClub:', currentUserClub);
  console.log('[ADMIN_MEMBERS] currentUserClubId:', currentUserClubId);

  // Fetch members using tRPC (filtered by selected club)
  const { data: membersData, isLoading: loading, refetch } = useQuery({
    ...trpc.users.getUsersByClub.queryOptions({ clubId: currentUserClubId || undefined }),
    enabled: !!currentUserClubId,
  });

  // Mark members as left mutation
  const markAsLeftMutation = useMutation({
    ...trpc.users.markMembersAsLeft.mutationOptions(),
    onSuccess: () => {
      setSnackbar({
        open: true,
        message: 'Members marked as left successfully!',
        severity: 'success'
      });
      table.onSelectAllRows(false, []);
      refetch();
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to mark members as left',
        severity: 'error'
      });
    },
  });

  // Filter out left members and filter by selected club
  const activeMembers = useMemo(() => {
    if (!membersData || !currentUserClubId) return [];
    return membersData
      .filter(member => member.status === 'active')
      .filter(member => member.club_name === currentUserClub) // Filter by selected club
      .map(member => ({
        id: member.id,
        name: member.name,
        role: member.role || '-',
        status: member.status,
        company: member.company || '-',
        avatarUrl: member.avatarUrl || '',
        isVerified: true,
      }));
  }, [membersData, currentUserClubId, currentUserClub]);

  const dataFiltered = applyFilter({
    inputData: activeMembers,
    comparator: getComparator(table.order, table.orderBy),
    filterName,
  });

  const notFound = !dataFiltered.length && !!filterName;

  const handleMarkAsLeft = useCallback(() => {
    if (table.selected.length === 0) return;
    markAsLeftMutation.mutate({ memberIds: table.selected });
  }, [table.selected, markAsLeftMutation]);

  const handleMarkSingleMemberAsLeft = useCallback((memberId: string) => {
    markAsLeftMutation.mutate({ memberIds: [memberId] });
  }, [markAsLeftMutation]);

  const handleOpenDialog = useCallback(() => {
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
  }, []);

  const handleAddUser = useCallback(() => {
    setSnackbar({
      open: true,
      message: 'Member added successfully!',
      severity: 'success'
    });
    handleCloseDialog();
    refetch();
  }, [handleCloseDialog, refetch]);

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

  const handleOpenBulkImportDialog = useCallback(() => {
    setOpenBulkImportDialog(true);
  }, []);

  const handleCloseBulkImportDialog = useCallback(() => {
    setOpenBulkImportDialog(false);
  }, []);

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
          Member Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {table.selected.length > 0 && (
            <Tooltip title="Mark selected members as left">
              <Button
                variant="contained"
                color="warning"
                startIcon={<Iconify icon="solar:logout-2-bold-duotone" />}
                onClick={handleMarkAsLeft}
                disabled={markAsLeftMutation.isPending}
              >
                Mark as Left ({table.selected.length})
              </Button>
            </Tooltip>
          )}
          <Button
            variant="contained"
            color="inherit"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={handleOpenDialog}
            disabled={!currentUserClubId}
          >
            Add Members
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Iconify icon="solar:file-import-bold-duotone" />}
            onClick={handleOpenBulkImportDialog}
            disabled={!currentUserClubId}
          >
            Bulk Import
          </Button>
        </Box>
      </Box>

      <Card>
        <MemberTableToolbar
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
              <MemberTableHead
                order={table.order}
                orderBy={table.orderBy}
                rowCount={activeMembers.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
                onSelectAllRows={(checked) =>
                  table.onSelectAllRows(
                    checked,
                    activeMembers.map((member) => member.id)
                  )
                }
                headLabel={[
                  { id: 'name', label: 'Name' },
                  { id: 'company', label: 'Combination' },
                  { id: 'role', label: 'Grade' },
                  { id: 'status', label: 'Status' },
                  { id: 'actions', label: 'Actions', sortable: false },
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
                  .map((row) => (
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
                      <TableCell>{row.company}</TableCell>
                      <TableCell>{row.role}</TableCell>
                      <TableCell>
                        <Label color="success">Active</Label>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Mark member as left">
                          <IconButton
                            size="small"
                            onClick={() => handleMarkSingleMemberAsLeft(row.id)}
                            disabled={markAsLeftMutation.isPending}
                            sx={{ color: 'warning.main' }}
                          >
                            <Iconify icon="solar:logout-2-bold-duotone" width={20} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}

                <TableEmptyRows
                  height={77}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, activeMembers.length)}
                />

                {notFound && <TableNoData searchQuery={filterName} />}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <TablePagination
          page={table.page}
          component="div"
          count={activeMembers.length}
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
      
      <BulkImportDialog
        open={openBulkImportDialog}
        onClose={handleCloseBulkImportDialog}
        onSuccess={handleAddUser}
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

