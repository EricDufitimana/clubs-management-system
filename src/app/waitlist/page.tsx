'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTRPC } from '@/trpc/client';
import { useMutation } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { TextGenerateEffect } from '@/components/ui/text-generate-effect';
import {X} from 'lucide-react';

interface Country {
    name: {
        common: string;
        official: string;
    };
    flags: {
        png: string;
        svg: string;
        alt?: string;
    };
    cca2: string;
}

const WaitlistPage = () => {
    const trpc = useTRPC();
    const waitlistMutation = useMutation(trpc.waitlist.submit.mutationOptions());
    const [loader, setLoader] = useState(false);
    
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedPaymentOption, setSelectedPaymentOption] = useState<'yes' | 'maybe' | 'no' | ''>('');
    const [countrySearch, setCountrySearch] = useState('');
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [countries, setCountries] = useState<Country[]>([]);
    const [loadingCountries, setLoadingCountries] = useState(true);

    // Set document title
    useEffect(() => {
        document.title = 'Join Waitlist | CMS';
    }, []);

    // Fetch countries from REST Countries API
    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const response = await fetch('https://restcountries.com/v3.1/all?fields=name,flags,cca2');
                const data: Country[] = await response.json();
                const sortedCountries = data.sort((a, b) => a.name.common.localeCompare(b.name.common));
                setCountries(sortedCountries);
            } catch (error) {
                console.error('Error fetching countries:', error);
                // Fallback to some essential countries if API fails
                setCountries([
                    { name: { common: 'United States', official: 'United States of America' }, flags: { png: '', svg: '' }, cca2: 'US' },
                    { name: { common: 'United Kingdom', official: 'United Kingdom of Great Britain and Northern Ireland' }, flags: { png: '', svg: '' }, cca2: 'GB' },
                    { name: { common: 'Canada', official: 'Canada' }, flags: { png: '', svg: '' }, cca2: 'CA' },
                    { name: { common: 'Australia', official: 'Commonwealth of Australia' }, flags: { png: '', svg: '' }, cca2: 'AU' },
                    { name: { common: 'Germany', official: 'Federal Republic of Germany' }, flags: { png: '', svg: '' }, cca2: 'DE' },
                    { name: { common: 'France', official: 'French Republic' }, flags: { png: '', svg: '' }, cca2: 'FR' },
                    { name: { common: 'Italy', official: 'Italian Republic' }, flags: { png: '', svg: '' }, cca2: 'IT' },
                    { name: { common: 'Spain', official: 'Kingdom of Spain' }, flags: { png: '', svg: '' }, cca2: 'ES' },
                    { name: { common: 'Japan', official: 'Japan' }, flags: { png: '', svg: '' }, cca2: 'JP' },
                    { name: { common: 'South Korea', official: 'Republic of Korea' }, flags: { png: '', svg: '' }, cca2: 'KR' },
                ]);
            } finally {
                setLoadingCountries(false);
            }
        };

        fetchCountries();
    }, []);

    // Convert country code to flag emoji
    const getFlagEmoji = (countryCode: string) => {
        const codePoints = countryCode
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt(0));
        return String.fromCodePoint(...codePoints);
    };

    const [formData, setFormData] = useState<{
        fullName: string;
        email: string;
        role: 'student' | 'school-administrator' | 'teacher' | '';
        schoolOrganization: string;
        country: string;
        currentMethod: 'whatsapp' | 'excel' | 'paper' | 'other' | '';
        otherMethod: string;
        willingToPay: string;
    }>({
        fullName: '',
        email: '',
        role: '',
        schoolOrganization: '',
        country: '',
        currentMethod: '',
        otherMethod: '',
        willingToPay: ''
    });

    const filteredCountries = countries.filter(country =>
        country.name.common.toLowerCase().includes(countrySearch.toLowerCase()) ||
        country.cca2.toLowerCase().includes(countrySearch.toLowerCase())
    );

    const handleCountrySelect = (country: Country) => {
        console.log('Selected country:', country.name.common);
        setFormData(prev => ({ ...prev, country: country.name.common }));
        setCountrySearch('');
        setShowCountryDropdown(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const nextStep = () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        // Validate required fields
        const missingFields = [];
        if (!formData.fullName || formData.fullName.trim() === '') missingFields.push('Full name');
        if (!formData.email || formData.email.trim() === '') missingFields.push('Email');
        if (!formData.role) missingFields.push('Role');
        if (!formData.schoolOrganization || formData.schoolOrganization.trim() === '') missingFields.push('School/Organization');
        if (!formData.country || formData.country.trim() === '') missingFields.push('Country');
        if (!formData.currentMethod) missingFields.push('Current method');
        if (!selectedPaymentOption) missingFields.push('Payment option');

        if (missingFields.length > 0) {
            console.log('Missing fields:', missingFields);
            console.log('Form data:', formData);
            console.log('Selected payment option:', selectedPaymentOption);
            toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
            return;
        }

        setLoader(true);
        try {
            const result = await waitlistMutation.mutateAsync({
                fullName: formData.fullName,
                email: formData.email,
                role: formData.role as 'student' | 'school-administrator' | 'teacher',
                schoolOrganization: formData.schoolOrganization,
                country: formData.country,
                currentMethod: formData.currentMethod as 'whatsapp' | 'excel' | 'paper' | 'other',
                otherMethod: formData.otherMethod,
                willingToPay: selectedPaymentOption as 'yes' | 'maybe' | 'no'
            });

            console.log('Waitlist submission successful:', result);
            toast.success('Successfully added to waitlist!');
            setIsSubmitted(true);
        } catch (error) {
            console.error('Submission error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to submit. Please try again.';
            toast.error(errorMessage);
        } finally {
            setLoader(false);
        }
    };

    const getStepLabel = () => {
        switch (currentStep) {
            case 1: return 'Step 1 of 3 — About you';
            case 2: return 'Step 2 of 3 — Your setup';
            case 3: return 'Step 3 of 3 — Final question';
            case 4: return '';
            default: return '';
        }
    };

    const getStepProgress = () => {
        switch (currentStep) {
            case 1: return '33%';
            case 2: return '66%';
            case 3: return '100%';
            case 4: return '100%';
            default: return '0%';
        }
    };

    if (isSubmitted) {
        return (
            <section>
                <div className='relative w-full pt-44 2xl:pb-20 pb-10 before:absolute before:w-full before:h-full before:bg-linear-to-r before:from-blue_gradient before:via-white before:to-yellow_gradient before:rounded-full before:top-24 before:blur-3xl before:-z-10 dark:before:from-dark_blue_gradient dark:before:via-black dark:before:to-dark_yellow_gradient dark:before:rounded-full dark:before:blur-3xl dark:before:-z-10'>
                    <div className='container'>
                        <div className='flex flex-col items-center gap-8 max-w-2xl mx-auto text-center'>
                            <div className='max-w-xl text-center'>
                                <h1 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-[86px] mb-6 instrument-font font-normal'>
                                    <TextGenerateEffect words="You're on the" />
                                    <TextGenerateEffect words="waitlist." className="italic" />
                                </h1>
                                <p className='text-lg text-dark_black/60 dark:text-white/60 mb-8'>
                                    We'll reach out as soon as we're ready. Keep an eye on your inbox.
                                </p>
                            </div>
                            <div>
                                <Link
                                    href='/'
                                    className='group w-fit text-white font-medium bg-dark_black dark:bg-white/20 dark:hover:bg-white rounded-full flex items-center gap-4 py-2 pl-5 pr-2 hover:bg-transparent border border-dark_black'>
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
    }

    return (
        <section>
            <div className='relative w-full pt-44 2xl:pb-20 pb-10 before:absolute before:w-full before:h-full before:bg-linear-to-r before:from-blue_gradient before:via-white before:to-yellow_gradient before:rounded-full before:top-24 before:blur-3xl before:-z-10 dark:before:from-dark_blue_gradient dark:before:via-black dark:before:to-dark_yellow_gradient dark:before:rounded-full dark:before:blur-3xl dark:before:-z-10'>
                <div className='container'>
                    <div className='flex justify-center'>
                        <div className='w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] min-h-[600px] gap-0 border-0.5px border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-white dark:bg-black/40 backdrop-blur-xl'>
                            {/* Left Panel */}
                            <div className='p-12 lg:p-10 bg-slate-200 dark:bg-black/60 flex flex-col gap-8'>
                                <div>
                                    <div className='inline-flex items-center gap-2 text-xs font-medium tracking-wider text-slate-700 border border-slate-300 rounded-full px-3 py-1 w-fit'>
                                        <span className='w-1.5 h-1.5 rounded-full bg-green-500'></span>
                                        Now accepting signups
                                    </div>
                                </div>
                                
                                <div className='flex flex-col gap-3 bg-slate-200 p-4 rounded-lg'>
                                    <h1 className='text-3xl font-medium leading-tight text-slate-900 instrument-font italic'>
                                        Be first in line.
                                    </h1>
                                    <p className='text-sm text-slate-600 leading-relaxed'>
                                        Help us validate the solution and shape the future of club management in schools. Early access members get priority onboarding and locked-in pricing.
                                    </p>
                                </div>

                                <div className='h-px bg-slate-300'></div>

                                <div className='flex flex-col gap-4'>
                                    <div className='flex items-center gap-3'>
                                        <div className='w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 flex items-center justify-center flex-shrink-0'>
                                            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-slate-600 dark:text-slate-400">
                                                <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.2"/>
                                                <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                            </svg>
                                        </div>
                                        <div className='text-sm text-slate-600'>
                                            <strong className='block text-sm font-medium text-slate-900'>50+ schools</strong>
                                            already on the waitlist
                                        </div>
                                    </div>
                                    
                                    <div className='flex items-center gap-3'>
                                        <div className='w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 flex items-center justify-center flex-shrink-0'>
                                            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-slate-600 dark:text-slate-400">
                                                <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                                                <path d="M5 7h6M5 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                            </svg>
                                        </div>
                                        <div className='text-sm text-slate-600'>
                                            <strong className='block text-sm font-medium text-slate-900'>No paper, no confusion</strong>
                                            — fully digital attendance
                                        </div>
                                    </div>
                                    
                                    <div className='flex items-center gap-3'>
                                        <div className='w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 flex items-center justify-center flex-shrink-0'>
                                            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-slate-600 dark:text-slate-400">
                                                <path d="M8 2v3M8 11v3M2 8h3M11 8h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                                <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.2"/>
                                            </svg>
                                        </div>
                                        <div className='text-sm text-slate-600'>
                                            <strong className='block text-sm font-medium text-slate-900'>Early access pricing</strong>
                                            locked in for life
                                        </div>
                                    </div>
                                </div>

                                <div className='h-px bg-slate-300'></div>

                                <div className='flex items-center gap-3'>
                                    <div className='flex'>
                                        <div className='w-7 h-7 rounded-full border-2 border-white dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-lg'>🇷🇼</div>
                                        <div className='w-7 h-7 rounded-full border-2 border-white dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-lg -ml-2'>🇬🇭</div>
                                        <div className='w-7 h-7 rounded-full border-2 border-white dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-lg -ml-2'>🇰🇪</div>
                                        <div className='w-7 h-7 rounded-full border-2 border-white dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-lg -ml-2'>🇺🇬</div>
                                    </div>
                                    <p className='text-xs text-slate-600'>
                                        Joined from 5+ countries this month
                                    </p>
                                </div>
                            </div>

                            {/* Right Panel */}
                            <div className='p-12 lg:p-10 overflow-y-auto'>
                                {/* Step Indicator */}
                                <div className='flex gap-1.5 items-center mb-6'>
                                    {[0, 1, 2].map((index) => (
                                        <div
                                            key={index}
                                            className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                                index < currentStep - 1 
                                                    ? 'bg-green-500' 
                                                    : index === currentStep - 1 
                                                        ? 'bg-purple_blue w-5 rounded' 
                                                        : 'bg-gray-300 dark:bg-gray-600'
                                            }`}
                                        />
                                    ))}
                                </div>

                                {/* Progress */}
                                <div className='mb-7'>
                                    <div className='flex justify-between mb-2'>
                                        <span className='text-xs text-gray-600 dark:text-gray-400'>{getStepLabel()}</span>
                                        <span className='text-xs text-gray-600 dark:text-gray-400'>{getStepProgress()}</span>
                                    </div>
                                    <div className='h-0.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden'>
                                        <div 
                                            className='h-full bg-purple_blue rounded-full transition-all duration-300 ease-out'
                                            style={{ width: getStepProgress() }}
                                        />
                                    </div>
                                </div>

                                {/* Step 1 */}
                                {currentStep === 1 && (
                                    <div>
                                        <p className='text-lg font-medium text-dark_black dark:text-white mb-6'>Tell us about yourself</p>
                                        <div className='flex flex-col gap-4'>
                                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                                                <div className='flex flex-col gap-1.5'>
                                                    <label className='text-xs font-medium text-gray-600 dark:text-gray-400 tracking-wide'>Full name *</label>
                                                    <input
                                                        type='text'
                                                        name='fullName'
                                                        value={formData.fullName}
                                                        onChange={handleInputChange}
                                                        className='h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black/50 text-dark_black dark:text-white text-sm outline-none focus:border-purple_blue focus:ring-2 focus:ring-purple_blue/10 transition-colors'
                                                        placeholder='Your full name'
                                                    />
                                                </div>
                                                <div className='flex flex-col gap-1.5'>
                                                    <label className='text-xs font-medium text-gray-600 dark:text-gray-400 tracking-wide'>Email address *</label>
                                                    <input
                                                        type='email'
                                                        name='email'
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        className='h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black/50 text-dark_black dark:text-white text-sm outline-none focus:border-purple_blue focus:ring-2 focus:ring-purple_blue/10 transition-colors'
                                                        placeholder='you@school.com'
                                                    />
                                                </div>
                                            </div>
                                            <div className='flex flex-col gap-1.5'>
                                                <label className='text-xs font-medium text-gray-600 dark:text-gray-400 tracking-wide'>Your role *</label>
                                                <select
                                                    name='role'
                                                    value={formData.role}
                                                    onChange={handleInputChange}
                                                    className='h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black/50 text-dark_black dark:text-white text-sm outline-none focus:border-purple_blue focus:ring-2 focus:ring-purple_blue/10 transition-colors appearance-none bg-image-none'
                                                >
                                                    <option value=''>Select your role</option>
                                                    <option value='student'>Student</option>
                                                    <option value='school-administrator'>School Administrator</option>
                                                    <option value='teacher'>Teacher / Club Supervisor</option>
                                                </select>
                                            </div>
                                            <div className='flex flex-col gap-1.5'>
                                                <label className='text-xs font-medium text-gray-600 dark:text-gray-400 tracking-wide'>School or organization *</label>
                                                <input
                                                    type='text'
                                                    name='schoolOrganization'
                                                    value={formData.schoolOrganization}
                                                    onChange={handleInputChange}
                                                    className='h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black/50 text-dark_black dark:text-white text-sm outline-none focus:border-purple_blue focus:ring-2 focus:ring-purple_blue/10 transition-colors'
                                                    placeholder='Enter your school name'
                                                />
                                            </div>
                                        </div>
                                        <div className='flex gap-2.5 mt-6'>
                                            <button
                                                onClick={nextStep}
                                                className='h-10 px-6 border border-purple_blue rounded-lg bg-purple_blue text-white text-sm font-medium cursor-pointer hover:bg-purple_blue/90 transition-colors flex-1 group items-center'
                                            >
                                                Continue <span className='group-hover:translate-x-1 transition-transform duration-200 inline-block'>→</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2 */}
                                {currentStep === 2 && (
                                    <div>
                                        <p className='text-lg font-medium text-dark_black dark:text-white mb-6'>Your current setup</p>
                                        <div className='flex flex-col gap-4'>
                                            <div className='flex flex-col gap-1.5'>
                                                <label className='text-xs font-medium text-gray-600 dark:text-gray-400 tracking-wide'>Country *</label>
                                                <div className='relative'>
                                                    <input
                                                        type='text'
                                                        name='country'
                                                        value={formData.country || countrySearch}
                                                        onChange={(e) => {
                                                            setCountrySearch(e.target.value);
                                                            setShowCountryDropdown(true);
                                                            setFormData(prev => ({ ...prev, country: '' }));
                                                        }}
                                                        onFocus={() => setShowCountryDropdown(true)}
                                                        onBlur={() => setTimeout(() => setShowCountryDropdown(false), 200)}
                                                        className='h-10 px-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black/50 text-dark_black dark:text-white text-sm outline-none focus:border-purple_blue focus:ring-2 focus:ring-purple_blue/10 transition-colors w-full'
                                                        placeholder='Search for your country...'
                                                    />
                                                    {formData.country && (
                                                        <button
                                                            type='button'
                                                            onClick={() => {
                                                                setFormData(prev => ({ ...prev, country: '' }));
                                                                setCountrySearch('');
                                                            }}
                                                            className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
                                                        >
                                                            <X size={16} strokeWidth={1.5} />
                                                        </button>
                                                    )}
                                                    {showCountryDropdown && (
                                                        <div className='absolute z-10 w-full mt-1 bg-white dark:bg-black/90 border-0.5px border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto'>
                                                            {loadingCountries ? (
                                                                <div className='px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400 text-center'>
                                                                    Loading countries...
                                                                </div>
                                                            ) : filteredCountries.length > 0 ? (
                                                                filteredCountries.map((country) => (
                                                                    <div
                                                                        key={country.cca2}
                                                                        onClick={() => handleCountrySelect(country)}
                                                                        className='px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer flex items-center gap-3 transition-colors'
                                                                    >
                                                                        <span className='text-base'>{getFlagEmoji(country.cca2)}</span>
                                                                        <span className='text-sm text-dark_black dark:text-white'>{country.name.common}</span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className='px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400 text-center'>
                                                                    No countries found
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className='flex flex-col gap-1.5'>
                                                <label className='text-xs font-medium text-gray-600 dark:text-gray-400 tracking-wide'>How do you currently manage clubs? *</label>
                                                <select
                                                    name='currentMethod'
                                                    value={formData.currentMethod}
                                                    onChange={handleInputChange}
                                                    className='h-10 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black/50 text-dark_black dark:text-white text-sm outline-none focus:border-purple_blue focus:ring-2 focus:ring-purple_blue/10 transition-colors appearance-none bg-image-none'
                                                >
                                                    <option value=''>Select current method</option>
                                                    <option value='whatsapp'>WhatsApp groups</option>
                                                    <option value='excel'>Excel / Google Sheets</option>
                                                    <option value='paper'>Paper registers</option>
                                                    <option value='other'>Other</option>
                                                </select>
                                            </div>
                                            {formData.currentMethod === 'other' && (
                                                <div className='flex flex-col gap-1.5'>
                                                    <label className='text-xs font-medium text-gray-600 dark:text-gray-400 tracking-wide'>Please explain your current method *</label>
                                                    <textarea
                                                        name='otherMethod'
                                                        value={formData.otherMethod}
                                                        onChange={handleInputChange}
                                                        rows={3}
                                                        className='px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-black/50 text-dark_black dark:text-white text-sm outline-none focus:border-purple_blue focus:ring-2 focus:ring-purple_blue/10 transition-colors resize-none'
                                                        placeholder='Please describe how you currently manage clubs...'
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className='flex gap-2.5 mt-6'>
                                            <button
                                                onClick={prevStep}
                                                className='h-10 px-5 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-600 dark:text-gray-400 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group items-center'
                                            >
                                                <span className='group-hover:-translate-x-1 transition-transform duration-200 inline-block'>←</span> Back
                                            </button>
                                            <button
                                                onClick={nextStep}
                                                className='h-10 px-6 border border-purple_blue rounded-lg bg-purple_blue text-white text-sm font-medium cursor-pointer hover:bg-purple_blue/90 transition-colors flex-1 group items-center'
                                            >
                                                Continue <span className='group-hover:translate-x-1 transition-transform duration-200 inline-block'>→</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 3 */}
                                {currentStep === 3 && (
                                    <div>
                                        <p className='text-lg font-medium text-dark_black dark:text-white mb-6'>One last thing</p>
                                        <div className='flex flex-col gap-4'>
                                            <div className='flex flex-col gap-1.5'>
                                                <label className='text-xs font-medium text-gray-600 dark:text-gray-400 tracking-wide'>Would you pay if this solves your problem? *</label>
                                                <div className='flex flex-col gap-2 mt-1'>
                                                    {[
                                                        { value: 'yes', label: 'Yes — if it works, I\'d pay for it' },
                                                        { value: 'maybe', label: 'Maybe — depends on pricing' },
                                                        { value: 'no', label: 'No — looking for a free solution' }
                                                    ].map((option, index) => (
                                                        <label
                                                            key={option.value}
                                                            className={`flex items-center gap-2.5 p-2.5 border-0.5px rounded-lg cursor-pointer text-sm text-dark_black dark:text-white transition-colors ${
                                                                selectedPaymentOption === option.value
                                                                    ? 'border-purple_blue bg-purple_blue/5'
                                                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-black/50 hover:bg-gray-50 dark:hover:bg-white/5'
                                                            }`}
                                                            onClick={() => setSelectedPaymentOption(option.value as '' | 'yes' | 'maybe' | 'no')}
                                                        >
                                                            <span
                                                                className={`w-2 h-2 rounded-full border-1.5px flex-shrink-0 transition-colors ${
                                                                    selectedPaymentOption === option.value
                                                                        ? 'border-purple_blue bg-purple_blue'
                                                                        : 'border-gray-300 dark:border-gray-600 bg-transparent'
                                                                }`}
                                                            />
                                                            {option.label}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className='flex gap-2.5 mt-6'>
                                            <button
                                                onClick={prevStep}
                                                className='h-10 px-5 border-1 border-gray-300 dark:border-gray-600 rounded-lg bg-transparent text-gray-600 dark:text-gray-400 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group items-center'
                                            >
                                                <span className='group-hover:-translate-x-1 transition-transform duration-200 inline-block'>←</span> Back
                                            </button>
                                            <button
                                                onClick={handleSubmit}
                                                disabled={!selectedPaymentOption || loader}
                                                className='h-10 px-6 border-0.5px border-purple_blue rounded-lg bg-purple_blue text-white text-sm font-medium cursor-pointer hover:bg-purple_blue/90 transition-colors flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                                            >
                                                {!loader ? (
                                                    'Join Waitlist'
                                                ) : (
                                                    <>
                                                        <div className='animate-spin inline-block size-4 border-[2px] border-current border-t-transparent text-white rounded-full' role='status' aria-label='loading'>
                                                            <span className='sr-only'>Loading...</span>
                                                        </div>
                                                        Joining...
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default WaitlistPage;
