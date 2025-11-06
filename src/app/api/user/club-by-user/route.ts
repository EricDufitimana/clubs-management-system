'use server';
import { NextResponse } from 'next/server';
import { prisma } from 'src/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('user_id');
    
    if (!userIdParam) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // Find the user by auth_user_id
    const dbUser = await prisma.user.findUnique({
      where: { auth_user_id: userIdParam }
    });

    if (!dbUser) {
      return NextResponse.json({ club_name: null });
    }

    // Get the club this user is a leader of
    const clubLeader = await prisma.$queryRaw<Array<{
      club_id: bigint;
      club_name: string;
    }>>`
      SELECT c.id as club_id, c.club_name
      FROM club_leaders cl
      JOIN clubs c ON cl.club_id = c.id
      WHERE cl.user_id = ${dbUser.id}::bigint
      LIMIT 1
    `;

    const club = clubLeader.length > 0 ? clubLeader[0] : null;

    return NextResponse.json({ 
      club_name: club?.club_name || null,
      club_id: club ? club.club_id.toString() : null
    });
  } catch (error) {
    console.error('[GET_USER_CLUB_BY_USER] Error:', error);
    return NextResponse.json({ club_name: null }, { status: 500 });
  }
}

