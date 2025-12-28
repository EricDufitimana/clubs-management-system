'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import TablePagination from '@mui/material/TablePagination';
import Chip from '@mui/material/Chip';

import { useUserRole } from '@/hooks/use-user-role';
import { useClubContext } from '@/contexts/club-context';

import { fDate } from '@/utils/format-time';

import { DashboardContent } from '@/layouts/dashboard';

import { Label } from '@/components/label';
import { Iconify } from '@/components/iconify';
import { Scrollbar } from '@/components/scrollbar';
import { useTRPC } from '@/trpc/client';

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

type AttendanceViewProps = {
  sessionId?: string;
};

export function AttendanceView({ sessionId }: AttendanceViewProps = {} as AttendanceViewProps) {
  const theme = useTheme();
  const { userId } = useUserRole();
  const { selectedClub } = useClubContext();
  const [openDialog, setOpenDialog] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  // Filter and pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Fetch attendance records using tRPC - filtered by selected club
  const { data: attendanceData, isLoading: loadingAttendance } = useQuery({
    ...trpc.attendance.getAttendanceRecords.queryOptions({ clubId: selectedClub?.id }),
    enabled: !!userId && !!selectedClub?.id,
  });

  // Fetch students using tRPC - filtered by selected club
  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    ...trpc.users.getUsersByClub.queryOptions({ clubId: selectedClub?.id }),
    enabled: !!userId && !!selectedClub?.id,
  });

  // Fetch sessions without attendance using tRPC - filtered by selected club
  const { data: sessionsData, isLoading: loadingSessions } = useQuery({
    ...trpc.sessions.getSessionsWithoutAttendance.queryOptions({ clubId: selectedClub?.id }),
    enabled: !!userId && !!selectedClub?.id && !sessionId,
  });

  const loading = loadingAttendance || loadingStudents || loadingSessions;

  // Update local state when data changes
  useEffect(() => {
    if (attendanceData) {
      setAttendanceRecords(attendanceData as any);
    }
  }, [attendanceData]);

  useEffect(() => {
    if (studentsData) {
      // Map user data to student format
      const mappedStudents = studentsData.map((user: any) => ({
        id: user.id,
        first_name: user.name.split(' ')[0],
        last_name: user.name.split(' ').slice(1).join(' '),
        grade: user.role,
        combination: user.company,
        gender: undefined,
        avatar: user.avatarUrl,
      }));
      setStudents(mappedStudents);
    }
  }, [studentsData]);

  useEffect(() => {
    if (sessionsData) {
      setSessions(sessionsData as any);
    }
  }, [sessionsData]);

  const handleOpenDialog = useCallback(() => {
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    // Refresh attendance records and sessions after closing dialog
    queryClient.invalidateQueries({ queryKey: trpc.attendance.getAttendanceRecords.queryKey() });
    queryClient.invalidateQueries({ queryKey: trpc.sessions.getSessionsWithoutAttendance.queryKey() });
  }, [queryClient, trpc]);

  const handleSubmitAttendance = useCallback((submittedSessionId: string, submittedAttendanceData: Record<string, AttendanceStatus>) => {
    // Refresh attendance records after submission
    queryClient.invalidateQueries({ queryKey: trpc.attendance.getAttendanceRecords.queryKey() });
    queryClient.invalidateQueries({ queryKey: trpc.sessions.getSessionsWithoutAttendance.queryKey() });
    handleCloseDialog();
  }, [queryClient, trpc, handleCloseDialog]);

  // Filter attendance records
  const filteredRecords = useMemo(() => {
    let filtered = [...attendanceRecords];
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(record =>
        record.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.session_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Session filter
    if (selectedSession !== 'all') {
      filtered = filtered.filter(record => record.session_id === selectedSession);
    }
    
    // Date range filter
    if (startDate) {
      const start = new Date(startDate).getTime();
      filtered = filtered.filter(record => new Date(record.session_date).getTime() >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(record => new Date(record.session_date).getTime() <= end.getTime());
    }
    
    return filtered;
  }, [attendanceRecords, searchQuery, selectedSession, startDate, endDate]);

  // Paginate records
  const paginatedRecords = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredRecords.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredRecords, page, rowsPerPage]);

  // Get unique sessions for filter dropdown
  const sessionOptions = useMemo(() => {
    const uniqueSessions = Array.from(
      new Map(attendanceRecords.map(r => [r.session_id, { id: r.session_id, name: r.session_name, date: r.session_date }])).values()
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return [
      { id: 'all', name: 'All Sessions' },
      ...uniqueSessions,
    ];
  }, [attendanceRecords]);

  const handleChangePage = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedSession('all');
    setStartDate('');
    setEndDate('');
    setPage(0);
  }, []);

  // Calculate statistics (based on filtered records)
  const presentCount = filteredRecords.filter(r => r.status === 'present').length;
  const absentCount = filteredRecords.filter(r => r.status === 'absent').length;
  const excusedCount = filteredRecords.filter(r => r.status === 'excused').length;
  const totalRecords = filteredRecords.length;
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
                  <Iconify icon="eva:trending-up-fill" width={22} />
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Attendance History
              </Typography>
              {(searchQuery || selectedSession !== 'all' || startDate || endDate) && (
                <Chip
                  label="Clear Filters"
                  onDelete={handleClearFilters}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              )}
            </Box>

            {/* Filters Row */}
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by student or session..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" width={20} />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                select
                size="small"
                value={selectedSession}
                onChange={(e) => {
                  setSelectedSession(e.target.value);
                  setPage(0);
                }}
                sx={{ minWidth: { xs: '100%', md: 200 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:document-text-bold-duotone" width={20} />
                    </InputAdornment>
                  ),
                }}
              >
                {sessionOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                type="date"
                size="small"
                label="From Date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(0);
                }}
                sx={{ minWidth: { xs: '100%', md: 160 } }}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                type="date"
                size="small"
                label="To Date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(0);
                }}
                sx={{ minWidth: { xs: '100%', md: 160 } }}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
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
                    {filteredRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                          <Iconify icon="solar:inbox-line-bold-duotone" width={64} sx={{ mb: 2, color: 'text.disabled', opacity: 0.5 }} />
                          <Typography variant="body2" color="text.secondary">
                            {attendanceRecords.length === 0 
                              ? 'No attendance records found. Click "Record Attendance" to get started.'
                              : 'No records match your filters. Try adjusting your search criteria.'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRecords.map((record) => {
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

            {/* Pagination */}
            {filteredRecords.length > 0 && (
              <TablePagination
                component="div"
                count={filteredRecords.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                sx={{ borderTop: `1px solid ${alpha(theme.palette.grey[500], 0.12)}` }}
              />
            )}
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
