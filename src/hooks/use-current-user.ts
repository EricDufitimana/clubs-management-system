'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '../trpc/client';

type CurrentUser = {
  id: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export function useCurrentUser() {
  const trpc = useTRPC();
  const { data: userData, isLoading, refetch } = useQuery(trpc.auth.getUserProfile.queryOptions());

  const user = useMemo((): CurrentUser => {
    if (!userData) {
      return {
        id: null,
        email: null,
        firstName: null,
        lastName: null,
        displayName: null,
        avatarUrl: null,
      };
    }

    return {
      id: userData.id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      displayName: userData.first_name && userData.last_name
        ? `${userData.first_name} ${userData.last_name}`
        : userData.email?.split('@')[0] || null,
      avatarUrl: userData.avatarUrl,
    };
  }, [userData]);

  return { user, loading: isLoading, refetch };
}


