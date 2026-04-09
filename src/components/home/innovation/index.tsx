'use client'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView } from 'motion/react'
import { TextGenerateEffect } from '@/components/ui/text-generate-effect'
import { Icon } from '@iconify/react/dist/iconify.js'
import { useOutsideClick } from '@/hooks/use-outside-click'

function Innovation() {
  const ref = useRef(null)
  const inView = useInView(ref)
  const [innovationList, setinnovationList] = useState<any>(null);
  const [active, setActive] = useState<any | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const id = useId();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/page-data')
        if (!res.ok) throw new Error('Failed to fetch')

        const data = await res.json()
        setinnovationList(data?.innovationList)
      } catch (error) {
        console.error('Error fetching services:', error)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(null);
      }
    }

    if (active) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(dialogRef as React.RefObject<HTMLElement>, () => setActive(null));

  const bottomAnimation = (index: any) => ({
    initial: { y: '25%', opacity: 0 },
    animate: inView ? { y: 0, opacity: 1 } : { y: '25%', opacity: 0 },
    transition: { duration: 0.3, delay: 0.3 + index * 0.3 },
  })

  const CloseIcon = () => {
    return (
      <motion.svg
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.05 } }}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4 text-black dark:text-white"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M18 6l-12 12" />
        <path d="M6 6l12 12" />
      </motion.svg>
    );
  };
  return (
    <section id='services'>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 h-full w-full z-10"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active && (
          <div className="fixed inset-0 grid place-items-center z-100">
            <motion.button
              key={`button-${active?.title}-${id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className="flex absolute top-2 right-2 lg:hidden items-center justify-center bg-white dark:bg-neutral-800 rounded-full h-6 w-6 z-50"
              onClick={() => setActive(null)}
            >
              <CloseIcon />
            </motion.button>
            <motion.div
              layoutId={`card-${active?.title}-${id}`}
              ref={dialogRef}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ 
                scale: 0.95, 
                opacity: 0,
                transition: { 
                  duration: 0.15,
                  ease: "easeIn"
                } 
              }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 35,
                layout: { 
                  duration: 0.2,
                  ease: "easeOut"
                }
              }}
              className="w-full max-w-[500px] h-full md:h-fit md:max-h-[90%] flex flex-col bg-white dark:bg-neutral-900 sm:rounded-3xl overflow-hidden"
            >
              <motion.div 
                layoutId={`image-${active?.title}-${id}`}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex items-center justify-center p-8 bg-linear-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900"
              >
                <Image
                  src={active?.image}
                  alt={active?.title}
                  width={80}
                  height={80}
                  className="w-20 h-20 object-contain"
                />
              </motion.div>

              <div className="flex-1 overflow-auto">
                <div className="flex flex-col gap-2 p-6">
                  <div>
                    <motion.h3
                      layoutId={`title-${active?.title}-${id}`}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={`font-bold text-xl ${active?.txt_color}  whitespace-nowrap`}
                    >
                      {active?.title.replace(/\n/g, ' ')}
                    </motion.h3>
                    {active?.description && (
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, transition: { duration: 0.1 } }}
                        transition={{ delay: 0.05, duration: 0.15 }}
                        className="text-dark_black/60 dark:text-white/60 text-sm md:text-base mt-2"
                      >
                        {active.description}
                      </motion.p>
                    )}
                  </div>
                  <div className="">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10, transition: { duration: 0.1 } }}
                      transition={{ delay: 0.1, duration: 0.15 }}
                      className="text-neutral-600 text-xs md:text-base h-40 md:h-fit flex flex-col items-start gap-4 overflow-auto dark:text-neutral-400"
                    >
                      {active?.content ? (
                        typeof active.content === "function" ? active.content() : active.content
                      ) : null}
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <div ref={ref} className='2xl:py-20 py-11'>
        <div className='container'>
          <div className='flex flex-col gap-12'>
            <div className='flex flex-col justify-center items-center gap-10 lg:gap-16'>
              <motion.div
                {...bottomAnimation(1)}
                className='max-w-(--breakpoint-Xsm) text-center'>
                <h2>
                  <TextGenerateEffect words="Built to look good and work even" delay={0.4} />
                  <TextGenerateEffect
                    words="better"
                    delay={1}
                    className="italic font-normal instrument-font"
                  />
                </h2>
              </motion.div>
              <div ref={ref} className='w-full'>
                <div
                  className='grid auto-rows-max grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6 w-full'>
                  {innovationList?.map((items: any, index: any) => {
                    return (
                      <motion.div
                        key={index}
                        layoutId={`card-${items.title}-${id}`}
                        onClick={() => setActive(items)}
                        className={`${items.bg_color} group relative flex flex-col p-8 rounded-2xl gap-6 lg:gap-9 cursor-pointer overflow-hidden`}
                        initial={{ scale: 1.2, opacity: 0, filter: 'blur(8px)' }}
                        animate={inView ? { scale: 1, opacity: 1, filter: 'blur(0px)' } : {}}
                        transition={{ duration: 0.6, delay: 0.3 + index * 0.2, ease: 'easeInOut' }}
                      >
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 rounded-2xl" />
                        <motion.div layoutId={`image-${items.title}-${id}`} className="relative z-0">
                          <Image
                            src={items.image}
                            alt='image'
                            height={40}
                            width={40}
                          />
                        </motion.div>
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                          <Icon
                            icon='icon-park-solid:circle-right-up'
                            width='32'
                            height='32'
                            className="text-white"
                          />
                        </div>
                        <div className="relative z-0">
                          <motion.h3 layoutId={`title-${items.title}-${id}`} className={`text-2xl ${items.txt_color}`}>
                            {items.title.split('\n')?.map((line: any, i: number) => (
                              <React.Fragment key={i}>
                                {line}
                                <br />
                              </React.Fragment>
                            ))}
                          </motion.h3>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </div>
            <div
              className='flex flex-col gap-4 xl:flex xl:flex-row bg-dark_black items-center justify-between dark:bg-white/5 py-8 px-7 sm:px-12 rounded-3xl w-full'>
              <h4 className='text-white text-center xl:text-left'>
                See how it actually works.
                <br /> Take a look before you judge.
              </h4>
              <div className='flex flex-col sm:flex-row gap-3 items-center'>
                <Link
                  href='/contact'
                  className='group gap-2 text-dark_black font-medium bg-white rounded-full flex items-center lg:gap-4 py-2 pl-5 pr-2 border border-white dark:border-opacity-50 hover:bg-transparent hover:text-white transition-all duration-200 ease-in-out'>
                  <span className='group-hover:translate-x-9 transform transition-transform duration-200 ease-in-out'>
                    Explore the platform
                  </span>
                  <svg
                    width='32'
                    height='32'
                    viewBox='0 0 32 32'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                    className='group-hover:-translate-x-40 group-hover:rotate-45 transition-all duration-200 ease-in-out'>
                    <rect
                      width='32'
                      height='32'
                      rx='16'
                      fill='#1B1D1E'
                      className=' transition-colors duration-200 ease-in-out group-hover:fill-white'
                    />
                    <path
                      d='M11.832 11.3335H20.1654M20.1654 11.3335V19.6668M20.1654 11.3335L11.832 19.6668'
                      stroke='white'
                      strokeWidth='1.42857'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      className='group-hover:stroke-black'
                    />
                  </svg>
                </Link>
                <Link
                  href='/#work'
                  className='group border border-white dark:border-white/50 text-white font-medium bg-dark_black gap-2 rounded-full flex items-center justify-between lg:gap-4 py-2 pl-5 pr-2 hover:opacity-95 hover:bg-transparent hover:text-white transition-all duration-200 ease-in-out'>
                  <span className='group-hover:translate-x-9 transform transition-transform duration-200 ease-in-out'>
                    View Demo
                  </span>
                  <svg
                    width='32'
                    height='32'
                    viewBox='0 0 32 32'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                    className='group-hover:-translate-x-28 group-hover:rotate-45 transition-all duration-200 ease-in-out '>
                    <rect width='32' height='32' rx='16' fill='white' />
                    <path
                      d='M11.832 11.3334H20.1654M20.1654 11.3334V19.6668M20.1654 11.3334L11.832 19.6668'
                      stroke='#1B1D1E'
                      strokeWidth='1.42857'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Innovation
