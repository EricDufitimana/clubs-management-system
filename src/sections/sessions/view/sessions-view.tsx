'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Snackbar from '@mui/material/Snackbar';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import { alpha, useTheme } from '@mui/material/styles';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';

import { useUserRole } from '@/hooks/use-user-role';
import { useClubContext } from '@/contexts/club-context';

import { fDate } from '@/utils/format-time';

import { DashboardContent } from '@/layouts/dashboard';

import { Iconify } from '@/components/iconify';
import { useTRPC } from '@/trpc/client';

// ----------------------------------------------------------------------

type Session = {
  id: string;
  club_id: string;
  notes: string;
  date: string;
  club_name?: string;
};

export function SessionsView() {
  const theme = useTheme();
  const { userId } = useUserRole();
  const { selectedClub } = useClubContext();
  
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  
  const [formData, setFormData] = useState({
    notes: '',
    date: '',
  });

  const currentUserClubId = selectedClub?.id || null;
  const clubName = selectedClub?.club_name || null;

  // Fetch sessions using tRPC - filtered by selected club
  const { data: sessionsData, isLoading: loading } = useQuery({
    ...trpc.sessions.getSessions.queryOptions({ clubId: currentUserClubId || undefined }),
    enabled: !!userId && !!currentUserClubId,
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    ...trpc.sessions.createSession.mutationOptions(),
    onSuccess: () => {
      setSnackbar({ open: true, message: 'Session created successfully', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: trpc.sessions.getSessions.queryKey() });
      setOpenDialog(false);
      setEditingSessionId(null);
      setFormData({ notes: '', date: '' });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.message || 'Failed to create session', severity: 'error' });
    },
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    ...trpc.sessions.deleteSession.mutationOptions(),
    onSuccess: () => {
      setSnackbar({ open: true, message: 'Session deleted successfully', severity: 'success' });
      queryClient.invalidateQueries({ queryKey: trpc.sessions.getSessions.queryKey() });
    },
    onError: (error: any) => {
      setSnackbar({ open: true, message: error.message || 'Failed to delete session', severity: 'error' });
    },
  });

  // Update local state when sessions data changes
  useEffect(() => {
    if (sessionsData) {
      setSessions(sessionsData as any);
    }
  }, [sessionsData]);

  const handleOpenDialog = useCallback(() => {
    setEditingSessionId(null);
    setFormData({ notes: '', date: '' });
    setOpenDialog(true);
  }, []);

  const handleEditSession = useCallback((session: Session) => {
    setEditingSessionId(session.id);
    // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
    const date = new Date(session.date);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    setFormData({ 
      notes: session.notes, 
      date: formattedDate 
    });
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    if (!createSessionMutation.isPending) {
      setOpenDialog(false);
      setEditingSessionId(null);
      setFormData({ notes: '', date: '' });
    }
  }, [createSessionMutation.isPending]);

  const handleCreateSession = useCallback(() => {
    if (!formData.notes.trim() || !formData.date || !currentUserClubId) {
      setSnackbar({ open: true, message: 'Please fill in all fields', severity: 'error' });
      return;
    }

    // Format date to ISO string
    const dateISO = new Date(formData.date).toISOString();

    createSessionMutation.mutate({
      clubId: currentUserClubId,
      notes: formData.notes,
      date: dateISO,
    });
  }, [formData, currentUserClubId, createSessionMutation]);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  // Sort sessions by date (newest first)
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Group sessions by month
  const groupedSessions = sortedSessions.reduce((acc, session) => {
    const date = new Date(session.date);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(session);
    return acc;
  }, {} as Record<string, Session[]>);

  const getSessionColor = (index: number): 'primary' | 'success' | 'info' | 'secondary' | 'warning' => {
    const colors: Array<'primary' | 'success' | 'info' | 'secondary' | 'warning'> = ['primary', 'success', 'info', 'secondary', 'warning'];
    return colors[index % colors.length];
  };

  return (
    <DashboardContent>
      <Box
        sx={{
          mb: 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Sessions
          </Typography>
          {clubName && (
            <Typography variant="body2" color="text.secondary">
              {clubName}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleOpenDialog}
          disabled={!currentUserClubId}
        >
          New Session
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : sortedSessions.length === 0 ? (
        <Card
          sx={{
            p: 8,
            textAlign: 'center',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
          }}
        >
          <Iconify icon="solar:calendar-mark-bold-duotone" width={80} sx={{ color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            No sessions yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first session to get started
          </Typography>
          <Button variant="contained" onClick={handleOpenDialog} disabled={!currentUserClubId}>
            Create Session
          </Button>
        </Card>
      ) : (
        <Box>
          {Object.entries(groupedSessions).map(([monthKey, monthSessions]) => {
            const [year, month] = monthKey.split('-');
            const monthDate = new Date(parseInt(year), parseInt(month));
            const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

            return (
              <Box key={monthKey} sx={{ mb: 5 }}>
                <Typography variant="h6" sx={{ mb: 3, color: 'text.secondary' }}>
                  {monthName}
                </Typography>
                <Grid container spacing={3}>
                  {monthSessions.map((session, index) => {
                    const sessionDate = new Date(session.date);
                    const isPast = sessionDate < new Date();
                    const color = getSessionColor(index);
                    const paletteColor = color as 'primary' | 'success' | 'info' | 'secondary' | 'warning';

                    return (
                      <Grid key={session.id} size={{ xs: 12, sm: 6, md: 4 }}>
                        <Card
                          sx={{
                            p: 3,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            overflow: 'hidden',
                            background: `linear-gradient(135deg, ${alpha(theme.palette[paletteColor].main, 0.08)} 0%, ${alpha(theme.palette[paletteColor].main, 0.04)} 100%)`,
                            border: `1px solid ${alpha(theme.palette[paletteColor].main, 0.2)}`,
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
                              background: `linear-gradient(135deg, ${alpha(theme.palette[paletteColor].main, 0.1)} 0%, transparent 100%)`,
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
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditSession(session);
                                  }}
                                  sx={{ 
                                    color: `${color}.main`,
                                    '&:hover': {
                                      bgcolor: alpha(theme.palette[paletteColor].main, 0.08),
                                    },
                                  }}
                                >
                                  <Iconify icon="solar:pen-bold" width={18} />
                                </IconButton>
                                <Iconify
                                  icon="solar:calendar-mark-bold-duotone"
                                  width={24}
                                  sx={{ color: `${color}.main` }}
                                />
                              </Box>
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
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                minHeight: 60,
                              }}
                            >
                              {session.notes}
                            </Typography>

                            {session.club_name && (
                              <Typography variant="caption" color="text.secondary">
                                {session.club_name}
                              </Typography>
                            )}
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

      {/* Create/Edit Session Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSessionId ? 'Edit Session' : 'Create New Session'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Date & Time"
              type="datetime-local"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              disabled={createSessionMutation.isPending}
            />
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Enter session notes, agenda, or description..."
              disabled={createSessionMutation.isPending}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={createSessionMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateSession}
            variant="contained"
            disabled={createSessionMutation.isPending || !formData.notes.trim() || !formData.date}
            startIcon={createSessionMutation.isPending ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {createSessionMutation.isPending 
              ? (editingSessionId ? 'Updating...' : 'Creating...') 
              : (editingSessionId ? 'Update Session' : 'Create Session')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardContent>
  );
}

