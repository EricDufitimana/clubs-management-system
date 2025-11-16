'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha, useTheme } from '@mui/material/styles';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { fDate } from 'src/utils/format-time';
import { useUserRole } from 'src/hooks/use-user-role';

// ----------------------------------------------------------------------

type Session = {
  id: string;
  club_id: string;
  notes: string;
  date: string;
  club_name?: string;
};

// ----------------------------------------------------------------------

export function AttendanceSessionSelect() {
  const theme = useTheme();
  const router = useRouter();
  const { userId } = useUserRole();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('[ATTENDANCE_SELECT] Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId !== null) {
      fetchSessions();
    }
  }, [userId, fetchSessions]);

  const getSessionColor = (index: number): 'primary' | 'secondary' | 'info' | 'success' | 'warning' => {
    const colors: Array<'primary' | 'secondary' | 'info' | 'success' | 'warning'> = [
      'primary',
      'secondary',
      'info',
      'success',
      'warning',
    ];
    return colors[index % colors.length];
  };

  const handleSelectSession = (sessionId: string) => {
    router.push(`/dashboard/admin/attendance/${sessionId}`);
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

  // Group sessions by month
  const groupedSessions = sessions.reduce((acc, session) => {
    const sessionDate = new Date(session.date);
    const monthKey = `${sessionDate.getFullYear()}-${sessionDate.getMonth()}`;
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(session);
    return acc;
  }, {} as Record<string, Session[]>);

  return (
    <DashboardContent>
      <Stack spacing={4}>
        {/* Header */}
        <Card
          sx={{
            p: 4,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 100%)`,
            }}
          />
          <Stack spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Iconify icon="solar:check-circle-bold" width={48} sx={{ color: 'primary.main' }} />
              <Box>
                <Typography variant="h4">Record Attendance</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Select a session to record attendance
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Card>

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <Card sx={{ p: 6, textAlign: 'center' }}>
            <Iconify icon="solar:check-circle-bold" width={64} sx={{ color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No sessions available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create a session first to record attendance
            </Typography>
          </Card>
        ) : (
          <Box>
            {Object.entries(groupedSessions).map(([monthKey, monthSessions]) => {
              const [year, month] = monthKey.split('-');
              const monthDate = new Date(parseInt(year), parseInt(month));
              const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

              return (
                <Box key={monthKey} sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
                    {monthName}
                  </Typography>
                  <Grid container spacing={2}>
                    {monthSessions.map((session, index) => {
                      const sessionDate = new Date(session.date);
                      const isPast = sessionDate < new Date();
                      const color = getSessionColor(index);

                      return (
                        <Grid key={session.id} size={{ xs: 12, sm: 6, md: 4 }}>
                          <Card
                            onClick={() => handleSelectSession(session.id)}
                            sx={{
                              p: 3,
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              position: 'relative',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.08)} 0%, ${alpha(theme.palette[color].main, 0.04)} 100%)`,
                              border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: theme.shadows[8],
                                border: `2px solid ${theme.palette[color].main}`,
                              },
                            }}
                          >
                            {/* Decorative corner element */}
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: 100,
                                height: 100,
                                background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.1)} 0%, transparent 100%)`,
                                borderRadius: '0 0 0 100%',
                              }}
                            />

                            <Stack spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Chip
                                  label={isPast ? 'Past' : 'Upcoming'}
                                  color={isPast ? 'default' : color}
                                  size="small"
                                  variant="filled"
                                />
                                <Iconify
                                  icon="solar:check-circle-bold"
                                  width={24}
                                  sx={{ color: `${color}.main` }}
                                />
                              </Box>

                              <Box>
                                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                                  {fDate(session.date, 'DD MMM YYYY')}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {fDate(session.date, 'h:mm a')}
                                </Typography>
                              </Box>

                              <Typography
                                variant="body2"
                                sx={{
                                  color: 'text.primary',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  fontWeight: 500,
                                }}
                              >
                                {session.notes}
                              </Typography>

                              {session.club_name && (
                                <Typography variant="caption" color="text.secondary">
                                  {session.club_name}
                                </Typography>
                              )}

                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                <Typography variant="caption" sx={{ color: `${color}.main`, fontWeight: 600 }}>
                                  → Record Attendance
                                </Typography>
                              </Box>
                            </Stack>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              );
            })}
          </Box>
        )}
      </Stack>
    </DashboardContent>
  );
}

