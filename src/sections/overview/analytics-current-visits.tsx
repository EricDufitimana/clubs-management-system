'use client';

import type { CardProps } from '@mui/material/Card';
import type { ChartOptions } from '@/components/types';

import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { fNumber } from '@/utils/format-number';

import { Chart } from '@/components/chart';
import { useChart } from '@/components/use-chart';
import { ChartLegends } from '@/components/components';

// ----------------------------------------------------------------------

type Props = CardProps & {
  title?: string;
  subheader?: string;
  chart: {
    colors?: string[];
    series: {
      label: string;
      value: number;
    }[];
    options?: ChartOptions;
  };
  hideLegends?: boolean; // New prop to control legend visibility
};

export function AnalyticsCurrentVisits({ title, subheader, chart, sx, hideLegends, ...other }: Props) {
  const theme = useTheme();

  const chartSeries = chart.series.map((item) => item.value);

  const chartColors = chart.colors ?? [
    theme.palette.primary.main,
    theme.palette.warning.light,
    theme.palette.info.dark,
    theme.palette.error.main,
  ];

  const chartOptions = useChart({
    chart: { sparkline: { enabled: true } },
    colors: chartColors,
    labels: chart.series.map((item) => item.label),
    stroke: { width: 0 },
    dataLabels: { enabled: true, dropShadow: { enabled: false } },
    tooltip: {
      y: {
        formatter: (value: number) => fNumber(value),
        title: { formatter: (seriesName: string) => `${seriesName}` },
      },
    },
    plotOptions: { pie: { donut: { labels: { show: false } } } },
    ...chart.options,
  });

  return (
    <Card sx={sx} {...other}>
      <CardHeader title={title} subheader={subheader} />

      <Chart
        type="pie"
        series={chartSeries}
        options={chartOptions}
        sx={{
          my: hideLegends ? 2 : 6,
          mx: 'auto',
          width: { xs: 240, xl: 260 },
          height: { xs: 240, xl: 260 },
        }}
      />

      {hideLegends && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, pb: 2 }}>
          {chart.series.map((item, index) => (
            <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: chartColors[index],
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {item.label}: {fNumber(item.value)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {!hideLegends && (
        <>
          <Divider sx={{ borderStyle: 'dashed' }} />

          <ChartLegends
            labels={chartOptions?.labels}
            colors={chartOptions?.colors}
            sx={{ p: 3, justifyContent: 'center' }}
          />
        </>
      )}
    </Card>
  );
}
