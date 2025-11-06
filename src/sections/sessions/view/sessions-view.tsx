'use client';

import { useState, useCallback, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import { alpha, useTheme } from '@mui/material/styles';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { fDate } from 'src/utils/format-time';
import { useUserRole } from 'src/hooks/use-user-role';
import { updateSession } from 'src/actions/updateSession';

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
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [creating, setCreating] = useState(false);
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
  
  const [currentUserClubId, setCurrentUserClubId] = useState<string | null>(null);
  const [clubName, setClubName] = useState<string | null>(null);

  const fetchCurrentUserClub = useCallback(async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/user/club-by-user?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentUserClubId(data.club_id);
        setClubName(data.club_name);
      }
    } catch (error) {
      console.error('[SESSIONS_VIEW] Error fetching club:', error);
    }
  }, [userId]);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      } else {
        setSnackbar({ open: true, message: 'Failed to load sessions', severity: 'error' });
      }
    } catch (error) {
      console.error('[SESSIONS_VIEW] Error fetching sessions:', error);
      setSnackbar({ open: true, message: 'Failed to load sessions', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId !== null) {
      fetchSessions();
      fetchCurrentUserClub();
    }
  }, [fetchSessions, fetchCurrentUserClub, userId]);

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
    if (!creating) {
      setOpenDialog(false);
      setEditingSessionId(null);
      setFormData({ notes: '', date: '' });
    }
  }, [creating]);

  const handleCreateSession = useCallback(async () => {
    if (!formData.notes.trim() || !formData.date || !currentUserClubId) {
      setSnackbar({ open: true, message: 'Please fill in all fields', severity: 'error' });
      return;
    }

    setCreating(true);
    try {
      const isEditing = editingSessionId !== null;

      if (isEditing) {
        // Use server action for updating
        const result = await updateSession(
          editingSessionId,
          currentUserClubId,
          formData.notes,
          formData.date
        );

        if ('error' in result) {
          throw new Error(result.error);
        }

        setSnackbar({ 
          open: true, 
          message: result.message || 'Session updated successfully', 
          severity: 'success' 
        });
      } else {
        // Use API for creating
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            club_id: currentUserClubId,
            notes: formData.notes,
            date: formData.date,
          }),
        });

        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          throw new Error(response.statusText || 'Failed to create session');
        }

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to create session');
        }

        setSnackbar({ 
          open: true, 
          message: 'Session created successfully', 
          severity: 'success' 
        });
      }

      setOpenDialog(false);
      setEditingSessionId(null);
      setFormData({ notes: '', date: '' });
      fetchSessions();
    } catch (error: any) {
      console.error('[SESSIONS_VIEW] Error saving session:', error);
      setSnackbar({ 
        open: true, 
        message: error?.message || 'Failed to save session', 
        severity: 'error' 
      });
    } finally {
      setCreating(false);
    }
  }, [formData, currentUserClubId, editingSessionId, fetchSessions]);

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

  const getSessionColor = (index: number) => {
    const colors = ['primary', 'success', 'info', 'secondary', 'default'] as const;
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

                    return (
                      <Grid key={session.id} xs={12} sm={6} md={4}>
                        <Card
                          sx={{
                            p: 3,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative',
                            overflow: 'hidden',
                            background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.08)} 0%, ${alpha(theme.palette[color].main, 0.04)} 100%)`,
                            border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
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
                                variant="soft"
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
                                      bgcolor: alpha(theme.palette[color].main, 0.08),
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
              disabled={creating}
            />
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Enter session notes, agenda, or description..."
              disabled={creating}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={creating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateSession}
            variant="contained"
            disabled={creating || !formData.notes.trim() || !formData.date}
            startIcon={creating ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {creating 
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

