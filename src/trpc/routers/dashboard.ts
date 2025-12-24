import { TRPCError } from '@trpc/server';
import { prisma } from '@/lib/prisma';
import { adminProcedure, createTRPCRouter } from '../init';

export const dashboardRouter = createTRPCRouter({
  getStats: adminProcedure.query(async ({ ctx }) => {
    try {
      // ctx.user, ctx.role, and ctx.clubIds are already fetched in context
      const { clubIds } = ctx;

      if (clubIds.length === 0) {
        return {
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
        };
      }

      // Get total users (students in clubs)
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

      // Calculate attendance rate
      const totalAttendance = attendanceDistribution.present + 
                             attendanceDistribution.absent;
      const attendanceRate = totalAttendance > 0
        ? (attendanceDistribution.present / totalAttendance) * 100
        : 0;

      // Get weekly attendance comparison (last 8 weeks)
      const eightWeeksAgo = new Date();
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
      
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

      const weeklyAttendance = Array.from(weeklyMap.entries()).map(([week, data]) => ({
        week,
        present: data.present,
        absent: data.absent,
      }));

      // Get historical data for stat cards (last 8 months)
      const eightMonthsAgo = new Date();
      eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 8);

      const months = [];
      for (let i = 7; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push(date.toISOString().slice(0, 7)); // YYYY-MM format
      }

      // Users trend
      const usersTrend = await Promise.all(months.map(async (month) => {
        const monthDate = new Date(month + '-01');
        const endOfMonth = new Date(monthDate);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
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

      // Sessions trend
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

      // Clubs trend
      const clubsTrend = await Promise.all(months.map(async (month) => {
        const monthDate = new Date(month + '-01');
        const endOfMonth = new Date(monthDate);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
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

      // Attendance rate trend
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

      return {
        totalUsers,
        activeSessions,
        attendanceRate: Math.round(attendanceRate * 10) / 10,
        totalClubs,
        attendanceDistribution,
        weeklyAttendance,
        trends: {
          users: usersTrend,
          sessions: sessionsTrend,
          clubs: clubsTrend,
          attendanceRate: attendanceRateTrend,
        },
      };
    } catch (error: any) {
      console.error('[DASHBOARD_STATS] Error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error?.message || 'Failed to fetch dashboard statistics',
      });
    }
  }),
});

