'use client'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import StarRating from '../../shared/star-rating'
import { TextGenerateEffect } from '@/components/ui/text-generate-effect'
import { TextWithFlip } from '@/components/ui/text-with-flip'

function HeroSection() {
  const ref = useRef(null)
  const [avatarList, setAvatarList] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/page-data')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setAvatarList(data)
      } catch (error) {
        console.error('Error fetching services:', error)
      }
    }

    fetchData()
  }, [])

  const bottomAnimation = {
    initial: { y: '20%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { duration: 1, delay: 0.8 },
  }

  return (
    <section>
      <div className='relative w-full pt-44 2xl:pb-20 pb-10 before:absolute before:w-full before:h-full before:bg-linear-to-r before:from-blue_gradient before:via-white before:to-yellow_gradient before:rounded-full before:top-24 before:blur-3xl before:-z-10 dark:before:from-dark_blue_gradient dark:before:via-black dark:before:to-dark_yellow_gradient dark:before:rounded-full dark:before:blur-3xl dark:before:-z-10'>
        <div className='container relative z-10'>
          <div ref={ref} className='flex flex-col gap-8'>
            {/* ---------------- heading text --------------- */}
            <div
              // {...bottomAnimation}
              className='relative flex flex-col text-center items-center gap-4'>
              <h1>
                <TextGenerateEffect words="Paper attendance is the problem. We're" />
                <TextGenerateEffect
                  words="the"
                  delay={0.8}
                />
                <TextWithFlip
                  text="[FLIP]"
                  flipWords={['solution', 'answer', 'upgrade', 'future']}
                  delay={0.8 + 0.2}
                  duration={0.5}
                  flipDuration={1500}
                  flipClassName="italic font-normal instrument-font"
                />
              </h1>
              <p className='max-w-38 text-dark_black/60 dark:text-white/60'>
              Running clubs shouldn’t feel like extra homework.
              We built a system that removes the paperwork, reduces confusion, and helps schools stay organized — without needing a tutorial every time you log in.
              </p>
            </div>

            <motion.div
              {...bottomAnimation}
              className='flex flex-col items-center justify-center gap-4'>
              <div className='flex flex-col items-center justify-center gap-8 w-full sm:flex-row'>
                {/* ----------- Get started Link -------------- */}
                <Link
                  href='/contact'
                  className='group bg-purple_blue text-white font-medium flex flex-row justify-between items-center py-2 px-5 rounded-full max-w-64 w-full md:py-3 border border-purple_blue transition-all duration-200 ease-in-out hover:bg-transparent hover:text-purple_blue'>
                  <span className='flex text-start transform transition-transform duration-200 ease-in-out group-hover:translate-x-28'>
                    Get Started
                  </span>
                  <svg
                    width='40'
                    height='40'
                    viewBox='0 0 40 40'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                    className='transform transition-transform duration-200 ease-in-out group-hover:-translate-x-44 group-hover:rotate-45'>
                    <rect
                      width='40'
                      height='40'
                      rx='20'
                      className='fill-white transition-colors duration-200 ease-in-out group-hover:fill-purple_blue'
                    />
                    <path
                      d='M15.832 15.3334H24.1654V23.6667'
                      className='stroke-[#1B1D1E] transition-colors duration-200 ease-in-out group-hover:stroke-white'
                      strokeWidth='1.66667'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                    <path
                      d='M15.832 23.6667L24.1654 15.3334'
                      className='stroke-[#1B1D1E] transition-colors duration-500 ease-in-out group-hover:stroke-white'
                      strokeWidth='1.66667'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                </Link>

                {/* --------------- avatar division -------------- */}
                <div className='flex items-center gap-7'>
                  <ul className='avatar flex flex-row items-center'>
                    {avatarList?.avatarList?.map((items: any, index: any) => (
                      <li key={index} className='-mr-2 z-1 avatar-hover:ml-2'>
                        <Image
                          src={items.image}
                          alt='Image'
                          width={44}
                          height={44}
                          quality={100}
                          className='rounded-full border-2 border-white'
                        />
                      </li>
                    ))}
                  </ul>
                  {/* -------------- Star rating division --------------- */}
                  <div className='gap-1 flex flex-col'>
                    <div>
                      <StarRating count={4} color='#F59E0B' />
                    </div>
                    <p className='text-sm font-normal text-dark_black/60 dark:text-white/60'>
                      Trusted by 1000+ clients
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
            <div className="flex justify-center items-center pt-4">
              <div className="relative p-2 rounded-3xl bg-linear-to-br from-white/20 via-white/10 to-white/5 dark:from-white/5 dark:via-white/3 dark:to-white/1 backdrop-blur-xl border border-white/30 dark:border-white/15 shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] before:absolute before:inset-0 before:rounded-3xl before:p-px before:bg-linear-to-br before:from-white/40 before:via-transparent before:to-transparent before:-z-10 before:blur-sm after:absolute after:inset-px after:rounded-3xl after:bg-linear-to-t after:from-black/5 after:via-transparent after:to-transparent after:pointer-events-none">
                <Image src="/images/hero/hero-dashboard.png" alt="Hero Image" width={1150} height={1000} className='rounded-3xl relative z-10'/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
