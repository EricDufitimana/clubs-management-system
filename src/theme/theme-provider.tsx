"use client";

import { useTheme as useNextTheme } from "next-themes";
import { useEffect } from "react";
import type { ThemeProviderProps as MuiThemeProviderProps } from '@mui/material/styles';
import { ThemeProvider as ThemeVarsProvider } from '@mui/material/styles';
import { createTheme } from './create-theme';
import type {} from './extend-theme-types';
import type { ThemeOptions } from './types';

export type ThemeProviderProps = Partial<MuiThemeProviderProps> & {
  themeOverrides?: ThemeOptions;
};

export function ThemeProvider({ themeOverrides, children, ...other }: ThemeProviderProps) {
  const { resolvedTheme } = useNextTheme();

  const theme = createTheme({
    themeOverrides: {
      ...themeOverrides,
      defaultColorScheme: 'light', // ✅ never let themeOverrides change this default
    },
  });

  useEffect(() => {
    // Sync MUI attribute whenever next-themes resolves
    document.documentElement.setAttribute(
      "data-mui-color-scheme",
      resolvedTheme === "dark" ? "dark" : "light"
    );
  }, [resolvedTheme]);

  return (
    <ThemeVarsProvider disableTransitionOnChange theme={theme} {...other}>
      {children}
    </ThemeVarsProvider>
  );
}
