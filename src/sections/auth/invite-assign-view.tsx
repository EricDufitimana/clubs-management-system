'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import { alpha } from '@mui/material/styles';

import { useRouter } from '@/routes/hooks';
import { acceptInvite } from '@/actions/acceptInvite';
import { Iconify } from '@/components/iconify';
import { useTRPC } from '@/trpc/client';

// ----------------------------------------------------------------------

type InviteAssignViewProps = {
  token: string;
};

export function InviteAssignView({ token }: InviteAssignViewProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Login mutation
  const loginMutation = useMutation({
    ...trpc.auth.login.mutationOptions(),
    onSuccess: async (data) => {
      // After successful login, proceed with club assignment
      await assignClub();
    },
    onError: (error: any) => {
      setError(error.message || 'Login failed. Please check your credentials.');
      setIsLoggingIn(false);
    },
  });

  const assignClub = useCallback(async () => {
    try {
      setIsAssigning(true);
      setError(null);
      
      // Ensure minimum display time so users see assignment process
      const startTime = Date.now();
      const minDisplayTime = 2500; // Minimum 2.5 seconds

      const result = await acceptInvite(token);
      
      // Calculate remaining time to meet minimum display
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);
      
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        // Show success briefly before redirect
        await new Promise(resolve => setTimeout(resolve, 800));
        router.push('/dashboard/admin');
      }
    } catch (error) {
      setError('Failed to assign club. Please try again.');
    } finally {
      setIsAssigning(false);
    }
  }, [token, router]);

  const handleLogin = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoggingIn(true);
    setError(null);
    
    loginMutation.mutate({
      email,
      password,
    });
  }, [email, password, loginMutation]);

  const isLoading = isLoggingIn || isAssigning || loginMutation.isPending;

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
      <Card sx={{ maxWidth: 480, width: '100%', p: 5 }}>
        <Stack spacing={4}>
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
              <Iconify icon="solar:users-group-rounded-bold-duotone" width={48} />
            </Box>
            <Typography variant="h4" gutterBottom>
              Sign In to Join Club
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please sign in to accept the club invitation
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ width: '100%' }}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleLogin}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
                type="email"
              />

              <TextField
                fullWidth
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
                type={showPassword ? 'text' : 'password'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        disabled={isLoading}
                      >
                        <Iconify 
                          icon={showPassword ? 'solar:eye-bold' : 'solar:eye-closed-bold'} 
                          width={20} 
                        />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                fullWidth
                size="large"
                type="submit"
                variant="contained"
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <Iconify icon="solar:login-3-bold" width={22} />}
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
                {isAssigning ? 'Assigning Club...' : isLoggingIn ? 'Signing In...' : 'Sign In & Join Club'}
              </Button>
            </Stack>
          </Box>

          {/* Assignment Progress (shown after login) */}
          {isAssigning && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Stack spacing={2} alignItems="center">
                <CircularProgress size={40} />
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Assigning club to your account...
                </Typography>
              </Stack>
            </Box>
          )}

          <Divider>
            <Typography variant="caption" color="text.secondary">
              Need help?
            </Typography>
          </Divider>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Contact your club administrator if you're having trouble accepting this invitation.
            </Typography>
          </Box>
        </Stack>
      </Card>
    </Box>
  );
}
