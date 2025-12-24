import { TRPCError } from '@trpc/server';
import { prisma } from '@/lib/prisma';
import { adminProcedure, superAdminProcedure, createTRPCRouter } from '../init';

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

  getSuperAdminReports: superAdminProcedure.query(async () => {
    try {
      // Get all active clubs
      const clubs = await prisma.$queryRaw<Array<{ id: bigint; club_name: string }>>`
        SELECT id, club_name
        FROM clubs
        WHERE status = 'active'
      `;

      const clubIds = clubs.map((c) => c.id);

      if (clubIds.length === 0) {
        return {
          clubs: [],
          topAttendanceClubs: [],
          topMemberClubs: [],
          monthlyAttendanceTrends: [],
          totalAttendanceComparison: { thisMonth: 0, lastMonth: 0 },
          newMembersOverTime: [],
          memberActivityBreakdown: { active: 0, inactive: 0 },
          topActiveClubs: [],
          leastActiveClubs: [],
          attendanceByWeekday: [],
          sessionAnalytics: {
            totalSessions: 0,
            sessionsLast30Days: 0,
            avgAttendancePerSession: 0,
          },
        };
      }

      // Clubs performance (attendance + sessions)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const clubPerformanceRaw = await prisma.$queryRaw<Array<{
        club_id: bigint;
        club_name: string;
        present: bigint;
        absent: bigint;
        sessions: bigint;
      }>>`
        SELECT 
          sess.club_id,
          c.club_name,
          COUNT(*) FILTER (WHERE a.attendance_status = 'present') AS present,
          COUNT(*) FILTER (WHERE a.attendance_status = 'absent') AS absent,
          COUNT(DISTINCT sess.id) AS sessions
        FROM attendance a
        INNER JOIN sessions sess ON a.session_id = sess.id
        INNER JOIN clubs c ON sess.club_id = c.id
        WHERE sess.club_id = ANY(${clubIds}::bigint[])
          AND sess.date >= ${ninetyDaysAgo}::timestamptz
        GROUP BY sess.club_id, c.club_name
      `;

      const clubsPerformance = clubPerformanceRaw.map((row) => {
        const present = Number(row.present || 0);
        const absent = Number(row.absent || 0);
        const totalAttendance = present + absent;
        const sessions = Number(row.sessions || 0);
        const attendanceRate = totalAttendance > 0 ? (present / totalAttendance) * 100 : 0;
        const activityScore = totalAttendance;

        return {
          clubId: row.club_id.toString(),
          clubName: row.club_name,
          present,
          absent,
          sessions,
          attendanceRate,
          activityScore,
        };
      });

      // Members per club
      const memberCountsRaw = await prisma.$queryRaw<Array<{ club_id: bigint; members: bigint }>>`
        SELECT cm.club_id, COUNT(DISTINCT cm.student_id) AS members
        FROM "club-members" cm
        WHERE cm.club_id = ANY(${clubIds}::bigint[])
          AND cm.membership_status = 'active'
          AND cm.student_id IS NOT NULL
        GROUP BY cm.club_id
      `;

      const memberCountsMap = new Map<string, number>();
      memberCountsRaw.forEach((row) => {
        memberCountsMap.set(row.club_id.toString(), Number(row.members || 0));
      });

      const clubsWithMembers = clubsPerformance.map((club) => ({
        ...club,
        members: memberCountsMap.get(club.clubId) ?? 0,
      }));

      // Top clubs by attendance & members
      const topAttendanceClubs = [...clubsWithMembers]
        .sort((a, b) => b.attendanceRate - a.attendanceRate)
        .slice(0, 5);

      const topMemberClubs = [...clubsWithMembers]
        .sort((a, b) => b.members - a.members)
        .slice(0, 5);

      const topActiveClubs = [...clubsWithMembers]
        .sort((a, b) => b.activityScore - a.activityScore)
        .slice(0, 5);

      const leastActiveClubs = [...clubsWithMembers]
        .sort((a, b) => a.activityScore - b.activityScore)
        .slice(0, 5);

      // Monthly attendance trends
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
      twelveMonthsAgo.setDate(1);

      const monthlyAttendanceRaw = await prisma.$queryRaw<
        Array<{ month: string; status: string; count: bigint }>
      >`
        SELECT 
          TO_CHAR(sess.date, 'YYYY-MM') AS month,
          a.attendance_status AS status,
          COUNT(*) AS count
        FROM attendance a
        INNER JOIN sessions sess ON a.session_id = sess.id
        WHERE sess.club_id = ANY(${clubIds}::bigint[])
          AND sess.date >= ${twelveMonthsAgo}::timestamptz
          AND a.attendance_status IN ('present', 'absent')
        GROUP BY TO_CHAR(sess.date, 'YYYY-MM'), a.attendance_status
        ORDER BY month ASC
      `;

      const monthlyAttendanceMap = new Map<string, { present: number; absent: number }>();
      monthlyAttendanceRaw.forEach((row) => {
        const month = row.month;
        const status = row.status.toLowerCase();
        const count = Number(row.count || 0);

        if (!monthlyAttendanceMap.has(month)) {
          monthlyAttendanceMap.set(month, { present: 0, absent: 0 });
        }
        const monthData = monthlyAttendanceMap.get(month)!;
        if (status === 'present') {
          monthData.present = count;
        } else if (status === 'absent') {
          monthData.absent = count;
        }
      });

      const monthlyAttendanceTrends = Array.from(monthlyAttendanceMap.entries()).map(
        ([month, data]) => ({
          month,
          present: data.present,
          absent: data.absent,
        })
      );

      // Total attendance comparison (this month vs last month)
      const now = new Date();
      const thisMonthKey = now.toISOString().slice(0, 7);
      const lastMonthDate = new Date(now);
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
      const lastMonthKey = lastMonthDate.toISOString().slice(0, 7);

      const getMonthlyTotal = (key: string) => {
        const entry = monthlyAttendanceMap.get(key);
        if (!entry) return 0;
        return entry.present + entry.absent;
      };

      const totalAttendanceComparison = {
        thisMonth: getMonthlyTotal(thisMonthKey),
        lastMonth: getMonthlyTotal(lastMonthKey),
      };

      // New members added over time (last 12 months)
      const newMembersRaw = await prisma.$queryRaw<
        Array<{ month: string; count: bigint }>
      >`
        SELECT 
          TO_CHAR(cm.joined_at, 'YYYY-MM') AS month,
          COUNT(DISTINCT cm.student_id) AS count
        FROM "club-members" cm
        WHERE cm.club_id = ANY(${clubIds}::bigint[])
          AND cm.joined_at >= ${twelveMonthsAgo}::timestamptz
          AND cm.student_id IS NOT NULL
        GROUP BY TO_CHAR(cm.joined_at, 'YYYY-MM')
        ORDER BY month ASC
      `;

      const newMembersOverTime = newMembersRaw.map((row) => ({
        month: row.month,
        count: Number(row.count || 0),
      }));

      // Member activity breakdown (active vs inactive)
      const memberActivityRaw = await prisma.$queryRaw<
        Array<{ membership_status: string; count: bigint }>
      >`
        SELECT 
          cm.membership_status,
          COUNT(DISTINCT cm.student_id) AS count
        FROM "club-members" cm
        WHERE cm.club_id = ANY(${clubIds}::bigint[])
          AND cm.student_id IS NOT NULL
        GROUP BY cm.membership_status
      `;

      let activeCount = 0;
      let inactiveCount = 0;
      memberActivityRaw.forEach((row) => {
        const status = row.membership_status.toLowerCase();
        const count = Number(row.count || 0);
        if (status === 'active') {
          activeCount += count;
        } else {
          inactiveCount += count;
        }
      });

      const memberActivityBreakdown = {
        active: activeCount,
        inactive: inactiveCount,
      };

      // Attendance by weekday (last 8 weeks)
      const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const eightWeeksAgo = new Date();
      eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

      const attendanceByWeekdayRaw = await prisma.$queryRaw<
        Array<{ dow: number; present: bigint; absent: bigint }>
      >`
        SELECT 
          EXTRACT(DOW FROM sess.date)::int AS dow,
          COUNT(*) FILTER (WHERE a.attendance_status = 'present') AS present,
          COUNT(*) FILTER (WHERE a.attendance_status = 'absent') AS absent
        FROM attendance a
        INNER JOIN sessions sess ON a.session_id = sess.id
        WHERE sess.club_id = ANY(${clubIds}::bigint[])
          AND sess.date >= ${eightWeeksAgo}::timestamptz
        GROUP BY EXTRACT(DOW FROM sess.date)
        ORDER BY dow ASC
      `;

      const attendanceByWeekday = attendanceByWeekdayRaw.map((row) => ({
        weekday: WEEKDAY_LABELS[row.dow] ?? String(row.dow),
        present: Number(row.present || 0),
        absent: Number(row.absent || 0),
      }));

      // Session analytics
      const sessionCountsRaw = await prisma.$queryRaw<
        Array<{ total_sessions: bigint; sessions_last_30_days: bigint; total_attendance: bigint }>
      >`
        SELECT
          COUNT(DISTINCT sess.id) AS total_sessions,
          COUNT(DISTINCT CASE WHEN sess.date >= ${ninetyDaysAgo}::timestamptz THEN sess.id END) AS sessions_last_30_days,
          COUNT(*) AS total_attendance
        FROM sessions sess
        LEFT JOIN attendance a ON a.session_id = sess.id
        WHERE sess.club_id = ANY(${clubIds}::bigint[])
      `;

      const sessionCounts = sessionCountsRaw[0];
      const totalSessions = Number(sessionCounts?.total_sessions || 0);
      const sessionsLast30Days = Number(sessionCounts?.sessions_last_30_days || 0);
      const totalAttendance = Number(sessionCounts?.total_attendance || 0);
      const avgAttendancePerSession =
        totalSessions > 0 ? totalAttendance / totalSessions : 0;

      const sessionAnalytics = {
        totalSessions,
        sessionsLast30Days,
        avgAttendancePerSession: Math.round(avgAttendancePerSession * 10) / 10,
      };

      return {
        clubs: clubsWithMembers,
        topAttendanceClubs,
        topMemberClubs,
        monthlyAttendanceTrends,
        totalAttendanceComparison,
        newMembersOverTime,
        memberActivityBreakdown,
        topActiveClubs,
        leastActiveClubs,
        attendanceByWeekday,
        sessionAnalytics,
      };
    } catch (error: any) {
      console.error('[SUPER_ADMIN_REPORTS] Error:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error?.message || 'Failed to fetch super admin reports',
      });
    }
  }),
});

