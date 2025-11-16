'use server';

import { redirect } from 'next/navigation';

import { createClient } from '../utils/supabase/server';

export async function logout() {
  const supabase = await createClient();
  
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('[LOGOUT] Error signing out:', error);
      return { error: error.message };
    }
    
    // Redirect to sign-in page
    redirect('/sign-in');
  } catch (error: any) {
    // Redirect throws a special error that should be re-thrown
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    console.error('[LOGOUT] Exception:', error);
    return { error: 'Failed to logout' };
  }
}

