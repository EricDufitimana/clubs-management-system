import type { Metadata } from 'next';
import { JoinSuperAdminView } from '@/sections/auth/join-super-admin-view';

// ----------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Join as Super Admin',
};

type PageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function JoinSuperAdminPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const searchParam = await searchParams;
  
  return <JoinSuperAdminView token={token} searchParams={searchParam} />;
}
