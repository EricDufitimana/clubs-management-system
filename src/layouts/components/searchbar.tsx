'use client';

import type { BoxProps } from '@mui/material/Box';

import { useState, useCallback } from 'react';
import { varAlpha } from 'minimal-shared/utils';
import { alpha } from '@mui/material/styles';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Slide from '@mui/material/Slide';
import Input from '@mui/material/Input';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import ClickAwayListener from '@mui/material/ClickAwayListener';

import { Iconify } from '@/components/iconify';

// ----------------------------------------------------------------------

export function Searchbar({ sx, ...other }: BoxProps) {
  const theme = useTheme();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpen = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSearchQuery('');
  }, []);

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      // Navigate to search results page with query parameter
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      handleClose();
    }
  }, [searchQuery, router, handleClose]);

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <div>
        {!open && (
          <IconButton onClick={handleOpen}>
            <Iconify icon="eva:search-fill" />
          </IconButton>
        )}

        <Slide direction="down" in={open} mountOnEnter unmountOnExit>
          <Box
            sx={{
              top: 0,
              left: 0,
              zIndex: 99,
              width: '100%',
              display: 'flex',
              position: 'absolute',
              alignItems: 'center',
              px: { xs: 3, md: 5 },
              boxShadow: theme.vars?.customShadows?.z8 || theme.customShadows?.z8 || '0 8px 16px 0 rgba(0, 0, 0, 0.16)',
              height: {
                xs: 'var(--layout-header-mobile-height)',
                md: 'var(--layout-header-desktop-height)',
              },
              backdropFilter: `blur(6px)`,
              WebkitBackdropFilter: `blur(6px)`,
              backgroundColor: theme.vars?.palette?.background?.defaultChannel
                ? varAlpha(theme.vars.palette.background.defaultChannel, 0.8)
                : alpha(theme.palette.background.default, 0.8),
              ...sx,
            }}
            {...other}
          >
            <Input
              autoFocus
              fullWidth
              disableUnderline
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              startAdornment={
                <InputAdornment position="start">
                  <Iconify width={20} icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              }
              sx={{ fontWeight: 'fontWeightBold' }}
            />
            <Button variant="contained" onClick={handleSearch}>
              Search
            </Button>
          </Box>
        </Slide>
      </div>
    </ClickAwayListener>
  );
}
