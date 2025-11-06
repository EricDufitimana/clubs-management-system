'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Box from '@mui/material/Box';

import { validateInvite } from 'src/actions/validateInvite';
import { AuthLayout } from 'src/layouts/auth';

export default function JoinClubPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<{
    clubName: string;
    role: string;
    email: string;
  } | null>(null);
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'error'
  });

  useEffect(() => {
    const fetchInviteInfo = async () => {
      if (!token) {
        setError('Invalid invitation link');
        setLoading(false);
        return;
      }

      try {
        const result = await validateInvite(token);
        if (result.error) {
          setError(result.error);
          setSnackbar({
            open: true,
            message: result.error,
            severity: 'error'
          });
        } else if (result.success && result.invite) {
          setInviteInfo({
            clubName: result.invite.clubName,
            role: result.invite.roleDisplayName,
            email: result.invite.email
          });
        }
      } catch (err) {
        setError('Failed to load invitation details');
        setSnackbar({
          open: true,
          message: 'Failed to load invitation details',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInviteInfo();
  }, [token]);

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleContinue = () => {
    router.push(`/join-club/${token}/register`);
  };

  if (loading) {
    return (
      <AuthLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Box
        sx={{
          gap: 1.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 5,
        }}
      >
        <Typography variant="h5">Club Invitation</Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            textAlign: 'center',
          }}
        >
          You've been invited to join a club!
        </Typography>
      </Box>

      {error && !inviteInfo && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {inviteInfo && (
        <>
          <Box sx={{ width: '100%', mb: 3, p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              Club: <strong>{inviteInfo.clubName}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Role: <strong>{inviteInfo.role}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Email: <strong>{inviteInfo.email}</strong>
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleContinue}
              color="inherit"
            >
              Continue to Registration
            </Button>

            <Button
              variant="outlined"
              size="large"
              fullWidth
              component={Link}
              href="/sign-in"
              color="inherit"
            >
              Sign In First
            </Button>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: 3, display: 'block', textAlign: 'center' }}>
            By continuing, you'll complete your registration and join this club.
          </Typography>
        </>
      )}

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
    </AuthLayout>
  );
}

