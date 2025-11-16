import { NextResponse } from 'next/server';

import { prisma } from 'src/lib/prisma';
import { createClient } from 'src/utils/supabase/server';
import { requireRole } from 'src/utils/get-user-role';

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

    const dbUser = await prisma.user.findUnique({
      where: { auth_user_id: user.id },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's club IDs
    let clubIds: bigint[] = [];
    if (roleCheck.role === 'super_admin') {
      const allClubs = await prisma.$queryRaw<Array<{ id: bigint }>>`
        SELECT id FROM clubs
      `;
      clubIds = allClubs.map(c => c.id);
    } else {
      const clubLeader = await prisma.$queryRaw<Array<{ club_id: bigint }>>`
        SELECT club_id FROM club_leaders WHERE user_id = ${dbUser.id}::bigint
      `;
      clubIds = clubLeader.map(c => c.club_id);
    }

    if (clubIds.length === 0) {
      return NextResponse.json([]);
    }

    // Get sessions that don't have any attendance records
    const sessionsWithoutAttendance = await prisma.$queryRaw<Array<{
      id: bigint;
      club_id: bigint;
      notes: string;
      date: Date;
    }>>`
      SELECT s.id, s.club_id, s.notes, s.date
      FROM sessions s
      WHERE s.club_id = ANY(${clubIds}::bigint[])
        AND NOT EXISTS (
          SELECT 1 FROM attendance a WHERE a.session_id = s.id
        )
      ORDER BY s.date DESC
    `;

    // Get club names for each session
    const sessionsWithClubNames = await Promise.all(
      sessionsWithoutAttendance.map(async (session) => {
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
    console.error('[SESSIONS_WITHOUT_ATTENDANCE_API] Error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch sessions' }, { status: 500 });
  }
}

