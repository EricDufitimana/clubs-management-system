'use client';

import { BarChart3, Building2, UserPlus } from 'lucide-react';
import './globals.css';
import { Button } from '@mui/material';
import Link from 'next/link';
import { Logo } from 'src/components/logo';
import { CONFIG } from 'src/config-global';

// ----------------------------------------------------------------------

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Static sidebar - one third of screen */}
      <div className="w-2/5 fixed h-screen left-0 top-0 p-6 flex flex-col z-10 bg-mui-primary-lighter">
        <div className="flex flex-row justify-between items-center w-full">
          <div className="flex items-center gap-4">
            <Logo href="/" isSingle className="w-8 h-8" />
            <h1 className='text-mui-primary-dark text-xl font-bold'>{CONFIG.appName}</h1>
          </div>
          <Link href='/sign-in'>
            <Button
              variant="contained"
              className="!bg-white !text-mui-grey-800 hover:!bg-white !text-sm "
              disableElevation
            >
              Sign In
            </Button>
          </Link>
        </div> 
        <div className="pt-12">
          <h1 className='text-mui-grey-900 text-4xl font-medium tracking-wider'>Managing Clubs</h1>
          <h1 className='text-mui-grey-900 text-4xl font-medium tracking-wider'>Made <span className="text-mui-primary-main font-medium">Simple</span></h1>
        </div>
        <p className='text-mui-grey-900 text-md font-normal pt-4'>Effortless, streamlined management to organize your club with ease.</p>
        <div className="pt-12">
          <p className='text-mui-grey-900 text-sm font-medium'>Our Offerings</p> 
          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="flex flex-col items-center justify-center p-4 rounded-md bg-mui-secondary-light max-w-md h-40">
              <Building2 className="w-10 h-10" />
              <h2 className='text-mui-grey-900 text-sm font-medium pt-2'>Add Members</h2>

            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-md bg-mui-secondary-light max-w-md">
              <UserPlus className="w-10 h-10" />
              <h2 className='text-mui-grey-900 text-sm font-medium whitespace-nowrap pt-2'>Record Attendance</h2>

            </div>
            <div className="flex flex-col items-center justify-center p-4 rounded-md bg-mui-secondary-light max-w-md">
              <BarChart3 className="w-10 h-10" />
              <h2 className='text-mui-grey-900 text-sm font-medium pt-2'>Get Reports</h2>

            </div>
          </div>
        </div>
      </div>

      {/* Main content area - two thirds of screen */}
      <div className="w-3/5 ml-[40%] h-screen bg-mui-background-default overflow-hidden overflow-y-auto">
          {children}
      </div>
    </div>
  );
}

