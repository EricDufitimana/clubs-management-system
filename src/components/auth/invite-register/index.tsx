'use client'
import { ReactNode } from 'react'
import Logo from '../../layout/header/Logo'

type AuthLayoutProps = {
  children: ReactNode
  title?: string
  subtitle?: string
}

const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <section>
      <div className='relative w-full pt-4 2xl:pb-20 pb-10 before:absolute before:w-full before:h-full before:bg-linear-to-r before:from-blue_gradient before:via-white before:to-yellow_gradient before:rounded-full before:top-24 before:blur-3xl  before:-z-10 dark:before:from-dark_blue_gradient dark:before:via-black dark:before:to-dark_yellow_gradient dark:before:rounded-full dark:before:blur-3xl dark:before:-z-10'>
        <div className='container'>
          <div className='-mx-4 flex flex-wrap'>
            <div className='w-full px-4'>
              <div className='relative shadow-lg mx-auto max-w-[560px] overflow-hidden rounded-lg bg-white dark:bg-dark_black px-8 py-8 text-center sm:px-12 md:px-14'>
                <div className='mb-2 flex justify-center'>
                  <Logo />
                </div>

                {title && (
                  <h2 className='mb-1 text-2xl font-semibold text-dark_black dark:text-white'>
                    {title}
                  </h2>
                )}

                {subtitle && (
                  <p className='mb-3 text-sm text-gray-600 dark:text-gray-400'>
                    {subtitle}
                  </p>
                )}

                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AuthLayout
