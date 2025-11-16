import { Icon } from '@iconify/react';

import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} />;

export type NavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
  roles?: ('admin' | 'super_admin')[]; // If undefined, accessible to all
};

// Admin navigation items (accessible to both admin and super_admin)
const adminNavItems: NavItem[] = [
  {
    title: 'Users',
    path: '/dashboard/admin/users',
    icon: icon('ic-user'),
    roles: ['admin', 'super_admin'],
  },
  {
    title: 'Sessions',
    path: '/dashboard/admin/sessions',
    icon: <Icon icon="solar:calendar-mark-bold-duotone" width={24} height={24} />,
    roles: ['admin', 'super_admin'],
  },
  {
    title: 'Attendance',
    path: '/dashboard/admin/attendance',
    icon: <Icon icon="solar:clipboard-check-bold" width={24} height={24} />,
    roles: ['admin', 'super_admin'],
  },
];

// Super admin navigation items (only for super_admin)
const superAdminNavItems: NavItem[] = [
  {
    title: 'Clubs',
    path: '/dashboard/super-admin/clubs',
    icon: <Icon icon="solar:users-group-rounded-bold-duotone" width={24} height={24} />,
    roles: ['super_admin'],
  },
  {
    title: 'Users',
    path: '/dashboard/super-admin/users',
    icon: icon('ic-user'),
    roles: ['super_admin'],
  },
  {
    title: 'Reports',
    path: '/dashboard/super-admin/reports',
    icon: <Icon icon="solar:chart-square-bold-duotone" width={24} height={24} />,
    roles: ['super_admin'],
  },
];

// Legacy navData for backward compatibility (will be filtered based on role)
export const navData: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: <Icon icon="solar:widget-5-bold-duotone" width={24} height={24} />,
  },
  ...adminNavItems,
  ...superAdminNavItems,
];

// Function to get navigation items based on user role
export function getNavDataForRole(role: 'admin' | 'super_admin' | null): NavItem[] {
  const items: NavItem[] = [];

  // Add dashboard link based on role
  if (role === 'super_admin') {
    items.push({
      title: 'Dashboard',
      path: '/dashboard/super-admin',
      icon: <Icon icon="solar:widget-5-bold-duotone" width={24} height={24} />,
    });
    // Super admin gets all items
    items.push(...superAdminNavItems);
  } else if (role === 'admin') {
    items.push({
      title: 'Dashboard',
      path: '/dashboard/admin',
      icon: <Icon icon="solar:widget-5-bold-duotone" width={24} height={24} />,
    });
    // Admin gets admin items
    items.push(...adminNavItems);
  } else {
    // Default dashboard for users without role
    items.push({
      title: 'Dashboard',
      path: '/dashboard',
      icon: <Icon icon="solar:widget-5-bold-duotone" width={24} height={24} />,
    });
  }

  return items;
}
