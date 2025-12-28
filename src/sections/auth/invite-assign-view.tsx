'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha } from '@mui/material/styles';

import { useRouter } from '@/routes/hooks';
import { acceptInvite } from '@/actions/acceptInvite';
import { Iconify } from '@/components/iconify';

// ----------------------------------------------------------------------

type InviteAssignViewProps = {
  token: string;
};

export function InviteAssignView({ token }: InviteAssignViewProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const assignClub = async () => {
      try {
        // Ensure minimum display time so users see the assignment process
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
      }
    };

    if (token) {
      assignClub();
    }
  }, [token, router]);

  if (error) {
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
          <Stack spacing={3} alignItems="center">
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
                color: 'error.main',
              }}
            >
              <Iconify icon="solar:close-circle-bold" width={40} />
            </Box>
            <Typography variant="h5">Assignment Failed</Typography>
            <Alert severity="error" sx={{ width: '100%' }}>
              {error}
            </Alert>
          </Stack>
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
        bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
      }}
    >
      <Card sx={{ maxWidth: 480, width: '100%', p: 5 }}>
        <Stack spacing={4} alignItems="center">
          {/* Animated Icon */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              color: 'primary.main',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16),
                animation: 'pulse 2s ease-in-out infinite',
              },
              '@keyframes pulse': {
                '0%': {
                  transform: 'scale(1)',
                  opacity: 1,
                },
                '50%': {
                  transform: 'scale(1.3)',
                  opacity: 0,
                },
                '100%': {
                  transform: 'scale(1)',
                  opacity: 0,
                },
              },
            }}
          >
            <Iconify icon="solar:users-group-rounded-bold-duotone" width={48} />
          </Box>

          {/* Loading Spinner */}
          <CircularProgress size={40} />

          {/* Text */}
          <Stack spacing={1} alignItems="center">
            <Typography variant="h5">Assigning Club to You</Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Please wait while we add you to the club<Box component="span" className="loading-dots" />
            </Typography>
          </Stack>
        </Stack>
      </Card>
    </Box>
  );
}

