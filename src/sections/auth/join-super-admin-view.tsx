'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

import { useRouter, useSearchParams } from 'next/navigation';
import { paths } from '@/routes/paths';
import { useTRPC } from '@/trpc/client';
import { Iconify } from '@/components/iconify';
import { createClient } from '@/utils/supabase/client';

interface JoinSuperAdminViewProps {
  token: string;
  searchParams: { [key: string]: string | string[] | undefined };
}

export function JoinSuperAdminView({ token, searchParams }: JoinSuperAdminViewProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const supabase = createClient();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  // Validate the invite token
  const { data: inviteData, isLoading: isValidating, error: validationError } = useQuery({
    ...trpc.superAdminInvites.validateInvite.queryOptions({ token }),
    retry: false,
  });

  // Pre-fill email from invite data when available
  useEffect(() => {
    if (inviteData?.email && !email) {
      setEmail(inviteData.email);
    }
  }, [inviteData, email]);

  // Accept invite mutation
  const acceptInviteMutation = useMutation({
    ...trpc.superAdminInvites.acceptInviteWithAuth.mutationOptions(),
    onMutate: (): undefined => {
      setIsCreatingAccount(true);
      return undefined;
    },
    onSuccess: async (data) => {
      try {
        // Sign in the user immediately after account creation
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (signInError) {
          console.error('Failed to sign in after account creation:', signInError);
          // Still redirect to dashboard, the user might need to sign in manually
          router.push(paths.dashboard.superadmin);
          return;
        }

        // Wait a moment for the session to be established
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Redirect to dashboard after successful sign in
        router.push(paths.dashboard.superadmin);
      } catch (error) {
        console.error('Error during sign-in process:', error);
        // Still redirect to dashboard
        router.push(paths.dashboard.superadmin);
      }
    },
    onError: (error: any) => {
      console.error('Failed to accept invite:', error);
      setIsCreatingAccount(false);
    },
  });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      return;
    }

    if (password !== confirmPassword) {
      return;
    }

    acceptInviteMutation.mutate({
      token,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password: password.trim(),
    });
  }, [firstName, lastName, email, password, confirmPassword, token, acceptInviteMutation]);

  // Show loading state while creating account and signing in
  if (isCreatingAccount) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            Creating your account...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Setting up your super admin access and signing you in
          </Typography>
        </Box>
      </Box>
    );
  }

  // Show loading state while validating
  if (isValidating) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6">Validating invitation...</Typography>
        </Box>
      </Box>
    );
  }

  // Show error if token is invalid
  if (validationError) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          p: 3,
        }}
      >
        <Card 
          sx={{ 
            maxWidth: 500, 
            width: '100%',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <CardHeader
            avatar={
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: 'error.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Iconify icon="mingcute:close-circle-line" width={24} color="error.main" />
              </Box>
            }
            title={
              <Typography variant="h5" component="h1" fontWeight="bold">
                Invalid Invitation
              </Typography>
            }
            subheader={
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                This invitation link is invalid or has expired
              </Typography>
            }
          />
          <CardContent sx={{ pt: 0 }}>
            <Alert 
              severity="error" 
              sx={{ 
                mb: 3,
                borderRadius: 2,
                '& .MuiAlert-message': {
                  fontWeight: 500,
                }
              }}
            >
              {validationError.message || 'The invitation token is invalid or has expired.'}
            </Alert>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                This could happen because:
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  The invitation has already been used
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  The invitation link has expired (7-day limit)
                </Typography>
                <Typography component="li" variant="body2" color="text.secondary">
                  The invitation link is incorrect or corrupted
                </Typography>
              </Box>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please contact the person who invited you to get a new invitation link.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<Iconify icon="mingcute:home-2-line" />}
                onClick={() => router.push(paths.home)}
                sx={{ py: 1.5 }}
              >
                Go to Homepage
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Card sx={{ maxWidth: 500, width: '100%' }}>
        <CardHeader
          title="Join as Super Admin"
          subheader={`You've been invited to join as a Super Administrator`}
        />
        
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your account below to accept the super admin invitation and join the platform.
          </Typography>

          <form onSubmit={handleSubmit}>
            <div className='flex gap-2'>
              <TextField
                fullWidth
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isCreatingAccount || acceptInviteMutation.isPending}
                required
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isCreatingAccount || acceptInviteMutation.isPending}
                required
                sx={{ mb: 2 }}
              />

 
            </div>
           <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isCreatingAccount || acceptInviteMutation.isPending}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isCreatingAccount || acceptInviteMutation.isPending}
              required
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isCreatingAccount || acceptInviteMutation.isPending}
              required
              error={confirmPassword !== '' && password !== confirmPassword}
              helperText={confirmPassword !== '' && password !== confirmPassword ? 'Passwords do not match' : ''}
              sx={{ mb: 3 }}
            />

            {acceptInviteMutation.error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {acceptInviteMutation.error.message || 'Failed to accept invitation'}
              </Alert>
            )}

            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={isCreatingAccount || acceptInviteMutation.isPending || !firstName.trim() || !lastName.trim() || !email.trim() || !password.trim() || !confirmPassword.trim() || password !== confirmPassword}
              startIcon={isCreatingAccount || acceptInviteMutation.isPending ? <CircularProgress size={20} /> : <Iconify icon="mingcute:user-add-line" />}
            >
              {isCreatingAccount || acceptInviteMutation.isPending ? 'Creating Account...' : 'Create Super Admin Account'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Link component="button" variant="subtitle2" onClick={() => router.push(paths.auth.signIn)}>
                Sign in
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
