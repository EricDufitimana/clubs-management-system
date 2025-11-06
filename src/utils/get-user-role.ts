'use server';

import { createClient } from './supabase/server';
import { prisma } from '../lib/prisma';

export async function getCurrentUserRole(): Promise<'admin' | 'super_admin' | null> {
  try {
    console.log('[GET_USER_ROLE] Starting...');
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('[GET_USER_ROLE] Auth user ID:', user?.id, 'Error:', authError?.message);
    
    if (authError || !user) {
      console.log('[GET_USER_ROLE] No auth user, returning null');
      return null;
    }

    // Add retry logic for connection issues
    let dbUser = null;
    let retries = 3;
    while (retries > 0) {
      try {
        console.log('[GET_USER_ROLE] Looking up user in database, auth_user_id:', user.id);
        dbUser = await prisma.user.findUnique({
          where: { auth_user_id: user.id },
          select: { role: true }
        });
        console.log('[GET_USER_ROLE] Database user found:', dbUser);
        break; // Success, exit retry loop
      } catch (error: any) {
        console.error('[GET_USER_ROLE] Database error (retry', 4 - retries, 'of 3):', error.message);
        retries--;
        if (retries === 0 || !error.message?.includes('Can\'t reach database server')) {
          throw error; // Re-throw if not a connection error or out of retries
        }
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
      }
    }

    if (!dbUser) {
      console.log('[GET_USER_ROLE] User not found in database, returning null');
      return null;
    }

    console.log('[GET_USER_ROLE] Returning role:', dbUser.role);
    return dbUser.role as 'admin' | 'super_admin';
  } catch (error) {
    console.error('[GET_USER_ROLE] Error:', error);
    return null;
  }
}

export async function requireRole(allowedRoles: ('admin' | 'super_admin')[]): Promise<{ role: 'admin' | 'super_admin' } | { error: string }> {
  const role = await getCurrentUserRole();
  
  if (!role) {
    return { error: 'You must be logged in to access this page' };
  }
  
  if (!allowedRoles.includes(role)) {
    return { error: 'You do not have permission to access this page' };
  }
  
  return { role };
}

