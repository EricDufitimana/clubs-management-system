'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { useRouter } from '@/routes/hooks';
import { useSearchParams } from 'next/navigation';

import { login } from '@/actions/login';

import { Iconify } from '@/components/iconify';
import { useTRPC } from '@/trpc/client';

// ----------------------------------------------------------------------

export function SignInView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const [showPassword, setShowPassword] = useState(false);
  const [snackbar, setSnackbar] = useState<{open: boolean; message: string; severity: 'success' | 'error'}>({
    open: false,
    message: '',
    severity: 'error'
  });
  
  const trpc = useTRPC();
  const loginMutation = useMutation({
    ...trpc.auth.login.mutationOptions(),
    onSuccess: (data) => {
      setSnackbar({
        open: true,
        message: 'Login successful',
        severity: 'success'
      });
      // Handle redirect on client side - use custom redirect if available
      if (redirectUrl) {
        router.push(redirectUrl);
      } else if (data?.redirectPath) {
        router.push(data.redirectPath);
      }
    },
    onError: (error) => {
      setSnackbar({
        open: true,
        message: error.message || 'An error occurred',
        severity: 'error'
      });
    },
  })
  
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    loginMutation.mutate({ email, password });
  }
  // const handleSignIn = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault();
  //   setLoading(true);
    
  //   const formData = new FormData(e.currentTarget);
    
  //   const submitData = new FormData();
  //   submitData.append('email', formData.get('email') as string);
  //   submitData.append('password', formData.get('password') as string);
    
  //   try {
  //     const result = await login(submitData);
      
  //     if (result?.error) {
  //       setSnackbar({
  //         open: true,
  //         message: result.error,
  //         severity: 'error'
  //       });
  //       setLoading(false);
  //     }
  //     // If successful, login action will redirect, so component will unmount
  //   } catch (error: any) {
  //     // Redirect throws NEXT_REDIRECT error, which is expected
  //     // If it's not a redirect, it's a real error
  //     if (error?.digest?.startsWith('NEXT_REDIRECT')) {
  //       // Redirect is happening, component will unmount
  //       console.log('[SIGNIN] Redirect occurred');
  //     } else {
  //       setSnackbar({
  //         open: true,
  //         message: 'An error occurred while signing in',
  //         severity: 'error'
  //       });
  //       setLoading(false);
  //     }
  //   }
  // }, []);
  
  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  const renderForm = (
    <Box
      component="form"
      onSubmit={handleSignIn}
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        flexDirection: 'column',
      }}
    >
      <TextField
        fullWidth
        name="email"
        label="Email address"
        defaultValue="hello@gmail.com"
        sx={{ mb: 3 }}
        slotProps={{
          inputLabel: { shrink: true },
        }}
      />

      <Link variant="body2" color="inherit" sx={{ mb: 1.5 }}>
        Forgot password?
      </Link>

      <TextField
        fullWidth
        name="password"
        label="Password"
        defaultValue="@demo1234"
        type={showPassword ? 'text' : 'password'}
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

      <Button
        fullWidth
        size="large"
        type="submit"
        color="inherit"
        variant="contained"
        disabled={loginMutation.isPending}
        startIcon={loginMutation.isPending ? <CircularProgress size={20} color="inherit" /> : null}
      >
        {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
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
        <Typography variant="h5">Sign in</Typography>
    
      </Box>
      {renderForm}
      <Divider sx={{ my: 3, '&::before, &::after': { borderTopStyle: 'dashed' } }}>
        <Typography
          variant="overline"
          sx={{ color: 'text.secondary', fontWeight: 'fontWeightMedium' }}
        >
          OR
        </Typography>
      </Divider>
      <Box
        sx={{
          gap: 1,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <IconButton color="inherit">
          <Iconify width={22} icon="socials:google" />
        </IconButton>
        <IconButton color="inherit">
          <Iconify width={22} icon="socials:github" />
        </IconButton>
        <IconButton color="inherit">
          <Iconify width={22} icon="socials:twitter" />
        </IconButton>
      </Box>
      
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
