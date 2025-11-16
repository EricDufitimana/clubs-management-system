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
    // For super_admin: Get ALL active clubs (aggregate data across all clubs)
    // For admin: Get only clubs where user is a leader (club-specific data)
    let clubIds: bigint[] = [];
    if (roleCheck.role === 'super_admin') {
      const allClubs = await prisma.$queryRaw<Array<{ id: bigint }>>`
        SELECT id FROM clubs WHERE status = 'active'
      `;
      clubIds = allClubs.map(c => c.id);
    } else {
      const clubLeader = await prisma.$queryRaw<Array<{ club_id: bigint }>>`
        SELECT club_id FROM club_leaders WHERE user_id = ${dbUser.id}::bigint
      `;
      clubIds = clubLeader.map(c => c.club_id);
    }

    if (clubIds.length === 0) {
      return NextResponse.json({
        totalUsers: 0,
        activeSessions: 0,
        attendanceRate: 0,
        totalClubs: 0,
        attendanceDistribution: {
          present: 0,
          absent: 0,
          excused: 0,
        },
        weeklyAttendance: [],
        trends: {
          users: [0, 0, 0, 0, 0, 0, 0, 0],
          sessions: [0, 0, 0, 0, 0, 0, 0, 0],
          clubs: [0, 0, 0, 0, 0, 0, 0, 0],
          attendanceRate: [0, 0, 0, 0, 0, 0, 0, 0],
        },
      });
    }

    // Get total users (students in clubs)
    // For super_admin: Counts distinct students across ALL clubs
    // For admin: Counts distinct students in their club(s) only
    const totalUsersResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(DISTINCT cm.student_id) as count
      FROM "club-members" cm
      WHERE cm.club_id = ANY(${clubIds}::bigint[])
        AND cm.membership_status = 'active'
        AND cm.student_id IS NOT NULL
    `;
    const totalUsers = Number(totalUsersResult[0]?.count || 0);

    // Get active sessions (sessions in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activeSessionsResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count
      FROM sessions s
      WHERE s.club_id = ANY(${clubIds}::bigint[])
        AND s.date >= ${thirtyDaysAgo}::timestamptz
    `;
    const activeSessions = Number(activeSessionsResult[0]?.count || 0);

    // Get total clubs
    const totalClubs = clubIds.length;

    // Get attendance distribution
    // For super_admin: Aggregates attendance across ALL clubs
    // For admin: Aggregates attendance for their club(s) only
    const attendanceDistributionResult = await prisma.$queryRaw<Array<{
      status: string;
      count: bigint;
    }>>`
      SELECT 
        a.attendance_status as status,
        COUNT(*) as count
      FROM attendance a
      INNER JOIN sessions sess ON a.session_id = sess.id
      WHERE sess.club_id = ANY(${clubIds}::bigint[])
      GROUP BY a.attendance_status
    `;

    const attendanceDistribution = {
      present: 0,
      absent: 0,
      excused: 0,
    };

    attendanceDistributionResult.forEach((row) => {
      const status = row.status.toLowerCase();
      const count = Number(row.count);
      if (status === 'present') {
        attendanceDistribution.present = count;
      } else if (status === 'absent') {
        attendanceDistribution.absent = count;
      } else if (status === 'excused') {
        attendanceDistribution.excused = count;
      }
    });

    // Calculate attendance rate (present / (present + absent))
    const totalAttendance = attendanceDistribution.present + 
                           attendanceDistribution.absent;
    const attendanceRate = totalAttendance > 0
      ? (attendanceDistribution.present / totalAttendance) * 100
      : 0;

    // Get weekly attendance comparison (present vs absent) for last 8 weeks
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56); // 8 weeks ago
    
    const weeklyAttendanceResult = await prisma.$queryRaw<Array<{
      week: string;
      status: string;
      count: bigint;
    }>>`
      SELECT 
        TO_CHAR(DATE_TRUNC('week', sess.date), 'YYYY-MM-DD') as week,
        a.attendance_status as status,
        COUNT(*) as count
      FROM attendance a
      INNER JOIN sessions sess ON a.session_id = sess.id
      WHERE sess.club_id = ANY(${clubIds}::bigint[])
        AND sess.date >= ${eightWeeksAgo}::timestamptz
        AND a.attendance_status IN ('present', 'absent')
      GROUP BY DATE_TRUNC('week', sess.date), a.attendance_status
      ORDER BY week ASC
    `;

    // Group by week and status
    const weeklyMap = new Map<string, { present: number; absent: number }>();
    
    weeklyAttendanceResult.forEach((row) => {
      const week = row.week;
      const status = row.status.toLowerCase();
      const count = Number(row.count);
      
      if (!weeklyMap.has(week)) {
        weeklyMap.set(week, { present: 0, absent: 0 });
      }
      
      const weekData = weeklyMap.get(week)!;
      if (status === 'present') {
        weekData.present = count;
      } else if (status === 'absent') {
        weekData.absent = count;
      }
    });

    // Convert to array format for chart
    const weeklyAttendance = Array.from(weeklyMap.entries()).map(([week, data]) => ({
      week,
      present: data.present,
      absent: data.absent,
    }));

    // Get historical data for stat cards (last 8 months)
    const eightMonthsAgo = new Date();
    eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 8);

    // Build month array (last 8 months)
    const months = [];
    for (let i = 7; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(date.toISOString().slice(0, 7)); // YYYY-MM format
    }

    // Users trend (cumulative count of active members up to each month)
    const usersTrend = await Promise.all(months.map(async (month) => {
      const monthDate = new Date(month + '-01');
      const endOfMonth = new Date(monthDate);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0); // Last day of the month
      endOfMonth.setHours(23, 59, 59, 999);
      
      const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT cm.student_id) as count
        FROM "club-members" cm
        WHERE cm.club_id = ANY(${clubIds}::bigint[])
          AND cm.joined_at <= ${endOfMonth}::timestamptz
          AND cm.student_id IS NOT NULL
          AND (cm.left_at IS NULL OR cm.left_at > ${monthDate}::timestamptz)
      `;
      return Number(result[0]?.count || 0);
    }));

    // Sessions trend (monthly count of sessions)
    const sessionsTrendResult = await prisma.$queryRaw<Array<{
      month: string;
      count: bigint;
    }>>`
      SELECT 
        TO_CHAR(s.date, 'YYYY-MM') as month,
        COUNT(*) as count
      FROM sessions s
      WHERE s.club_id = ANY(${clubIds}::bigint[])
        AND s.date >= ${eightMonthsAgo}::timestamptz
      GROUP BY TO_CHAR(s.date, 'YYYY-MM')
      ORDER BY month ASC
    `;

    const sessionsTrend = months.map(month => {
      const found = sessionsTrendResult.find(r => r.month === month);
      return Number(found?.count || 0);
    });

    // Clubs trend (cumulative count up to each month)
    const clubsTrend = await Promise.all(months.map(async (month) => {
      const monthDate = new Date(month + '-01');
      const endOfMonth = new Date(monthDate);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0); // Last day of the month
      endOfMonth.setHours(23, 59, 59, 999);
      
      const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM clubs c
        WHERE c.id = ANY(${clubIds}::bigint[])
          AND c.created_at <= ${endOfMonth}::timestamptz
          AND c.status = 'active'
      `;
      return Number(result[0]?.count || 0);
    }));

    // Attendance rate trend (monthly average)
    const attendanceRateTrendResult = await prisma.$queryRaw<Array<{
      month: string;
      present: bigint;
      total: bigint;
    }>>`
      SELECT 
        TO_CHAR(sess.date, 'YYYY-MM') as month,
        COUNT(CASE WHEN a.attendance_status = 'present' THEN 1 END) as present,
        COUNT(*) as total
      FROM attendance a
      INNER JOIN sessions sess ON a.session_id = sess.id
      WHERE sess.club_id = ANY(${clubIds}::bigint[])
        AND sess.date >= ${eightMonthsAgo}::timestamptz
      GROUP BY TO_CHAR(sess.date, 'YYYY-MM')
      ORDER BY month ASC
    `;

    const attendanceRateTrend = months.map(month => {
      const found = attendanceRateTrendResult.find(r => r.month === month);
      if (found && Number(found.total) > 0) {
        return (Number(found.present) / Number(found.total)) * 100;
      }
      return 0;
    });

    return NextResponse.json({
      totalUsers,
      activeSessions,
      attendanceRate: Math.round(attendanceRate * 10) / 10, // Round to 1 decimal
      totalClubs,
      attendanceDistribution,
      weeklyAttendance,
      trends: {
        users: usersTrend,
        sessions: sessionsTrend,
        clubs: clubsTrend,
        attendanceRate: attendanceRateTrend,
      },
    });
  } catch (error: any) {
    console.error('[DASHBOARD_STATS] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}

