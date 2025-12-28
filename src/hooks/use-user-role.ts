'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/client';

type UserRole = 'admin' | 'super_admin' | null;

type UseUserRoleReturn = {
  userId: string | null;
  role: UserRole;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  hasAccess: (allowedRoles: ('admin' | 'super_admin')[]) => boolean;
};

export function useUserRole(): UseUserRoleReturn {
  const trpc = useTRPC();
  
  // Get user from tRPC context (no additional DB queries)
  const { data, isLoading } = useQuery({
    ...trpc.auth.getCurrentUser.queryOptions(),
  });

  const userId = data?.userId || null;
  const role = data?.role || null;
  const isAdmin = role === 'admin';
  const isSuperAdmin = role === 'super_admin';
  
  const hasAccess = (allowedRoles: ('admin' | 'super_admin')[]): boolean => {
    if (!role) return false;
    return allowedRoles.includes(role);
  };

  return {
    userId,
    role,
    isLoading,
    isAdmin,
    isSuperAdmin,
    hasAccess,
  };
}

