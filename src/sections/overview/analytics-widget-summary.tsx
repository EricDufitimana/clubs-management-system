'use client';

import type { CardProps } from '@mui/material/Card';
import type { ChartOptions } from '@/components/types';

import { varAlpha } from 'minimal-shared/utils';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';

import { fNumber, fPercent, fShortenNumber } from '@/utils/format-number';
import { Iconify } from '@/components/iconify';
import { SvgColor } from '@/components/svg-color';
import { Chart } from '@/components/chart';
import { useChart } from '@/components/use-chart';

// Explicitly define only the colors that actually exist in your palette
type SafeColorKey = 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';

type Props = CardProps & {
  title: string;
  total: number;
  percent: number;
  color?: SafeColorKey;
  icon: React.ReactNode;
  chart: {
    series: number[];
    categories: string[];
    options?: ChartOptions;
  };
};

export function AnalyticsWidgetSummary({
  sx,
  icon,
  title,
  total,
  chart,
  percent,
  color = 'primary',
  ...other
}: Props) {
  const theme = useTheme();

  // Safely access palette — fall back to primary if the color key is missing
  const paletteColor = theme.vars?.palette?.[color] ?? theme.vars?.palette?.primary;
  const staticPaletteColor = theme.palette?.[color] ?? theme.palette?.primary;

  const chartColors = [staticPaletteColor?.dark ?? '#000'];

  const chartOptions = useChart({
    chart: { sparkline: { enabled: true } },
    colors: chartColors,
    xaxis: { categories: chart.categories },
    grid: {
      padding: { top: 6, left: 6, right: 6, bottom: 6 },
    },
    tooltip: {
      y: { formatter: (value: number) => fNumber(value), title: { formatter: () => '' } },
    },
    markers: { strokeWidth: 0 },
    ...chart.options,
  });

  const renderTrending = () => (
    <Box
      sx={{
        top: 16,
        gap: 0.5,
        right: 16,
        display: 'flex',
        position: 'absolute',
        alignItems: 'center',
      }}
    >
      <Iconify width={20} icon={percent < 0 ? 'eva:trending-down-fill' : 'eva:trending-up-fill'} />
      <Box component="span" sx={{ typography: 'subtitle2' }}>
        {percent > 0 && '+'}
        {fPercent(percent)}
      </Box>
    </Box>
  );

  // Build gradient safely — only use varAlpha if the channel values actually exist
  const lighterChannel = paletteColor?.lighterChannel;
  const lightChannel = paletteColor?.lightChannel;

  const backgroundImage =
    lighterChannel && lightChannel
      ? `linear-gradient(135deg, ${varAlpha(lighterChannel, 0.48)}, ${varAlpha(lightChannel, 0.48)})` 
      : `linear-gradient(135deg, ${staticPaletteColor?.light ?? '#e0e0e0'}26, ${staticPaletteColor?.light ?? '#e0e0e0'}26)`;

  return (
    <Card
      sx={[
        {
          p: 3,
          boxShadow: 'none',
          position: 'relative',
          color: `${color}.darker`,
          backgroundColor: 'common.white',
          backgroundImage,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      <Box sx={{ width: 48, height: 48, mb: 3 }}>{icon}</Box>
      {renderTrending()}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
        }}
      >
        <Box sx={{ flexGrow: 1, minWidth: 112 }}>
          <Box sx={{ mb: 1, typography: 'subtitle2' }}>{title}</Box>
          <Box sx={{ typography: 'h4' }}>{fShortenNumber(total)}</Box>
        </Box>
        <Chart
          type="line"
          series={[{ data: chart.series }]}
          options={chartOptions}
          sx={{ width: 84, height: 56 }}
        />
      </Box>
      <SvgColor
        src="/assets/background/shape-square.svg"
        sx={{
          top: 0,
          left: -20,
          width: 240,
          zIndex: -1,
          height: 240,
          opacity: 0.24,
          position: 'absolute',
          color: `${color}.main`,
        }}
      />
    </Card>
  );
}
