'use client';

import { useState, useCallback, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { alpha, useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { fDate } from 'src/utils/format-time';
import { getGradeColor, getCombinationColor, formatCombination } from 'src/sections/user/utils/colors';
import addAttendance from 'src/actions/addAttendance';

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

type AttendanceStatus = 'present' | 'absent' | 'excused';

type RecordAttendanceDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (sessionId: string, attendanceData: Record<string, AttendanceStatus>) => void;
  sessions: Session[];
  students: Student[];
};

// ----------------------------------------------------------------------

export function RecordAttendanceDialog({
  open,
  onClose,
  onSubmit,
  sessions: initialSessions,
  students,
}: RecordAttendanceDialogProps) {
  const theme = useTheme();
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('all');
  const [filterCombination, setFilterCombination] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch sessions without attendance when dialog opens
  useEffect(() => {
    if (open) {
      const fetchSessions = async () => {
        setLoadingSessions(true);
        try {
          const response = await fetch('/api/sessions/without-attendance');
          if (response.ok) {
            const data = await response.json();
            setSessions(data);
          }
        } catch (error) {
          console.error('[RECORD_ATTENDANCE_DIALOG] Error fetching sessions:', error);
        } finally {
          setLoadingSessions(false);
        }
      };
      fetchSessions();
    }
  }, [open]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedSessionId('');
      setAttendance({});
      setSearchQuery('');
      setFilterGrade('all');
      setFilterCombination('all');
    }
  }, [open]);

  const handleSessionChange = useCallback((sessionId: string) => {
    setSelectedSessionId(sessionId);
    setAttendance({});
  }, []);

  const handleAttendanceChange = useCallback((studentId: string, status: AttendanceStatus | '') => {
    setAttendance((prev) => {
      const newAttendance = { ...prev };
      if (status === '') {
        delete newAttendance[studentId];
      } else {
        newAttendance[studentId] = status as AttendanceStatus;
      }
      return newAttendance;
    });
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedSessionId || Object.keys(attendance).length === 0) {
      return;
    }
    setLoading(true);
    try {
      const attendanceData = Object.entries(attendance)
        .filter(([_, status]) => status)
        .map(([studentId, status]) => ({
          student_id: studentId,
          attendance_status: status as AttendanceStatus,
        }));
      const result = await addAttendance(selectedSessionId, attendanceData);
      if (result.success) {
        setSnackbar({
          open: true,
          message: result.message,
          severity: 'success'
        });
        // Call onSubmit to notify parent component
        onSubmit(selectedSessionId, attendance);
        onClose();
      } else {
        setSnackbar({
          open: true,
          message: result.error || 'Failed to add attendance',
          severity: 'error'
        });
      }
    } catch (error) {
      console.error('[RECORD_ATTENDANCE_DIALOG] Error submitting attendance:', error);
      setSnackbar({
        open: true,
        message: 'Failed to submit attendance',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [selectedSessionId, attendance, onSubmit, onClose]);

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      searchQuery === '' ||
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGrade = filterGrade === 'all' || student.grade === filterGrade;
    const matchesCombination = filterCombination === 'all' || student.combination === filterCombination;

    return matchesSearch && matchesGrade && matchesCombination;
  });

  const totalMarked = Object.keys(attendance).length;

  const uniqueGrades = Array.from(new Set(students.map((s) => s.grade).filter(Boolean))) as string[];
  const uniqueCombinations = Array.from(
    new Set(students.map((s) => s.combination).filter(Boolean))
  ) as string[];

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Record Attendance</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {totalMarked > 0 && (
              <Typography variant="body2" color="text.secondary">
                {totalMarked} marked
              </Typography>
            )}
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 2 }}>
          {/* Session Selection */}
          <Box>
            <TextField
              select
              fullWidth
              label="Select Session"
              value={selectedSessionId}
              onChange={(e) => handleSessionChange(e.target.value)}
              disabled={loadingSessions}
              SelectProps={{
                displayEmpty: true,
              }}
              InputProps={{
                endAdornment: loadingSessions ? (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                ) : undefined,
              }}
            >
              <MenuItem value="" disabled={loadingSessions}>
                <em>Choose session</em>
              </MenuItem>
              {sessions.map((session) => (
                <MenuItem key={session.id} value={session.id}>
                  <Box>
                    <Typography variant="body2">
                      {fDate(session.date, 'DD MMM YYYY')} - {fDate(session.date, 'HH:mm')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {session.club_name} - {session.notes}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </TextField>
          
          </Box>

          {selectedSessionId && (
            <>
              {/* Students List */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Students ({filteredStudents.length})
                </Typography>
                <Stack spacing={1}>
                  {filteredStudents.map((student) => {
                    const studentAttendance = attendance[student.id] || '';

                    return (
                      <Card
                        key={student.id}
                        sx={{
                          p: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          transition: 'all 0.2s ease',
                          border: `1px solid ${alpha(theme.palette.grey[500], 0.2)}`,
                          bgcolor: studentAttendance
                            ? alpha(
                                studentAttendance === 'present'
                                  ? theme.palette.success.main
                                  : studentAttendance === 'absent'
                                    ? theme.palette.error.main
                                    : theme.palette.warning.main,
                                0.05
                              )
                            : 'transparent',
                          '&:hover': {
                            boxShadow: theme.shadows[2],
                            borderColor: alpha(theme.palette.primary.main, 0.3),
                          },
                        }}
                      >
                        {/* Student Info */}
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: theme.palette.primary.main,
                            fontSize: '0.875rem',
                            fontWeight: 'bold',
                          }}
                        >
                          {getInitials(student.first_name, student.last_name)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {student.first_name} {student.last_name}
                          </Typography>
                          <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                            {student.grade && (
                              <Label color={getGradeColor(student.grade)} variant="soft" sx={{ fontSize: '0.65rem' }}>
                                {student.grade}
                              </Label>
                            )}
                            {student.combination && (
                              <Label
                                color={getCombinationColor(student.combination)}
                                variant="soft"
                                sx={{ fontSize: '0.65rem' }}
                              >
                                {formatCombination(student.combination)}
                              </Label>
                            )}
                          </Stack>
                        </Box>

                        {/* Attendance Select */}
                        <TextField
                          select
                          size="small"
                          value={studentAttendance}
                          onChange={(e) => handleAttendanceChange(student.id, e.target.value as AttendanceStatus | '')}
                          sx={{ minWidth: 150 }}
                          SelectProps={{
                            displayEmpty: true,
                          }}
                        >
                          <MenuItem value="">
                            <em>Select status</em>
                          </MenuItem>
                          <MenuItem value="present">Present</MenuItem>
                          <MenuItem value="absent">Absent</MenuItem>
                          <MenuItem value="excused">Excused</MenuItem>
                        </TextField>
                      </Card>
                    );
                  })}
                </Stack>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!selectedSessionId || totalMarked === 0 || loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Iconify icon="eva:checkmark-fill" width={20} />}
        >
          {loading ? 'Submitting...' : `Submit Attendance (${totalMarked} marked)`}
        </Button>
      </DialogActions>
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
    </Dialog>
  );
}

