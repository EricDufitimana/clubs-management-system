'use client';

import type { ClubProps } from '@/sections/clubs/club-table-row';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

import { DashboardContent } from '@/layouts/dashboard';

import { Iconify } from '@/components/iconify';
import { Scrollbar } from '@/components/scrollbar';
import { useTRPC } from '@/trpc/client';

import { TableNoData } from '@/sections/clubs/table-no-data';
import { ClubTableRow } from '@/sections/clubs/club-table-row';
import { ClubTableHead } from '@/sections/clubs/club-table-head';
import { TableEmptyRows } from '@/sections/clubs/table-empty-rows';
import { ClubsTableToolbar } from '@/sections/clubs/clubs-table-toolbar';
import { AddClubDialog } from '@/sections/clubs/components/add-club-dialog';
import { EditClubDialog } from '@/sections/clubs/components/edit-club-dialog';
import { emptyRows, applyFilter, getComparator } from '@/sections/clubs/utils';
import { InviteOfficersDialog } from '@/sections/clubs/components/invite-officers-dialog';

import { useTable } from './use-table';

// ----------------------------------------------------------------------

export function SuperAdminClubsView() {
  const table = useTable();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [selectedClub, setSelectedClub] = useState<ClubProps | null>(null);
  const [selectedClubForInvite, setSelectedClubForInvite] = useState<{id: string; name: string} | null>(null);
  const [filterName, setFilterName] = useState('');
  const [clubs, setClubs] = useState<ClubProps[]>([]);
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Fetch clubs using tRPC
  const { data: clubsData, isLoading: loading } = useQuery({
    ...trpc.clubs.getAllClubs.queryOptions(),
  });

  // Create club mutation
  const createClubMutation = useMutation({
    ...trpc.clubs.createClub.mutationOptions(),
    onSuccess: () => {
      setSnackbar({
        open: true,
        message: 'Club added successfully!',
        severity: 'success'
      });
      queryClient.invalidateQueries({ queryKey: trpc.clubs.getAllClubs.queryKey() });
      handleCloseDialog();
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to add club',
        severity: 'error'
      });
    },
  });

  // Update club mutation
  const updateClubMutation = useMutation({
    ...trpc.clubs.updateClub.mutationOptions(),
    onSuccess: () => {
      setSnackbar({
        open: true,
        message: 'Club updated successfully!',
        severity: 'success'
      });
      queryClient.invalidateQueries({ queryKey: trpc.clubs.getAllClubs.queryKey() });
      handleCloseEditDialog();
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update club',
        severity: 'error'
      });
    },
  });

  // Deactivate club mutation
  const deactivateClubMutation = useMutation({
    ...trpc.clubs.deactivateClub.mutationOptions(),
    onSuccess: () => {
      setSnackbar({
        open: true,
        message: 'Club deactivated successfully!',
        severity: 'success'
      });
      queryClient.invalidateQueries({ queryKey: trpc.clubs.getAllClubs.queryKey() });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to deactivate club',
        severity: 'error'
      });
    },
  });

  // Reactivate club mutation
  const reactivateClubMutation = useMutation({
    ...trpc.clubs.reactivateClub.mutationOptions(),
    onSuccess: () => {
      setSnackbar({
        open: true,
        message: 'Club reactivated successfully!',
        severity: 'success'
      });
      queryClient.invalidateQueries({ queryKey: trpc.clubs.getAllClubs.queryKey() });
    },
    onError: (error: any) => {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to reactivate club',
        severity: 'error'
      });
    },
  });

  // Update local state when data changes
  useEffect(() => {
    if (clubsData) {
      const mappedClubs = clubsData.map((club: any) => ({
        id: club.id,
        name: club.club_name,
        description: club.club_description,
        category: club.category || null,
        members: 0,
        status: club.status === 'terminated' ? 'inactive' : club.status,
      }));
      setClubs(mappedClubs);
    }
  }, [clubsData]);
  
  const dataFiltered: ClubProps[] = applyFilter({
    inputData: clubs,
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

  const handleAddClub = useCallback(() => {
    // This will be handled by the dialog component calling createClubMutation
    handleCloseDialog();
  }, [handleCloseDialog]);

  const handleEdit = useCallback((club: ClubProps) => {
    setSelectedClub(club);
    setOpenEditDialog(true);
  }, []);

  const handleCloseEditDialog = useCallback(() => {
    setOpenEditDialog(false);
    setSelectedClub(null);
  }, []);

  const handleEditClub = useCallback(() => {
    // This will be handled by the dialog component calling updateClubMutation
    handleCloseEditDialog();
  }, [handleCloseEditDialog]);

  const handleError = useCallback((error: string) => {
    setSnackbar({
      open: true,
      message: error,
      severity: 'error'
    });
  }, []);

  const [loadingClubId, setLoadingClubId] = useState<string | null>(null);

  const handleDeactivate = useCallback((clubId: string) => {
    setLoadingClubId(clubId);
    deactivateClubMutation.mutate(
      { clubId },
      {
        onSettled: () => {
          setLoadingClubId(null);
        },
      }
    );
  }, [deactivateClubMutation]);

  const handleActivate = useCallback((clubId: string) => {
    setLoadingClubId(clubId);
    reactivateClubMutation.mutate(
      { clubId },
      {
        onSettled: () => {
          setLoadingClubId(null);
        },
      }
    );
  }, [reactivateClubMutation]);

  const handleInvite = useCallback((clubId: string) => {
    const club = clubs.find(c => c.id === clubId);
    if (club) {
      setSelectedClubForInvite({ id: clubId, name: club.name });
      setOpenInviteDialog(true);
    }
  }, [clubs]);

  const handleCloseInviteDialog = useCallback(() => {
    setOpenInviteDialog(false);
    setSelectedClubForInvite(null);
  }, []);

  const handleInviteSuccess = useCallback(() => {
    setSnackbar({
      open: true,
      message: 'Invitations sent successfully!',
      severity: 'success'
    });
  }, []);
  
  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
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
          Club Management
        </Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleOpenDialog}
        >
          Add New Club
        </Button>
      </Box>

      <Card>
        <ClubsTableToolbar
          numSelected={table.selected.length}
          filterName={filterName}
          onFilterName={(event: React.ChangeEvent<HTMLInputElement>) => {
            setFilterName(event.target.value);
            table.onResetPage();
          }}
        />

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <ClubTableHead
                order={table.order}
                orderBy={table.orderBy}
                rowCount={clubs.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
                onSelectAllRows={(checked) =>
                  table.onSelectAllRows(
                    checked,
                    clubs.map((club) => club.id)
                  )
                }
                headLabel={[
                  { id: 'name', label: 'Club Name' },
                  { id: 'description', label: 'Description' },
                  { id: 'category', label: 'Category' },
                  { id: 'members', label: 'Members', align: 'center' },
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
                  .map((row) => (
                    <ClubTableRow
                      key={row.id}
                      row={row}
                      selected={table.selected.includes(row.id)}
                      onSelectRow={() => table.onSelectRow(row.id)}
                      onEdit={handleEdit}
                      onDeactivate={handleDeactivate}
                      onActivate={handleActivate}
                      onInvite={handleInvite}
                      isLoading={loadingClubId === row.id}
                    />
                  ))}

                <TableEmptyRows
                  height={77}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, clubs.length)}
                />

                {notFound && <TableNoData searchQuery={filterName} />}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <TablePagination
          page={table.page}
          component="div"
          count={clubs.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          rowsPerPageOptions={[5, 10, 25]}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>

      <AddClubDialog open={openDialog} onClose={handleCloseDialog} onAdd={handleAddClub} onError={handleError} />
      <EditClubDialog 
        open={openEditDialog} 
        club={selectedClub}
        onClose={handleCloseEditDialog} 
        onEdit={handleEditClub} 
        onError={handleError} 
      />
      <InviteOfficersDialog
        open={openInviteDialog}
        clubId={selectedClubForInvite?.id || ''}
        clubName={selectedClubForInvite?.name}
        onClose={handleCloseInviteDialog}
        onSuccess={handleInviteSuccess}
        onError={handleError}
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

