'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { useUserRole } from 'src/hooks/use-user-role';

// ----------------------------------------------------------------------

type RoleGuardProps = {
  children: React.ReactNode;
  allowedRoles: ('admin' | 'super_admin')[];
  redirectTo?: string;
};

export function RoleGuard({ children, allowedRoles, redirectTo }: RoleGuardProps) {
  const router = useRouter();
  const { role, hasAccess, isLoading } = useUserRole();

  // Determine default redirect based on role
  const getDefaultRedirect = () => {
    if (role === 'super_admin') {
      return '/dashboard/super-admin';
    } else if (role === 'admin') {
      return '/dashboard/admin';
    }
    return '/sign-in'; // Redirect to sign-in if no role
  };

  const redirectPath = redirectTo || getDefaultRedirect();

  useEffect(() => {
    // Wait for role to load before checking access
    if (!isLoading && !hasAccess(allowedRoles)) {
      console.log('[ROLE_GUARD] Redirecting - Role:', role, 'Allowed:', allowedRoles, 'Path:', redirectPath);
      router.push(redirectPath);
    }
  }, [role, hasAccess, allowedRoles, redirectPath, router, isLoading]);

  // Show loading state while checking role
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  // Check access after loading is complete
  if (!hasAccess(allowedRoles)) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <Typography variant="h6" color="error">
          Access Denied
        </Typography>
        <Typography variant="body2" color="text.secondary">
          You do not have permission to access this page.
        </Typography>
      </Box>
    );
  }

  return <>{children}</>;
}

