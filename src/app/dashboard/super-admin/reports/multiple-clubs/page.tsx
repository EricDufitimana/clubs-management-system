'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

import { DashboardContent } from '@/layouts/dashboard';
import { Iconify } from '@/components/iconify';
import { Scrollbar } from '@/components/scrollbar';
import { useTRPC } from '@/trpc/client';

// ----------------------------------------------------------------------

type StudentInMultipleClubs = {
  studentId: string;
  studentName: string;
  grade: string;
  combination: string;
  gender: string;
  clubCount: number;
  clubs: Array<{
    clubId: string;
    clubName: string;
    clubCategory: string | null;
    membershipStatus: string;
    joinedAt: string;
  }>;
};

// ... (keeping existing imports)
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';
import Stack from '@mui/material/Stack';

// ... (existing helper functions)

export function MultipleClubsReportView() {
  const trpc = useTRPC();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [filterName, setFilterName] = useState('');
  
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });

  const { data: studentsData, isLoading, error } = useQuery({
    ...trpc.clubs.getStudentsInMultipleClubs.queryOptions(),
  });

  // Client-side filtering and pagination
  const filteredData = (studentsData || []).filter((student) => 
    student.studentName.toLowerCase().includes(filterName.toLowerCase()) ||
    student.studentId.toLowerCase().includes(filterName.toLowerCase())
  );

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExportToExcel = useCallback(() => {
    if (!studentsData) return;

    try {
      // Create CSV content
      const headers = [
        'Student ID',
        'Student Name',
        'Grade',
        'Combination',
        'Gender',
        'Number of Clubs',
        'Club Names',
        'Club Categories',
        'Membership Statuses',
        'Join Dates'
      ];

      const csvContent = [
        headers.join(','),
        ...studentsData.map(student => {
          const clubNames = student.clubs.map(c => `"${c.clubName}"`).join('; ');
          const clubCategories = student.clubs.map(c => `"${c.clubCategory || 'null'}"`).join('; ');
          const membershipStatuses = student.clubs.map(c => `"${c.membershipStatus}"`).join('; ');
          const joinDates = student.clubs.map(c => `"${new Date(c.joinedAt).toLocaleDateString()}"`).join('; ');

          return [
            `"${student.studentId}"`,
            `"${student.studentName}"`,
            `"${student.grade || 'null'}"`,
            `"${student.combination || 'null'}"`,
            `"${student.gender}"`,
            `"${student.clubCount}"`,
            clubNames,
            clubCategories,
            membershipStatuses,
            joinDates
          ].join(',');
        })
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `students_in_multiple_clubs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSnackbar({
        open: true,
        message: 'Report exported successfully!',
        severity: 'success'
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to export report',
        severity: 'error'
      });
    }
  }, [studentsData]);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case 'subject_oriented_clubs':
        return 'primary';
      case 'soft_skills_oriented_clubs':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getCategoryLabel = (category: string | null) => {
    switch (category) {
      case 'subject_oriented_clubs':
        return 'Subject Oriented';
      case 'soft_skills_oriented_clubs':
        return 'Soft Skills Oriented';
      default:
        return 'null';
    }
  };

  return (
    <DashboardContent>
      <Box sx={{ mb: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4">Students in Multiple Clubs</Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:download-2-line" />}
          onClick={handleExportToExcel}
          disabled={!studentsData || studentsData.length === 0}
        >
          Export to Excel
        </Button>
      </Box>

      <Card>
        <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center' }}>
            <TextField
                placeholder="Search student..."
                value={filterName}
                onChange={(e) => {
                    setFilterName(e.target.value);
                    setPage(0);
                }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                        </InputAdornment>
                    ),
                }}
                sx={{ width: 320 }}
            />
        </Box>

        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 960 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Grade/Comb.</TableCell>
                  <TableCell align="center">Clubs Count</TableCell>
                  <TableCell>Club Memberships</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center"><CircularProgress /></TableCell>
                  </TableRow>
                ) : error ? (
                   <TableRow>
                    <TableCell colSpan={4} align="center"><Alert severity="error">Failed to load</Alert></TableCell>
                   </TableRow>
                ) : filteredData.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} align="center">No data found</TableCell>
                    </TableRow>
                ) : (
                  paginatedData.map((student) => (
                    <TableRow key={student.studentId} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="subtitle2">{student.studentName}</Typography>
                            <Chip label={student.gender} size="small" variant="outlined" sx={{ mt: 1, width: 'fit-content', height: 20, fontSize: '0.7rem' }} />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2">{student.grade || '-'}</Typography>
                            <Typography variant="caption" color="text.secondary">{student.combination || '-'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                            label={student.clubCount} 
                            color="error" 
                            variant="filled"
                            sx={{ fontWeight: 'bold' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack spacing={1}>
                            {student.clubs.map((club) => (
                                <Box key={club.clubId} sx={{ p: 1, borderRadius: 1, bgcolor: 'background.neutral', border: '1px dashed', borderColor: 'divider' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>{club.clubName}</Typography>
                                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>{new Date(club.joinedAt).toLocaleDateString()}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Chip label={getCategoryLabel(club.clubCategory)} color={getCategoryColor(club.clubCategory)} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                                    </Box>
                                </Box>
                            ))}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <TablePagination
            component="div"
            count={filteredData.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
        />
      </Card>

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

export default MultipleClubsReportView;
