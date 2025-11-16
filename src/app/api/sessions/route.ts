import { NextResponse } from 'next/server';

import { requireRole } from 'src/utils/get-user-role';
import { createClient } from 'src/utils/supabase/server';

import { prisma } from 'src/lib/prisma';

// ----------------------------------------------------------------------

export async function GET(request: Request) {
  try {
    const roleCheck = await requireRole(['admin', 'super_admin']);
    if ('error' in roleCheck) {
      return NextResponse.json({ error: roleCheck.error }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's club ID
    const dbUser = await prisma.user.findUnique({
      where: { auth_user_id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // For super_admin, get all sessions; for admin, get only their club's sessions
    let sessions;
    if (roleCheck.role === 'super_admin') {
      sessions = await prisma.$queryRaw<Array<{
        id: bigint;
        club_id: bigint;
        notes: string;
        date: Date;
      }>>`
        SELECT s.id, s.club_id, s.notes, s.date
        FROM sessions s
        ORDER BY s.date DESC
      `;
    } else {
      // Get club ID for admin
      const clubLeader = await prisma.$queryRaw<Array<{ club_id: bigint }>>`
        SELECT club_id FROM club_leaders WHERE user_id = ${dbUser.id}::bigint LIMIT 1
      `;

      if (!clubLeader || clubLeader.length === 0) {
        return NextResponse.json([]);
      }

      const clubId = clubLeader[0].club_id;

      sessions = await prisma.$queryRaw<Array<{
        id: bigint;
        club_id: bigint;
        notes: string;
        date: Date;
      }>>`
        SELECT s.id, s.club_id, s.notes, s.date
        FROM sessions s
        WHERE s.club_id = ${clubId}::bigint
        ORDER BY s.date DESC
      `;
    }

    // Get club names for each session
    const sessionsWithClubNames = await Promise.all(
      sessions.map(async (session) => {
        const club = await prisma.club.findUnique({
          where: { id: session.club_id },
          select: { club_name: true },
        });

        return {
          id: session.id.toString(),
          club_id: session.club_id.toString(),
          notes: session.notes,
          date: session.date.toISOString(),
          club_name: club?.club_name || null,
        };
      })
    );

    return NextResponse.json(sessionsWithClubNames);
  } catch (error: any) {
    console.error('[SESSIONS_API] Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch sessions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const roleCheck = await requireRole(['admin', 'super_admin']);
    if ('error' in roleCheck) {
      return NextResponse.json({ error: roleCheck.error }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { club_id, notes, date } = body;

    if (!club_id || !notes || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify admin has access to this club
    if (roleCheck.role === 'admin') {
      const dbUser = await prisma.user.findUnique({
        where: { auth_user_id: user.id },
      });

      if (!dbUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const clubLeader = await prisma.$queryRaw<Array<{ club_id: bigint }>>`
        SELECT club_id FROM club_leaders WHERE user_id = ${dbUser.id}::bigint AND club_id = ${BigInt(club_id)}::bigint LIMIT 1
      `;

      if (!clubLeader || clubLeader.length === 0) {
        return NextResponse.json({ error: 'Unauthorized to create session for this club' }, { status: 403 });
      }
    }

    const session = await prisma.session.create({
      data: {
        club_id: BigInt(club_id),
        notes,
        date: new Date(date),
      },
    });

    return NextResponse.json({
      id: session.id.toString(),
      club_id: session.club_id.toString(),
      notes: session.notes,
      date: session.date.toISOString(),
    });
  } catch (error: any) {
    console.error('[SESSIONS_API] Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create session' }, { status: 500 });
  }
}

