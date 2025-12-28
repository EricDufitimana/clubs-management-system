'use client';

import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { DashboardContent } from '@/layouts/dashboard';

import { Iconify } from '@/components/iconify';
import { useTRPC } from '@/trpc/client';

import { AnalyticsCurrentVisits } from '../analytics-current-visits';
import { AnalyticsWebsiteVisits } from '../analytics-website-visits';
import { AnalyticsWidgetSummary } from '../analytics-widget-summary';

// ----------------------------------------------------------------------

type DashboardStats = {
  totalUsers: number;
  activeSessions: number;
  attendanceRate: number;
  totalClubs: number;
  attendanceDistribution: {
    present: number;
    absent: number;
    excused: number;
  };
  weeklyAttendance: Array<{
    week: string;
    present: number;
    absent: number;
  }>;
  trends: {
    users: number[];
    sessions: number[];
    clubs: number[];
    attendanceRate: number[];
  };
};

export function OverviewAnalyticsView() {
  const trpc = useTRPC();
  const { data: stats, isLoading: loading } = useQuery(trpc.dashboard.getStats.queryOptions());

  // Calculate percentage change for stat cards
  const calculatePercentChange = (current: number, trend: number[]): number => {
    if (trend.length < 2 || trend[trend.length - 2] === 0) return 0;
    const previous = trend[trend.length - 2];
    const change = ((current - previous) / previous) * 100;
    return Math.round(change * 10) / 10;
  };

  // Format month labels for charts
  const formatMonthLabels = (months: string[]): string[] => months.map((month) => {
      const date = new Date(month + '-01');
      return date.toLocaleDateString('en-US', { month: 'short' });
    });

  if (loading) {
    return (
      <DashboardContent maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  if (!stats) {
    return (
      <DashboardContent maxWidth="xl">
        <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
          Hi, Welcome back 👋
        </Typography>
        <Typography color="text.secondary">No data available</Typography>
      </DashboardContent>
    );
  }

  // Generate month categories for trend charts (last 8 months)
  const monthCategories = [];
  for (let i = 7; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    monthCategories.push(date.toISOString().slice(0, 7));
  }

  // Generate week categories for weekly attendance (last 8 weeks)
  const weeklyAttendanceCategories = stats.weeklyAttendance.length > 0
    ? stats.weeklyAttendance.map((item) => {
        const weekStart = new Date(item.week); // Already Monday from PostgreSQL DATE_TRUNC
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6); // End of week (Sunday)
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      })
    : [];

  const weeklyAttendanceData = stats.weeklyAttendance.length > 0
    ? {
        present: stats.weeklyAttendance.map((item) => item.present),
        absent: stats.weeklyAttendance.map((item) => item.absent),
      }
    : {
        present: [],
        absent: [],
      };

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Hi, Welcome back 👋
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Total Users"
            percent={calculatePercentChange(stats.totalUsers, stats.trends.users)}
            total={stats.totalUsers}
            icon={<Iconify icon="solar:users-group-rounded-bold-duotone" width={48} />}
            chart={{
              categories: formatMonthLabels(monthCategories),
              series: stats.trends.users,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Active Sessions"
            percent={calculatePercentChange(stats.activeSessions, stats.trends.sessions)}
            total={stats.activeSessions}
            color="secondary"
            icon={<Iconify icon="solar:calendar-mark-bold-duotone" width={48} />}
            chart={{
              categories: formatMonthLabels(monthCategories),
              series: stats.trends.sessions,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Attendance Rate"
            percent={calculatePercentChange(stats.attendanceRate, stats.trends.attendanceRate)}
            total={stats.attendanceRate}
            color="warning"
            icon={<Iconify icon="solar:clipboard-check-bold" width={48} />}
            chart={{
              categories: formatMonthLabels(monthCategories),
              series: stats.trends.attendanceRate,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Total Clubs"
            percent={calculatePercentChange(stats.totalClubs, stats.trends.clubs)}
            total={stats.totalClubs}
            color="error"
            icon={<Iconify icon="solar:star-bold-duotone" width={48} />}
            chart={{
              categories: formatMonthLabels(monthCategories),
              series: stats.trends.clubs,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <AnalyticsCurrentVisits
            title="Attendance Distribution"
            chart={{
              series: [
                { label: 'Present', value: stats.attendanceDistribution.present },
                { label: 'Absent', value: stats.attendanceDistribution.absent },
                { label: 'Excused', value: stats.attendanceDistribution.excused },
              ],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 8 }}>
          <AnalyticsWebsiteVisits
            title="Attendance Overview"
            subheader="Weekly attendance comparison"
            chart={{
              categories: weeklyAttendanceCategories,
              series: [
                { name: 'Present', data: weeklyAttendanceData.present },
                { name: 'Absent', data: weeklyAttendanceData.absent },
              ],
            }}
          />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
