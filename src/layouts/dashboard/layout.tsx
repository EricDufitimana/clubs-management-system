'use client';

import type { Breakpoint } from '@mui/material/styles';

import { merge } from 'es-toolkit';
import { useBoolean } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';

import { _langs, _notifications } from 'src/_mock';

import { Logo } from 'src/components/logo';

import { NavMobile, NavDesktop } from './nav';
import { _account } from '../nav-config-account';
import { dashboardLayoutVars } from './css-vars';
import { getNavDataForRole } from '../nav-config-dashboard';
import { useUserRole } from 'src/hooks/use-user-role';
import { MainSection } from '../core/main-section';
import { Searchbar } from '../components/searchbar';
import { _workspaces } from '../nav-config-workspace';
import { MenuButton } from '../components/menu-button';
import { HeaderSection } from '../core/header-section';
import { LayoutSection } from '../core/layout-section';
import { AccountPopover } from '../components/account-popover';
import { LanguagePopover } from '../components/language-popover';
import { NotificationsPopover } from '../components/notifications-popover';

import type { MainSectionProps } from '../core/main-section';
import type { HeaderSectionProps } from '../core/header-section';
import type { LayoutSectionProps } from '../core/layout-section';

// ----------------------------------------------------------------------

type LayoutBaseProps = Pick<LayoutSectionProps, 'sx' | 'children' | 'cssVars'>;

export type DashboardLayoutProps = LayoutBaseProps & {
  layoutQuery?: Breakpoint;
  slotProps?: {
    header?: HeaderSectionProps;
    main?: MainSectionProps;
  };
};

export function DashboardLayout({
  sx,
  cssVars,
  children,
  slotProps,
  layoutQuery = 'lg',
}: DashboardLayoutProps) {
  const theme = useTheme();
  const { role } = useUserRole();

  const { value: open, onFalse: onClose, onTrue: onOpen } = useBoolean();
  
  // Get navigation items based on user role
  const navData = getNavDataForRole(role);

  const renderHeader = () => {
    const headerSlotProps: HeaderSectionProps['slotProps'] = {
      container: {
        maxWidth: false,
      },
    };

    const headerSlots: HeaderSectionProps['slots'] = {
      topArea: (
        <Alert severity="info" sx={{ display: 'none', borderRadius: 0 }}>
          This is an info Alert.
        </Alert>
      ),
      leftArea: (
        <>
          {/** @slot Logo */}
          <Logo />
          {/** @slot Nav mobile */}
          <MenuButton
            onClick={onOpen}
            sx={{ mr: 1, ml: 1, [theme.breakpoints.up(layoutQuery)]: { display: 'none' } }}
          />
          <NavMobile data={navData} open={open} onClose={onClose} workspaces={_workspaces} />
          {/** @slot Nav desktop - horizontal */}
          <NavDesktop data={navData} layoutQuery={layoutQuery} workspaces={_workspaces} sx={{ ml: 3 }} />
        </>
      ),
      rightArea: (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0, sm: 0.75 } }}>
          {/** @slot Searchbar */}
          <Searchbar />

          {/** @slot Language popover */}
          <LanguagePopover data={_langs} />

          {/** @slot Notifications popover */}
          <NotificationsPopover data={_notifications} />

          {/** @slot Account drawer */}
          <AccountPopover data={_account} />
        </Box>
      ),
    };

    return (
      <HeaderSection
        disableElevation
        layoutQuery={layoutQuery}
        {...slotProps?.header}
        slots={{ ...headerSlots, ...slotProps?.header?.slots }}
        slotProps={merge(headerSlotProps, slotProps?.header?.slotProps ?? {})}
        sx={slotProps?.header?.sx}
      />
    );
  };

  const renderFooter = () => null;

  const renderMain = () => <MainSection {...slotProps?.main}>{children}</MainSection>;

  return (
    <LayoutSection
      /** **************************************
       * @Header
       *************************************** */
      headerSection={renderHeader()}
      /** **************************************
       * @Footer
       *************************************** */
      footerSection={renderFooter()}
      /** **************************************
       * @Styles
       *************************************** */
      cssVars={{ ...dashboardLayoutVars(theme), ...cssVars }}
      sx={[
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {renderMain()}
    </LayoutSection>
  );
}
