'use client';

import type { ClubProps } from 'src/sections/clubs/club-table-row';

import { useState, useEffect, useCallback } from 'react';

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

import { activateClub } from 'src/actions/activateClub';
import { DashboardContent } from 'src/layouts/dashboard';
import { deactivateClub } from 'src/actions/deactivateClub';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { TableNoData } from 'src/sections/clubs/table-no-data';
import { ClubTableRow } from 'src/sections/clubs/club-table-row';
import { ClubTableHead } from 'src/sections/clubs/club-table-head';
import { TableEmptyRows } from 'src/sections/clubs/table-empty-rows';
import { ClubsTableToolbar } from 'src/sections/clubs/clubs-table-toolbar';
import { AddClubDialog } from 'src/sections/clubs/components/add-club-dialog';
import { EditClubDialog } from 'src/sections/clubs/components/edit-club-dialog';
import { emptyRows, applyFilter, getComparator } from 'src/sections/clubs/utils';
import { InviteOfficersDialog } from 'src/sections/clubs/components/invite-officers-dialog';

import { useTable } from './use-table';

// ----------------------------------------------------------------------

export function SuperAdminClubsView() {
  const table = useTable();
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
  const [loading, setLoading] = useState(true);
  
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

  const fetchClubs = useCallback(async () => {
    try{
      const response = await fetch('/api/clubs/fetch');
      if(!response.ok){
        throw new Error('Failed to fetch clubs');
      }
      const data = await response.json();
      const mappedClubs = data.map((club: any) => ({
        id: club.id,
        name: club.club_name,
        description: club.club_description,
        members: 0,
        status: club.status === 'terminated' ? 'inactive' : club.status,
      }));
      setClubs(mappedClubs);
    }
    catch(error){
      console.error('[SUPER_ADMIN_CLUBS] Error fetching clubs:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch clubs',
        severity: 'error'
      });
    }
    finally{
      setLoading(false);
    }
  }, []);

  const handleAddClub = useCallback(() => {
    setSnackbar({
      open: true,
      message: 'Club added successfully!',
      severity: 'success'
    });
    handleCloseDialog();
    fetchClubs();
  }, [handleCloseDialog, fetchClubs]);

  const handleEdit = useCallback((club: ClubProps) => {
    setSelectedClub(club);
    setOpenEditDialog(true);
  }, []);

  const handleCloseEditDialog = useCallback(() => {
    setOpenEditDialog(false);
    setSelectedClub(null);
  }, []);

  const handleEditClub = useCallback(() => {
    setSnackbar({
      open: true,
      message: 'Club updated successfully!',
      severity: 'success'
    });
    handleCloseEditDialog();
    fetchClubs();
  }, [handleCloseEditDialog, fetchClubs]);

  const handleError = useCallback((error: string) => {
    setSnackbar({
      open: true,
      message: error,
      severity: 'error'
    });
  }, []);

  const handleDeactivate = useCallback(async (clubId: string) => {
    try {
      const result = await deactivateClub(clubId);
      if (result?.error) {
        handleError(result.error);
      } else if (result?.success) {
        setSnackbar({
          open: true,
          message: 'Club deactivated successfully!',
          severity: 'success'
        });
        fetchClubs();
      }
    } catch (error) {
      console.error('[SUPER_ADMIN_CLUBS] Error deactivating club:', error);
      handleError('An error occurred while deactivating the club');
    }
  }, [fetchClubs, handleError]);

  const handleActivate = useCallback(async (clubId: string) => {
    try {
      const result = await activateClub(clubId);
      if (result?.error) {
        handleError(result.error);
      } else if (result?.success) {
        setSnackbar({
          open: true,
          message: 'Club activated successfully!',
          severity: 'success'
        });
        fetchClubs();
      }
    } catch (error) {
      console.error('[SUPER_ADMIN_CLUBS] Error activating club:', error);
      handleError('An error occurred while activating the club');
    }
  }, [fetchClubs, handleError]);

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

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

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
                  { id: 'members', label: 'Members', align: 'center' },
                  { id: 'status', label: 'Status' },
                  { id: '' },
                ]}
              />
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
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

