import { Metadata } from "next";
import Link from "next/link";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";

export const metadata: Metadata = {
    title: "Page Not Made | Clubs Management System",
};

const NotMadePage = () => {
    return (
        <section>
            <div className='relative w-full pt-44 2xl:pb-20 pb-10 before:absolute before:w-full before:h-full before:bg-linear-to-r before:from-blue_gradient before:via-white before:to-yellow_gradient before:rounded-full before:top-24 before:blur-3xl before:-z-10 dark:before:from-dark_blue_gradient dark:before:via-black dark:before:to-dark_yellow_gradient dark:before:rounded-full dark:before:blur-3xl dark:before:-z-10'>
                <div className='container flex items-center justify-center min-h-[60vh]'>
                    <div className='flex flex-col items-center gap-8 text-center max-w-4xl mx-auto'>
                        <div className='space-y-4'>
                            <TextGenerateEffect words="The page you are looking for hasn't been made" className="text-5xl font-normal"/>
                            <TextGenerateEffect words="yet" className="italic font-normal instrument-font text-5xl "/>
                            <div className='max-w-xl mx-auto mt-4'>
                                <p className='text-lg text-dark_black/60 dark:text-white/70 text-center'>
                                    This page hasn't been made yet. Right now the only way to create an account is by talking to Ministers of Clubs and Initiatives to send an invitation to create one.
                                </p>
                            </div>
                        </div>
                        <div className='mt-8'>
                            <Link
                                href='/'
                                className='group w-fit text-white font-medium bg-dark_black dark:bg-white/20 dark:hover:bg-white rounded-full flex items-center gap-4 py-2 pl-5 pr-2 hover:bg-transparent border border-dark_black mx-auto'>
                                <span className='group-hover:translate-x-9 group-hover:text-dark_black transform transition-transform duration-200 ease-in-out'>
                                    Back to home
                                </span>
                                <svg
                                    width='32'
                                    height='32'
                                    viewBox='0 0 32 32'
                                    fill='none'
                                    xmlns='http://www.w3.org/2000/svg'
                                    className='group-hover:-translate-x-[125px] transition-all duration-200 ease-in-out group-hover:rotate-45'>
                                    <rect
                                        width='32'
                                        height='32'
                                        rx='16'
                                        fill='white'
                                        className='fill-white transition-colors duration-200 ease-in-out group-hover:fill-black'
                                    />
                                    <path
                                        d='M11.832 11.3334H20.1654M20.1654 11.3334V19.6668M20.1654 11.3334L11.832 19.6668'
                                        stroke='#1B1D1E'
                                        strokeWidth='1.42857'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        className='stroke-[#1B1D1E] transition-colors duration-200 ease-in-out group-hover:stroke-white'
                                    />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default NotMadePage;
