'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha } from '@mui/material/styles';

import { useRouter } from '@/routes/hooks';
import { validateInvite } from '@/actions/validateInvite';
import { Iconify } from '@/components/iconify';

// ----------------------------------------------------------------------

type InviteChoiceViewProps = {
  token: string;
};

export function InviteChoiceView({ token }: InviteChoiceViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
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
      try {
        const result = await validateInvite(token);
        if (result.error) {
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
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Failed to load invitation details',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchInviteInfo();
    } else {
      setLoading(false);
    }
  }, [token]);

  const handleNewUser = () => {
    router.push(`/join-club/${token}/register`);
  };

  const handleExistingUser = () => {
    // Redirect to sign-in with return URL to assignment page
    router.push(`/join-club/${token}/assign`);
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!inviteInfo) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
          p: 3,
        }}
      >
        <Card sx={{ maxWidth: 480, width: '100%', p: 4 }}>
          <Alert severity="error">
            Invalid or expired invitation. Please contact your club administrator.
          </Alert>
        </Card>
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
          p: 3,
        }}
      >
        <Card sx={{ maxWidth: 480, width: '100%', p: 5 }}>
          <Stack spacing={3}>
            {/* Header */}
            <Box sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  color: 'primary.main',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <Iconify icon="solar:letter-opened-bold-duotone" width={48} />
              </Box>
              <Typography variant="h4" gutterBottom>
                You're Invited!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You've been invited to join <strong>{inviteInfo.clubName}</strong> as{' '}
                <strong>{inviteInfo.role}</strong>
              </Typography>
            </Box>

            {/* Invite Details */}
            <Box
              sx={{
                p: 2.5,
                borderRadius: 1.5,
                bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
              }}
            >
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Iconify icon="solar:users-group-rounded-bold-duotone" width={20} color="text.secondary" />
                  <Typography variant="body2" color="text.secondary">
                    Club:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {inviteInfo.clubName}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Iconify icon="solar:medal-star-bold-duotone" width={20} color="text.secondary" />
                  <Typography variant="body2" color="text.secondary">
                    Role:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {inviteInfo.role}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Iconify icon="solar:letter-bold-duotone" width={20} color="text.secondary" />
                  <Typography variant="body2" color="text.secondary">
                    Email:
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {inviteInfo.email}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Divider>
              <Typography variant="caption" color="text.secondary">
                Choose an option
              </Typography>
            </Divider>

            {/* Action Buttons */}
            <Stack spacing={2}>
              <Button
                fullWidth
                size="large"
                variant="contained"
                onClick={handleNewUser}
                startIcon={<Iconify icon="solar:user-plus-bold" width={22} />}
                sx={{ 
                  py: 1.5,
                  px: 2,
                  minHeight: 56,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 1.5,
                }}
              >
                I'm a New User
              </Button>

              <Button
                fullWidth
                size="large"
                variant="outlined"
                onClick={handleExistingUser}
                startIcon={<Iconify icon="solar:login-3-bold" width={22} />}
                sx={{ 
                  py: 1.5,
                  px: 2,
                  minHeight: 56,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  borderRadius: 1.5,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                  }
                }}
              >
                I Already Have an Account
              </Button>
            </Stack>

            <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ pt: 1 }}>
              This invitation is for <strong>{inviteInfo.email}</strong>
            </Typography>
          </Stack>
        </Card>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

