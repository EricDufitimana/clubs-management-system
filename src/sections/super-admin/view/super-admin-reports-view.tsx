'use client';

import { useQuery } from '@tanstack/react-query';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

import { DashboardContent } from '@/layouts/dashboard';
import { useTRPC } from '@/trpc/client';

import { Iconify } from '@/components/iconify';
import Link from 'next/link';

import { AnalyticsWidgetSummary } from '@/sections/overview/analytics-widget-summary';
import { AnalyticsWebsiteVisits } from '@/sections/overview/analytics-website-visits';
import { AnalyticsCurrentVisits } from '@/sections/overview/analytics-current-visits';

// ----------------------------------------------------------------------

type ClubPerformance = {
  clubId: string;
  clubName: string;
  present: number;
  absent: number;
  sessions: number;
  attendanceRate: number;
  activityScore: number;
  members: number;
};

type MonthlyAttendancePoint = {
  month: string;
  present: number;
  absent: number;
};

type NewMembersPoint = {
  month: string;
  count: number;
};

type WeekdayAttendancePoint = {
  weekday: string;
  present: number;
  absent: number;
};

type SessionAnalytics = {
  totalSessions: number;
  sessionsLast30Days: number;
  avgAttendancePerSession: number;
};

type ReportsResponse = {
  clubs: ClubPerformance[];
  topAttendanceClubs: ClubPerformance[];
  topMemberClubs: ClubPerformance[];
  monthlyAttendanceTrends: MonthlyAttendancePoint[];
  totalAttendanceComparison: { thisMonth: number; lastMonth: number };
  newMembersOverTime: NewMembersPoint[];
  memberActivityBreakdown: { active: number; inactive: number };
  topActiveClubs: ClubPerformance[];
  leastActiveClubs: ClubPerformance[];
  attendanceByWeekday: WeekdayAttendancePoint[];
  sessionAnalytics: SessionAnalytics;
};

// ----------------------------------------------------------------------

export function SuperAdminReportsView() {
  const trpc = useTRPC();
  const { data, isLoading, isError } = useQuery(trpc.dashboard.getSuperAdminReports.queryOptions());

  if (isLoading) {
    return (
      <DashboardContent maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  if (isError || !data) {
    return (
      <DashboardContent maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 2 }}>
          Reports
        </Typography>
        <Typography color="text.secondary">
          {isError ? 'Failed to load report data.' : 'No report data available.'}
        </Typography>
      </DashboardContent>
    );
  }

  const { 
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
  } = data;

  const totalMembers = memberActivityBreakdown.active + memberActivityBreakdown.inactive;

  const monthlyCategories = monthlyAttendanceTrends.map((m) => m.month);
  const monthlyPresentSeries = monthlyAttendanceTrends.map((m) => m.present);
  const monthlyAbsentSeries = monthlyAttendanceTrends.map((m) => m.absent);

  const newMembersCategories = newMembersOverTime.map((m) => m.month);
  const newMembersSeries = newMembersOverTime.map((m) => m.count);

  const weekdayCategories = attendanceByWeekday.map((d) => d.weekday);
  const weekdayPresentSeries = attendanceByWeekday.map((d) => d.present);
  const weekdayAbsentSeries = attendanceByWeekday.map((d) => d.absent);

  const topAttendanceCategories = topAttendanceClubs.map((c) => c.clubName);
  const topAttendanceSeries = topAttendanceClubs.map((c) => Math.round(c.attendanceRate * 10) / 10);

  const topMembersCategories = topMemberClubs.map((c) => c.clubName);
  const topMembersSeries = topMemberClubs.map((c) => c.members);

  const attendanceChange =
    totalAttendanceComparison.lastMonth > 0
      ? ((totalAttendanceComparison.thisMonth - totalAttendanceComparison.lastMonth) /
          totalAttendanceComparison.lastMonth) *
        100
      : 0;

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ mb: { xs: 3, md: 5 } }}>
        <Typography variant="h4">Reports & Analytics</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          High-level insights into club performance across the platform.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Summary cards */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <AnalyticsWidgetSummary
            title="Total Members"
            total={totalMembers}
            percent={0}
            color="primary"
            icon={<Iconify icon="solar:users-group-rounded-bold-duotone" width={48} />}
            chart={{
              categories: newMembersCategories,
              series: newMembersSeries,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <AnalyticsWidgetSummary
            title="Total Sessions"
            total={sessionAnalytics.totalSessions}
            percent={0}
            color="info"
            icon={<Iconify icon="solar:calendar-mark-bold-duotone" width={48} />}
            chart={{
              categories: monthlyCategories,
              series: monthlyPresentSeries,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <AnalyticsWidgetSummary
            title="Avg Attendance / Session"
            total={sessionAnalytics.avgAttendancePerSession}
            percent={attendanceChange}
            color="success"
            icon={<Iconify icon="solar:chart-square-bold-duotone" width={48} />}
            chart={{
              categories: monthlyCategories,
              series: monthlyPresentSeries,
            }}
          />
        </Grid>

        {/* Multiple Clubs Report Card */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ p: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Box sx={{ mb: 2 }}>
              <Iconify icon="mingcute:group-2-line" width={64} height={64} color="warning.main" />
            </Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Students in Multiple Clubs
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              View students enrolled in more than one club
            </Typography>
            <Button
              component={Link}
              href="/dashboard/super-admin/reports/multiple-clubs"
              variant="contained"
              fullWidth
            >
              View Report
            </Button>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Monthly attendance trends */}
        <Grid size={{ xs: 12, md: 7 }}>
          <AnalyticsWebsiteVisits
            title="Monthly Attendance Trends"
            subheader="Present vs Absent (last 12 months)"
            chart={{
              categories: monthlyCategories,
              series: [
                { name: 'Present', data: monthlyPresentSeries },
                { name: 'Absent', data: monthlyAbsentSeries },
              ],
              options: {
                tooltip: {
                  y: { formatter: (value: number) => `${value} records` },
                },
              },
            }}
          />
        </Grid>

        {/* Member activity breakdown */}
        <Grid size={{ xs: 12, md: 5 }}>
          <AnalyticsCurrentVisits
            title="Member Activity Breakdown"
            subheader="Active vs inactive members"
            chart={{
              series: [
                { label: 'Active', value: memberActivityBreakdown.active },
                { label: 'Inactive', value: memberActivityBreakdown.inactive },
              ],
            }}
          />
        </Grid>

        {/* Top clubs by attendance */}
        <Grid size={{ xs: 12, md: 6 }}>
          <AnalyticsWebsiteVisits
            title="Clubs with Highest Attendance Rates"
            subheader="Top clubs by percentage of present records (last 90 days)"
            chart={{
              categories: topAttendanceCategories,
              series: [
                {
                  name: 'Attendance Rate (%)',
                  data: topAttendanceSeries,
                },
              ],
              options: {
                tooltip: {
                  y: { formatter: (value: number) => `${value.toFixed(1)}%` },
                },
              },
            }}
          />
        </Grid>

        {/* Top clubs by members */}
        <Grid size={{ xs: 12, md: 6 }}>
          <AnalyticsWebsiteVisits
            title="Clubs with Most Members"
            subheader="Top clubs by active member count"
            chart={{
              categories: topMembersCategories,
              series: [
                {
                  name: 'Members',
                  data: topMembersSeries,
                },
              ],
              options: {
                tooltip: {
                  y: { formatter: (value: number) => `${value} members` },
                },
              },
            }}
          />
        </Grid>

        {/* Attendance by weekday */}
        <Grid size={{ xs: 12, md: 7 }}>
          <AnalyticsWebsiteVisits
            title="Attendance by Weekday"
            subheader="Present vs absent (last 8 weeks)"
            chart={{
              categories: weekdayCategories,
              series: [
                { name: 'Present', data: weekdayPresentSeries },
                { name: 'Absent', data: weekdayAbsentSeries },
              ],
              options: {
                tooltip: {
                  y: { formatter: (value: number) => `${value} records` },
                },
              },
            }}
          />
        </Grid>

        {/* New members over time */}
        <Grid size={{ xs: 12, md: 5 }}>
          <AnalyticsWebsiteVisits
            title="New Members Over Time"
            subheader="New members joined (last 12 months)"
            chart={{
              categories: newMembersCategories,
              series: [
                {
                  name: 'New Members',
                  data: newMembersSeries,
                },
              ],
              options: {
                tooltip: {
                  y: { formatter: (value: number) => `${value} members` },
                },
              },
            }}
          />
        </Grid>

        {/* Top & least active clubs list */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardHeader title="Top & Least Active Clubs" />
            <CardContent>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                    Top Active Clubs
                  </Typography>
                  {topActiveClubs.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No data available.
                    </Typography>
                  )}
                  {topActiveClubs.map((club) => (
                    <Box
                      key={club.clubId}
                      sx={{
                        py: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2">{club.clubName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {club.members} members • {club.sessions} sessions
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="success.main">
                        {Math.round(club.attendanceRate)}%
                      </Typography>
                    </Box>
                  ))}
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                    Least Active Clubs
                  </Typography>
                  {leastActiveClubs.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No data available.
                    </Typography>
                  )}
                  {leastActiveClubs.map((club) => (
                    <Box
                      key={club.clubId}
                      sx={{
                        py: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2">{club.clubName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {club.members} members • {club.sessions} sessions
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {Math.round(club.attendanceRate)}%
                      </Typography>
                    </Box>
                  ))}
                </Grid>
              </Grid>
            </CardContent>
            <Divider sx={{ borderStyle: 'dashed' }} />
            <Box sx={{ p: 2.5, pt: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                Activity is based on attendance records and sessions over the last 90 days.
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}


