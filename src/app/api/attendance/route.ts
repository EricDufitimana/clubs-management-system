import { NextResponse } from 'next/server';

import { prisma } from 'src/lib/prisma';
import { createClient } from 'src/utils/supabase/server';
import { requireRole } from 'src/utils/get-user-role';
import { getAvatarUrl } from 'src/utils/get-avatar';

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

    // Fetch attendance records with joins to get student and session info
    const attendanceRecords = await prisma.$queryRaw<Array<{
      id: bigint;
      session_id: bigint;
      student_id: bigint;
      attendance_status: string;
      created_at: Date;
      student_first_name: string;
      student_last_name: string;
      student_gender: string | null;
      session_date: Date;
      session_notes: string;
      club_name: string;
    }>>`
      SELECT 
        a.id,
        a.session_id,
        a.student_id,
        a.attendance_status,
        a.created_at,
        s.first_name as student_first_name,
        s.last_name as student_last_name,
        s.gender as student_gender,
        sess.date as session_date,
        sess.notes as session_notes,
        c.club_name
      FROM attendance a
      INNER JOIN students s ON a.student_id = s.id
      INNER JOIN sessions sess ON a.session_id = sess.id
      INNER JOIN clubs c ON sess.club_id = c.id
      WHERE sess.club_id = ANY(${clubIds}::bigint[])
      ORDER BY sess.date DESC, s.last_name ASC, s.first_name ASC
    `;

    // Serialize the data
    const serializedRecords = attendanceRecords.map((record) => {
      const avatarUrl = getAvatarUrl(
        record.student_gender as 'male' | 'female' | null | undefined,
        record.student_id
      );
      
      return {
        id: record.id.toString(),
        student_id: record.student_id.toString(),
        student_name: `${record.student_first_name} ${record.student_last_name}`,
        session_id: record.session_id.toString(),
        session_date: record.session_date.toISOString(),
        session_name: record.session_notes || `Session on ${record.session_date.toISOString().split('T')[0]}`,
        status: record.attendance_status as 'present' | 'absent' | 'excused',
        club_name: record.club_name,
        avatarUrl,
      };
    });

    return NextResponse.json(serializedRecords);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch attendance records' }, { status: 500 });
  }
}
