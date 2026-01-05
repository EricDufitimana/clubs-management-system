'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import type { ThemeProviderProps as MuiThemeProviderProps } from '@mui/material/styles';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as ThemeVarsProvider } from '@mui/material/styles';

import { createTheme } from './create-theme';

import type {} from './extend-theme-types';
import type { ThemeOptions } from './types';

// ----------------------------------------------------------------------

export type ThemeProviderProps = Partial<MuiThemeProviderProps> & {
  themeOverrides?: ThemeOptions;
};

export function ThemeProvider({ themeOverrides, children, ...other }: ThemeProviderProps) {
  // Only light theme - dark mode completely removed
  const theme = createTheme({
    themeOverrides: {
      ...themeOverrides,
      colorSchemes: {
        light: {
          palette: {
            mode: 'light' as const,
          },
        },
      },
      defaultColorScheme: 'light',
    },
  });

  return (
    <ThemeVarsProvider 
      disableTransitionOnChange 
      theme={theme} 
      {...other}
    >
      <CssBaseline />
      {children}
    </ThemeVarsProvider>
  );
}
