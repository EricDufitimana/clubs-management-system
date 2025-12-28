'use client';

import Link from 'next/link';

import { CONFIG } from '@/config-global';

import { Logo } from '@/components/logo';

export default function Footer() {
  return (
    <footer className="bg-mui-grey-50 border-t border-mui-grey-200 mt-20 w-full">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Left: Logo and Company Name */}
          <div className="flex flex-col gap-2">
            <Logo href="/" isSingle className="w-8 h-8" />
            <h3 className="text-xl font-bold text-mui-grey-900">
              {CONFIG.appName}
            </h3>
          </div>

          {/* Right: Links */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            <Link 
              href="/sign-in" 
              className="text-sm text-mui-grey-600 hover:text-mui-grey-900 transition-colors"
            >
              Login
            </Link>
            <Link 
              href="/sign-up" 
              className="text-sm text-mui-grey-600 hover:text-mui-grey-900 transition-colors"
            >
              Register
            </Link>
            <Link 
              href="/dashboard" 
              className="text-sm text-mui-grey-600 hover:text-mui-grey-900 transition-colors"
            >
              Statistics
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}