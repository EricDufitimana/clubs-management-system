import { Icon } from '@iconify/react';

import { SvgColor } from '@/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} />;

export type NavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
  roles?: ('admin' | 'super_admin')[]; // If undefined, accessible to all
};

// Admin navigation items
export const adminNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/dashboard/admin',
    icon: <Icon icon="solar:widget-5-bold-duotone" width={24} height={24} />,
  },
  {
    title: 'Members',
    path: '/dashboard/admin/members',
    icon: icon('ic-user'),
  },
  {
    title: 'Sessions',
    path: '/dashboard/admin/sessions',
    icon: <Icon icon="solar:calendar-mark-bold-duotone" width={24} height={24} />,
  },
  {
    title: 'Attendance',
    path: '/dashboard/admin/attendance',
    icon: <Icon icon="solar:clipboard-check-bold" width={24} height={24} />,
  },
];

// Super admin navigation items
export const superAdminNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/dashboard/super-admin',
    icon: <Icon icon="solar:widget-5-bold-duotone" width={24} height={24} />,
  },
  {
    title: 'Clubs',
    path: '/dashboard/super-admin/clubs',
    icon: <Icon icon="solar:users-group-rounded-bold-duotone" width={24} height={24} />,
  },
  {
    title: 'Members',
    path: '/dashboard/super-admin/members',
    icon: icon('ic-user'),
  },
  {
    title: 'Left Members',
    path: '/dashboard/super-admin/left-members',
    icon: <Icon icon="solar:logout-3-bold-duotone" width={24} height={24} />,
  },
  {
    title: 'Reports',
    path: '/dashboard/super-admin/reports',
    icon: <Icon icon="solar:chart-square-bold-duotone" width={24} height={24} />,
  },
];

// Legacy navData for backward compatibility
export const navData: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: <Icon icon="solar:widget-5-bold-duotone" width={24} height={24} />,
  },
  ...adminNavItems.filter(item => item.path !== '/dashboard/admin'),
  ...superAdminNavItems.filter(item => item.path !== '/dashboard/super-admin'),
];

// Deprecated: Use role-specific nav items directly instead
export function getNavDataForRole(role: 'admin' | 'super_admin' | null): NavItem[] {
  if (role === 'super_admin') {
    return superAdminNavItems;
  } else if (role === 'admin') {
    return adminNavItems;
  }
  return [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: <Icon icon="solar:widget-5-bold-duotone" width={24} height={24} />,
    },
  ];
}
