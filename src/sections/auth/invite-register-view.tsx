'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { useRouter } from '@/routes/hooks';

import { createClient } from '@/utils/supabase/client';

import { validateInvite } from '@/actions/validateInvite';
import { completeInviteRegistration } from '@/actions/completeInviteRegistration';

import { Iconify } from '@/components/iconify';

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
          router.push('/');
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!inviteInfo) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
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
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Box sx={{ width: '100%', p: 2.5, bgcolor: 'background.neutral', borderRadius: 1, mb: 0 }}>
        <Typography variant="subtitle2" gutterBottom>
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
        }}
      >
        <TextField
          fullWidth
          name="first_name"
          label="First name"
          required
          disabled={submitting}
          size="medium"
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              sx: {
                fontSize: '1.1rem',
                height: '64px',
                padding: '16px 14px',
              }
            }
          }}
        />
        <TextField
          fullWidth
          name="last_name"
          label="Last name"
          required
          disabled={submitting}
          size="medium"
          slotProps={{
            inputLabel: { shrink: true },
            input: {
              sx: {
                fontSize: '1.1rem',
                height: '64px',
                padding: '16px 14px',
              }
            }
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
        size="medium"
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            sx: {
              fontSize: '1rem',
              height: '56px',
            }
          }
        }}
      />

      <TextField
        fullWidth
        name="password"
        label="Password"
        type={showPassword ? 'text' : 'password'}
        required
        disabled={submitting}
        size="medium"
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            sx: {
              fontSize: '1rem',
              height: '56px',
            },
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                  <Iconify icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <TextField
        fullWidth
        name="confirmPassword"
        label="Confirm password"
        type={showConfirmPassword ? 'text' : 'password'}
        required
        disabled={submitting}
        size="medium"
        slotProps={{
          inputLabel: { shrink: true },
          input: {
            sx: {
              fontSize: '1rem',
              height: '56px',
            },
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small">
                  <Iconify icon={showConfirmPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <Button
        fullWidth
        size="large"
        type="submit"
        color="inherit"
        variant="contained"
        disabled={submitting}
        startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
        sx={{ 
          mt: 0.5,
          height: '56px',
          fontSize: '1rem'
        }}
      >
        {submitting ? 'Completing Registration...' : 'Complete Registration'}
      </Button>
    </Box>
  );

  return (
    <>
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

