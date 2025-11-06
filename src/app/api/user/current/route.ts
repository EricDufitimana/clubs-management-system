'use server';
import { NextResponse } from 'next/server';
import { prisma } from 'src/lib/prisma';
import { createClient } from 'src/utils/supabase/server';
import { getAvatarUrl } from 'src/utils/get-avatar';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Find the user in the database
    const dbUser = await prisma.user.findUnique({
      where: { auth_user_id: user.id }
    });

    if (!dbUser) {
      // Return auth user data if not in database
      return NextResponse.json({
        id: user.id,
        email: user.email || null,
        first_name: user.user_metadata?.first_name || null,
        last_name: user.user_metadata?.last_name || null,
        avatarUrl: null,
      });
    }

    // Return database user data with avatar
    return NextResponse.json({
      id: dbUser.id.toString(),
      email: user.email || null,
      first_name: dbUser.first_name,
      last_name: dbUser.last_name,
      avatarUrl: getAvatarUrl(undefined, dbUser.id),
    });
  } catch (error) {
    console.error('[GET_CURRENT_USER] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}


