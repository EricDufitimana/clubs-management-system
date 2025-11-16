'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { useUserRole } from 'src/hooks/use-user-role';

import { fDate } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { RecordAttendanceDialog } from '../components/record-attendance-dialog';

// ----------------------------------------------------------------------

type Student = {
  id: string;
  first_name: string;
  last_name: string;
  grade?: string;
  combination?: string;
  gender?: 'male' | 'female';
  avatar?: string;
};

type Session = {
  id: string;
  date: string;
  notes: string;
  club_name: string;
};

type AttendanceRecord = {
  id: string;
  student_id: string;
  student_name: string;
  session_id: string;
  session_date: string;
  session_name: string;
  status: 'present' | 'absent' | 'excused';
  avatarUrl?: string;
};

type AttendanceStatus = 'present' | 'absent' | 'excused';

// ----------------------------------------------------------------------

export function AttendanceView() {
  const theme = useTheme();
  const { userId } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Fetch attendance records
  const fetchAttendanceRecords = useCallback(async () => {
    try {
      const response = await fetch('/api/attendance');
      if (response.ok) {
        const data = await response.json();
        setAttendanceRecords(data);
      }
    } catch (error) {
      console.error('[ATTENDANCE_VIEW] Error fetching attendance:', error);
    }
  }, []);

  // Fetch students
  const fetchStudents = useCallback(async () => {
    if (!userId) return;
    try {
      const response = await fetch(`/api/students/fetch?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error('[ATTENDANCE_VIEW] Error fetching students:', error);
    }
  }, [userId]);

  // Fetch sessions without attendance
  const fetchSessionsWithoutAttendance = useCallback(async () => {
    try {
      const response = await fetch('/api/sessions/without-attendance');
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('[ATTENDANCE_VIEW] Error fetching sessions:', error);
    }
  }, []);

  useEffect(() => {
    if (userId !== null) {
      setLoading(true);
      Promise.all([
        fetchAttendanceRecords(),
        fetchStudents(),
        fetchSessionsWithoutAttendance(),
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [userId, fetchAttendanceRecords, fetchStudents, fetchSessionsWithoutAttendance]);

  const handleOpenDialog = useCallback(() => {
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    // Refresh attendance records and sessions after closing dialog
    fetchAttendanceRecords();
    fetchSessionsWithoutAttendance();
  }, [fetchAttendanceRecords, fetchSessionsWithoutAttendance]);

  const handleSubmitAttendance = useCallback((sessionId: string, attendanceData: Record<string, AttendanceStatus>) => {
    // Refresh attendance records after submission
    fetchAttendanceRecords();
    fetchSessionsWithoutAttendance();
    handleCloseDialog();
  }, [fetchAttendanceRecords, fetchSessionsWithoutAttendance, handleCloseDialog]);

  // Calculate statistics
  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
  const excusedCount = attendanceRecords.filter(r => r.status === 'excused').length;
  const totalRecords = attendanceRecords.length;
  const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

  const getInitials = (firstName: string, lastName: string) => `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
        return 'success';
      case 'absent':
        return 'error';
      case 'excused':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <DashboardContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <Stack spacing={4}>
        {/* Header Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" sx={{ mb: 1 }}>
              Attendance Records
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View and manage student attendance across all sessions
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" width={20} />}
            onClick={handleOpenDialog}
          >
            Record Attendance
          </Button>
        </Box>

        {/* Statistics Cards */}
        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                p: 2.5,
                borderRadius: 2,
                boxShadow: theme.vars?.customShadows?.card ?? `0 2px 8px ${alpha(theme.palette.grey[500], 0.16)}`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.24)}`,
                bgcolor: 'background.paper',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(theme.palette.success.main, 0.08),
                    color: 'success.main',
                  }}
                >
                  <Iconify icon="solar:check-circle-bold" width={22} />
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Present students
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 0.5 }}>
                    {presentCount}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                p: 2.5,
                borderRadius: 2,
                boxShadow: theme.vars?.customShadows?.card ?? `0 2px 8px ${alpha(theme.palette.grey[500], 0.16)}`,
                border: `1px solid ${alpha(theme.palette.error.main, 0.24)}`,
                bgcolor: 'background.paper',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(theme.palette.error.main, 0.08),
                    color: 'error.main',
                  }}
                >
                  <Iconify icon="mingcute:close-line" width={22} />
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Absent students
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 0.5 }}>
                    {absentCount}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                p: 2.5,
                borderRadius: 2,
                boxShadow: theme.vars?.customShadows?.card ?? `0 2px 8px ${alpha(theme.palette.grey[500], 0.16)}`,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.24)}`,
                bgcolor: 'background.paper',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(theme.palette.warning.main, 0.08),
                    color: 'warning.main',
                  }}
                >
                  <Iconify icon="solar:clock-circle-outline" width={22} />
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Excused absences
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 0.5 }}>
                    {excusedCount}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card
              sx={{
                p: 2.5,
                borderRadius: 2,
                boxShadow: theme.vars?.customShadows?.card ?? `0 2px 8px ${alpha(theme.palette.grey[500], 0.16)}`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.24)}`,
                bgcolor: 'background.paper',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(theme.palette.info.main, 0.08),
                    color: 'info.main',
                  }}
                >
                  <Iconify icon="solar:chart-square-bold-duotone" width={22} />
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Overall attendance rate
                  </Typography>
                  <Typography variant="h5" sx={{ mt: 0.5 }}>
                    {attendanceRate}%
                  </Typography>
                </Box>
              </Stack>
            </Card>
          </Grid>
        </Grid>

        {/* Attendance Records Table */}
        <Card>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Attendance History
            </Typography>
            <Scrollbar>
              <TableContainer sx={{ overflow: 'unset' }}>
                <Table sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell>Session Date</TableCell>
                      <TableCell>Session</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attendanceRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                          <Typography variant="body2" color="text.secondary">
                            No attendance records found. Click "Record Attendance" to get started.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      attendanceRecords.map((record) => {
                        const student = students.find(s => s.id === record.student_id);
                        return (
                          <TableRow key={record.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar
                                  alt={record.student_name}
                                  src={record.avatarUrl}
                                  sx={{
                                    width: 40,
                                    height: 40,
                                  }}
                                >
                                  {student ? getInitials(student.first_name, student.last_name) : '??'}
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle2">
                                    {record.student_name}
                                  </Typography>
                                  {student?.grade && (
                                    <Typography variant="caption" color="text.secondary">
                                      {student.grade}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {fDate(record.session_date, 'DD MMM YYYY')}
                              </Typography>
                            
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {record.session_name}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Label color={getStatusColor(record.status)} variant="soft">
                                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                              </Label>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Scrollbar>
          </Box>
        </Card>
      </Stack>

      <RecordAttendanceDialog
        open={openDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSubmitAttendance}
        sessions={sessions}
        students={students}
      />
    </DashboardContent>
  );
}
