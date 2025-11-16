'use server';

import { NextResponse } from 'next/server';

import { createClient } from 'src/utils/supabase/server';
import { getCurrentUserRole } from 'src/utils/get-user-role';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ userId: null, role: null }, { status: 401 });
    }

    const role = await getCurrentUserRole();
    
    return NextResponse.json({ 
      userId: user.id,
      role 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch user role' }, { status: 500 });
  }
}

