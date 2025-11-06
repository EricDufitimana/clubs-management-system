'use client';

import { useState, useCallback, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { AddClubDialog } from '../components/add-club-dialog';
import { EditClubDialog } from '../components/edit-club-dialog';
import { InviteOfficersDialog } from '../components/invite-officers-dialog';
import { ClubTableRow } from '../club-table-row';
import { deactivateClub } from 'src/actions/deactivateClub';
import { activateClub } from 'src/actions/activateClub';
import { ClubTableHead } from '../club-table-head';
import { TableNoData } from '../table-no-data';
import { TableEmptyRows } from '../table-empty-rows';
import { ClubsTableToolbar } from '../clubs-table-toolbar';
import { emptyRows, applyFilter, getComparator } from '../utils';
import { useTable } from './use-table';

import type { ClubProps } from '../club-table-row';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import CircularProgress from '@mui/material/CircularProgress';

// ----------------------------------------------------------------------

// Mock data - replace with actual data fetching later
const _clubs: ClubProps[] = [];

export function ClubsView() {
  const table = useTable();
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [selectedClub, setSelectedClub] = useState<ClubProps | null>(null);
  const [selectedClubForInvite, setSelectedClubForInvite] = useState<{id: string; name: string} | null>(null);
  const [filterName, setFilterName] = useState('');
  const [clubs, setClubs] = useState<ClubProps[]>(_clubs);
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
    console.log('[FETCH_CLUBS] Client: Starting fetch request...');
    try{
      const response = await fetch('/api/clubs/fetch');
      if(!response.ok){
        throw new Error('Failed to fetch clubs');
      }
      const data = await response.json();
      console.log('[FETCH_CLUBS] Client: Received', data.length, 'clubs');
      // Map database fields to component props
      const mappedClubs = data.map((club: any) => ({
        id: club.id,
        name: club.club_name,
        description: club.club_description,
        members: 0, // TODO: Add members count when available
        status: club.status === 'terminated' ? 'inactive' : club.status,
      }));
      setClubs(mappedClubs);
    }
    catch(error){
      console.error('[FETCH_CLUBS] Client: Error fetching clubs:', error);
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
      console.error('[CLUBS_VIEW] Error deactivating club:', error);
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
      console.error('[CLUBS_VIEW] Error activating club:', error);
      handleError('An error occurred while activating the club');
    }
  }, [fetchClubs, handleError]);

  const handleInvite = useCallback((clubId: string) => {
    // Find club name
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
          Clubs
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

