'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import { Iconify } from '@/components/iconify';

// ----------------------------------------------------------------------

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <IconButton>
        <Iconify icon="ri:sun-fill" width={24} height={24} />
      </IconButton>
    );
  }

  const isDark = theme === 'dark';

  return (
    <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
      <IconButton
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        sx={{
          transition: 'transform 0.3s ease-in-out',
          '&:hover': {
            transform: 'rotate(180deg)',
          },
        }}
      >
        {isDark ? (
          <Iconify icon="ri:sun-fill" width={24} height={24} />
        ) : (
          <Iconify icon="ri:moon-fill" width={24} height={24} />
        )}
      </IconButton>
    </Tooltip>
  );
}

