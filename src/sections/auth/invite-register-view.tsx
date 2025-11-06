'use client';

import { useState, useCallback, useEffect } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { Iconify } from 'src/components/iconify';

import { useRouter } from 'src/routes/hooks';
import { completeInviteRegistration } from 'src/actions/completeInviteRegistration';
import { validateInvite } from 'src/actions/validateInvite';
import { createClient } from 'src/utils/supabase/client';

// ----------------------------------------------------------------------

type InviteRegisterViewProps = {
  token: string;
};

export function InviteRegisterView({ token }: InviteRegisterViewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        // Check if user is logged in
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          // Redirect to sign in with return URL
          router.push(`/sign-in?redirect=/join-club/${token}/register`);
          setLoading(false);
          return;
        }

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

  const handleRegister = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setSnackbar({
        open: true,
        message: 'Passwords do not match',
        severity: 'error'
      });
      setSubmitting(false);
      return;
    }
    
    // Validate password length
    if (password && password.length < 6) {
      setSnackbar({
        open: true,
        message: 'Password must be at least 6 characters',
        severity: 'error'
      });
      setSubmitting(false);
      return;
    }
    
    try {
      const result = await completeInviteRegistration(token, formData);
      
      if (result?.error) {
        setSnackbar({
          open: true,
          message: result.error,
          severity: 'error'
        });
      } else if (result?.success) {
        setSnackbar({
          open: true,
          message: result.message || 'Registration completed successfully!',
          severity: 'success'
        });
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard/clubs');
        }, 2000);
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'An error occurred while completing registration',
        severity: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  }, [token, router]);
  
  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!inviteInfo) {
    return (
      <Box sx={{ textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Invalid or expired invitation
        </Alert>
        <Link href="/sign-in" component="a">
          Go to Sign In
        </Link>
      </Box>
    );
  }

  const renderForm = (
    <Box
      component="form"
      onSubmit={handleRegister}
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ width: '100%', mb: 2, p: 2, bgcolor: 'background.neutral', borderRadius: 1 }}>
        <Typography variant="subtitle1" gutterBottom>
          Club: <strong>{inviteInfo.clubName}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Role: <strong>{inviteInfo.role}</strong>
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          width: '100%',
          mb: 3,
        }}
      >
        <TextField
          fullWidth
          name="first_name"
          label="First name"
          required
          disabled={submitting}
          slotProps={{
            inputLabel: { shrink: true },
          }}
        />
        <TextField
          fullWidth
          name="last_name"
          label="Last name"
          required
          disabled={submitting}
          slotProps={{
            inputLabel: { shrink: true },
          }}
        />
      </Box>

      <TextField
        fullWidth
        name="email"
        label="Email address"
        type="email"
        defaultValue={inviteInfo.email}
        required
        disabled={submitting}
        sx={{ mb: 3 }}
        slotProps={{
          inputLabel: { shrink: true },
        }}
      />

      <TextField
        fullWidth
        name="password"
        label="Password"
        type={showPassword ? 'text' : 'password'}
        required
        disabled={submitting}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  <Iconify icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 3 }}
      />

      <TextField
        fullWidth
        name="confirmPassword"
        label="Confirm password"
        type={showConfirmPassword ? 'text' : 'password'}
        required
        disabled={submitting}
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                  <Iconify icon={showConfirmPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        sx={{ mb: 3 }}
      />

      <Button
        fullWidth
        size="large"
        type="submit"
        color="inherit"
        variant="contained"
        disabled={submitting}
        startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
      >
        {submitting ? 'Completing Registration...' : 'Complete Registration'}
      </Button>
    </Box>
  );

  return (
    <>
      <Box
        sx={{
          gap: 1.5,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 5,
        }}
      >
        <Typography variant="h5">Complete Your Registration</Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            textAlign: 'center',
          }}
        >
          You've been invited to join as a club leader. Please complete your registration below.
        </Typography>
  
      </Box>
      {renderForm}
      
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
    </>
  );
}

