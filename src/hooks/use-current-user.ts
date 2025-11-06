'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '../utils/supabase/client';

type CurrentUser = {
  id: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
};

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser>({
    id: null,
    email: null,
    firstName: null,
    lastName: null,
    displayName: null,
    avatarUrl: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        setUser({
          id: null,
          email: null,
          firstName: null,
          lastName: null,
          displayName: null,
          avatarUrl: null,
        });
        setLoading(false);
        return;
      }

      // Fetch user details from database
      const response = await fetch('/api/user/current');
      if (response.ok) {
        const userData = await response.json();
        setUser({
          id: userData.id || authUser.id,
          email: userData.email || authUser.email || null,
          firstName: userData.first_name || null,
          lastName: userData.last_name || null,
          displayName: userData.first_name && userData.last_name 
            ? `${userData.first_name} ${userData.last_name}` 
            : authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || null,
          avatarUrl: userData.avatarUrl || null,
        });
      } else {
        // Fallback to auth user metadata
        setUser({
          id: authUser.id,
          email: authUser.email || null,
          firstName: authUser.user_metadata?.first_name || null,
          lastName: authUser.user_metadata?.last_name || null,
          displayName: authUser.user_metadata?.display_name || `${authUser.user_metadata?.first_name || ''} ${authUser.user_metadata?.last_name || ''}`.trim() || authUser.email?.split('@')[0] || null,
          avatarUrl: authUser.user_metadata?.avatar_url || null,
        });
      }
    } catch (error) {
      console.error('[USE_CURRENT_USER] Error fetching user:', error);
      setUser({
        id: null,
        email: null,
        firstName: null,
        lastName: null,
        displayName: null,
        avatarUrl: null,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return { user, loading, refetch: fetchUserData };
}


