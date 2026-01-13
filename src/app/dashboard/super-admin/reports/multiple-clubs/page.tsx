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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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

export function MultipleClubsReportView() {
  const trpc = useTRPC();
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch students in multiple clubs
  const { data: studentsData, isLoading, error } = useQuery({
    ...trpc.clubs.getStudentsInMultipleClubs.queryOptions(),
  });

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
      <Box
        sx={{
          mb: 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h4">
          Students in Multiple Clubs Report
        </Typography>
        <Button
          variant="contained"
          color="inherit"
          startIcon={<Iconify icon="mingcute:download-2-line" />}
          onClick={handleExportToExcel}
          disabled={!studentsData || studentsData.length === 0}
        >
          Export to Excel
        </Button>
      </Box>

      <Card>
        <Scrollbar>
          <TableContainer component={Paper} sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Student Name</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Combination</TableCell>
                  <TableCell>Gender</TableCell>
                  <TableCell align="center">Number of Clubs</TableCell>
                  <TableCell>Club Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Alert severity="error">
                        Failed to load data. Please try again.
                      </Alert>
                    </TableCell>
                  </TableRow>
                ) : !studentsData || studentsData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" sx={{ py: 3 }}>
                        No students found in multiple clubs.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  studentsData.map((student) => (
                    <TableRow key={student.studentId}>
                      <TableCell component="th" scope="row">
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {student.studentName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {student.studentId}
                        </Typography>
                      </TableCell>
                      <TableCell>{student.grade || 'null'}</TableCell>
                      <TableCell>{student.combination || 'null'}</TableCell>
                      <TableCell>{student.gender}</TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={student.clubCount} 
                          color={student.clubCount > 2 ? 'error' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography variant="body2">
                              View {student.clubCount} club(s)
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {student.clubs.map((club, index) => (
                                <Box key={club.clubId} sx={{ 
                                  p: 1, 
                                  border: '1px solid', 
                                  borderColor: 'divider',
                                  borderRadius: 1 
                                }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                    {club.clubName}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                                    <Chip
                                      label={getCategoryLabel(club.clubCategory)}
                                      color={getCategoryColor(club.clubCategory)}
                                      size="small"
                                    />
                                    <Chip
                                      label={club.membershipStatus}
                                      color={club.membershipStatus === 'active' ? 'success' : 'default'}
                                      size="small"
                                    />
                                  </Box>
                                  <Typography variant="caption" color="text.secondary">
                                    Joined: {new Date(club.joinedAt).toLocaleDateString()}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </AccordionDetails>
                        </Accordion>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>
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
