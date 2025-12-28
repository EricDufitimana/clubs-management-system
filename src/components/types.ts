import type { Theme, SxProps } from '@mui/material/styles';
import type { Props as SimpleBarProps } from 'simplebar-react';
import type { ApexOptions } from 'apexcharts';

// ----------------------------------------------------------------------

export type SvgColorProps = React.ComponentProps<'span'> & {
  src: string;
  sx?: SxProps<Theme>;
};

export type ScrollbarProps = SimpleBarProps & {
  sx?: SxProps<Theme>;
  ref?: React.Ref<HTMLElement>;
  slotProps?: {
    wrapperSx?: SxProps<Theme>;
    contentWrapperSx?: SxProps<Theme>;
    contentSx?: SxProps<Theme>;
  };
  fillContent?: boolean;
};

export type ChartOptions = ApexOptions;

export type ChartProps = React.ComponentProps<'div'> & {
  type: 'line' | 'area' | 'bar' | 'pie' | 'donut' | 'radialBar' | 'scatter' | 'bubble' | 'heatmap' | 'candlestick' | 'boxPlot' | 'treemap' | 'polarArea' | 'radar' | 'rangeBar';
  series: ApexOptions['series'];
  options?: ChartOptions;
  slotProps?: {
    loading?: SxProps<Theme>;
  };
  sx?: SxProps<Theme>;
};

export type LabelColor = 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';

export type LabelProps = React.ComponentProps<'span'> & {
  variant?: 'filled' | 'outlined' | 'soft' | 'inverted';
  color?: LabelColor;
  disabled?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  sx?: SxProps<Theme>;
};
