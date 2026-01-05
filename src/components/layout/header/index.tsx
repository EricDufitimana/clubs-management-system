'use client'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { Icon } from '@iconify/react/dist/iconify.js'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import HeaderLink from './Navigation/HeaderLink'
import Logo from './Logo'
import MobileHeader from './Navigation/MobileHeader'
import ThemeToggler from './ThemeToggle'
import { useCurrentUser } from '@/hooks/use-current-user'

const Header = () => {
  const { data: session } = useSession()
  const { user, loading } = useCurrentUser()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuData, setMenuData] = useState<any[]>([]);
  const [sticky, setSticky] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const pathname = usePathname()
  const hasMounted = useRef(false);

  const handleScroll = () => {
    setSticky(window.scrollY >= 80)
  }

  useEffect(() => {
        window.addEventListener("scroll", handleScroll);

        // Run only once on initial mount
        if (!hasMounted.current) {
            hasMounted.current = true;

            const fetchData = async () => {
                try {
                    const res = await fetch('/api/layout-data');
                    if (!res.ok) throw new Error('Failed to fetch');
                    const data = await res.json();
                    setMenuData(data?.headerData);
                } catch (error) {
                    console.error('Error fetching services:', error);
                }
            };

            fetchData();
        }

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, [pathname]);

  const handleSignOut = () => {
    signOut()
    setProfileDropdownOpen(false)
  }

  const handleGoToDashboard = () => {
    router.push('/dashboard')
    setProfileDropdownOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownOpen && 
          !(event.target as Element).closest('.profile-dropdown') &&
          !(event.target as Element).closest('.profile-trigger')) {
        setProfileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [profileDropdownOpen])

  return (
    <>
      <header className={`fixed top-0 z-50 w-full pt-4`}>
        <div className='container p-3'>
          <nav
            className={`flex items-center py-3 px-4 justify-between ${
              sticky
                ? ' rounded-full shadow-sm bg-white dark:bg-dark_black'
                : null
            } `}>
            <div className='flex items-center'>
              <Logo />
            </div>
            <div className='hidden lg:flex bg-dark_black/5 dark:bg-white/5 rounded-3xl p-3'>
              <ul className='flex gap-0 2xl:gap-1.5'>
                {menuData?.map((item, index) => (
                  <HeaderLink key={index} item={item} />
                ))}
              </ul>
            </div>
            <div className='flex items-center gap-1 xl:gap-4'>
              {/* ---------------------Profile Dropdown-----------------  */}
              {(user?.id || session?.user) ? (
                <div className='relative profile-dropdown'>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className='profile-trigger flex items-center gap-2 p-2 rounded-full hover:bg-dark_black/5 dark:hover:bg-white/5 transition-colors duration-200'
                  >
                    <Image
                      src='/images/home/avatar_1.jpg'
                      alt='Profile'
                      width={40}
                      height={40}
                      quality={100}
                      className='rounded-full'
                    />
                    <Icon 
                      icon='solar:chevron-down-bold' 
                      width='16' 
                      height='16' 
                      className={`transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  
                  {profileDropdownOpen && (
                    <div className='absolute right-0 mt-2 w-56 bg-white dark:bg-dark_black rounded-lg shadow-lg border border-dark_black/10 dark:border-white/10 overflow-hidden profile-dropdown'>
                      <div className='px-4 py-3 border-b border-dark_black/10 dark:border-white/10'>
                        <p className='text-sm font-medium text-dark_black dark:text-white'>
                          {user?.displayName || session?.user?.name || 'User'}
                        </p>
                        <p className='text-xs text-dark_black/60 dark:text-white/60 mt-1'>
                          {user?.email || session?.user?.email || 'user@example.com'}
                        </p>
                      </div>
                      
                      <div className='py-2'>
                        <button
                          onClick={handleGoToDashboard}
                          className='flex items-center gap-3 w-full px-4 py-2 text-sm text-dark_black dark:text-white hover:bg-dark_black/5 dark:hover:bg-white/5 transition-colors duration-200'
                        >
                          <Icon icon='solar:widget-5-bold-duotone' width='18' height='18' />
                          Dashboard
                        </button>
                        
                        <button
                          onClick={handleSignOut}
                          className='flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200'
                        >
                          <Icon icon='solar:logout-3-bold-duotone' width='18' height='18' />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className='flex items-center gap-2'>
                  <Link
                    href={'/signin'}
                    className='hidden lg:block bg-transparent border border-dark_black dark:border-white/50 text-primary px-2.5 xl:px-4 py-2 rounded-full hover:bg-dark_black hover:text-white'>
                    Sign In
                  </Link>
                  <Link
                    href={'/not-made'}
                    className='hidden lg:block text-white px-2.5 xl:px-4 py-2  bg-dark_black dark:bg-white/20 rounded-full hover:opacity-90'>
                    Sign Up
                  </Link>
                </div>
              )}

              {/* ---------------------Light/Dark Mode button-------------------- */}
              <ThemeToggler />

              <div className='hidden max-lg:flex'>
                <button onClick={() => setSidebarOpen(!sidebarOpen)}>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'>
                    <path
                      fill='none'
                      stroke='currentColor'
                      strokeLinecap='round'
                      strokeMiterlimit='10'
                      strokeWidth='1.5'
                      d='M4.5 12h15m-15 5.77h15M4.5 6.23h15'
                    />
                  </svg>
                </button>
              </div>
            </div>
          </nav>
        </div>

        {/* ------------------------- Mobile sidebar starts ------------------------- */}
        {sidebarOpen && (
          <div
            className='fixed top-0 left-0 w-full h-full bg-black/50 z-40'
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div
          className={`lg:hidden fixed top-0 right-0 h-full w-full bg-white dark:bg-dark_black shadow-lg transform transition-transform duration-300 max-w-xs ${
            sidebarOpen ? 'translate-x-0' : 'translate-x-full'
          } z-50`}>
          <div className='flex items-center justify-between p-4'>
            <p className='text-lg font-bold'>Menu</p>
            <button
              onClick={() => setSidebarOpen(false)}
              aria-label='Close mobile menu'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                width='24'
                height='24'
                viewBox='0 0 24 24'>
                <path
                  fill='none'
                  stroke='currentColor'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>
          <div className='p-4'>
            <ul className='flex flex-col'>
              {menuData && menuData?.map((item, index) => (
                <MobileHeader key={index} item={item} />
              ))}
              <div className='flex flex-col items-center gap-3 px-2 mt-2'>
                {(user?.id || session?.user) ? (
                  <>
                    <div className='w-full border border-dark_black dark:border-white/10 rounded-lg overflow-hidden'>
                      <div className='px-4 py-3 bg-dark_black/5 dark:bg-white/5 border-b border-dark_black/10 dark:border-white/10'>
                        <p className='text-sm font-medium text-dark_black dark:text-white'>
                          {user?.displayName || session?.user?.name || 'User'}
                        </p>
                        <p className='text-xs text-dark_black/60 dark:text-white/60 mt-1'>
                          {user?.email || session?.user?.email || 'user@example.com'}
                        </p>
                      </div>
                      
                      <div className='py-2'>
                        <button
                          onClick={() => router.push('/dashboard')}
                          className='flex items-center gap-3 w-full px-4 py-2 text-sm text-dark_black dark:text-white hover:bg-dark_black/5 dark:hover:bg-white/5 transition-colors duration-200'
                        >
                          <Icon icon='solar:widget-5-bold-duotone' width='18' height='18' />
                          Dashboard
                        </button>
                        
                        <button
                          onClick={() => signOut()}
                          className='flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200'
                        >
                          <Icon icon='solar:logout-3-bold-duotone' width='18' height='18' />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      href={'/signin'}
                      className='w-full border border-dark_black dark:border-white text-primary px-4 py-2 rounded-md hover:bg-dark_black dark:hover:bg-white hover:text-white dark:hover:text-dark_black'>
                      Sign In
                    </Link>
                    <Link
                      href={'/not-made'}
                      className='w-full text-white dark:text-dark_black px-4 py-2 bg-dark_black dark:bg-white rounded-md hover:opacity-90'>
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </ul>
          </div>
        </div>
      </header>
    </>
  )
}

export default Header
