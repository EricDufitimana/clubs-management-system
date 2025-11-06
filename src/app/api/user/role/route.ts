'use server';
import { NextResponse } from 'next/server';
import { getCurrentUserRole } from 'src/utils/get-user-role';
import { createClient } from 'src/utils/supabase/server';

export async function GET() {
  try {
    console.log('[GET_USER_ROLE_API] Starting...');
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('[GET_USER_ROLE_API] Auth user:', user?.id, 'Error:', authError?.message);
    
    if (authError || !user) {
      console.log('[GET_USER_ROLE_API] Not authenticated, returning 401');
      return NextResponse.json({ userId: null, role: null }, { status: 401 });
    }

    console.log('[GET_USER_ROLE_API] Getting user role...');
    const role = await getCurrentUserRole();
    console.log('[GET_USER_ROLE_API] Role:', role);
    
    return NextResponse.json({ 
      userId: user.id,
      role: role 
    });
  } catch (error) {
    console.error('[GET_USER_ROLE_API] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch user role' }, { status: 500 });
  }
}

