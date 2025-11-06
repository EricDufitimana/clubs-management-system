'use client';

import { useState, useEffect } from 'react';

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
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        console.log('[USE_USER_ROLE] Fetching user role...');
        const response = await fetch('/api/user/role');
        
        console.log('[USE_USER_ROLE] Response status:', response.status);
        
        if (response.status === 401) {
          // Not authenticated
          console.log('[USE_USER_ROLE] Not authenticated (401)');
          setUserId(null);
          setRole(null);
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[USE_USER_ROLE] Response not OK:', response.status, errorText);
          throw new Error(`Failed to fetch user role: ${response.status}`);
        }

        const data = await response.json();
        console.log('[USE_USER_ROLE] User role data:', data);
        setUserId(data.userId);
        setRole(data.role);
      } catch (error) {
        console.error('[USE_USER_ROLE] Error fetching role:', error);
        setUserId(null);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserRole();
  }, []);

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

