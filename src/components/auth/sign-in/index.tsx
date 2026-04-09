'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import SocialSignIn from '../SocialSignIn'
import Loader from '../../shared/loader'
import Logo from '../../layout/header/Logo'
import { useTRPC } from '@/trpc/client'

const Signin = () => {
  const router = useRouter()
  const pathname = usePathname()
  const trpc = useTRPC()
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
  }) //login data state

  const [validationErrors, setValidationErrors] = useState({
    email: '',
    password: '',
  }) //validation state

  const [isLoggingIn, setIsLoggingIn] = useState(false) // Loading state for spinner

  const loginMutation = useMutation({
    ...trpc.auth.login.mutationOptions(),
    onSuccess: (data) => {
      toast.success('Login successful! Redirecting...')
      // Redirect based on user role
      setTimeout(() => {
        if (data?.redirectPath) {
          router.push(data.redirectPath)
        } else {
          router.push('/dashboard')
        }
      }, 500) // Short delay for better UX
    },
    onError: (error) => {
      setIsLoggingIn(false)
      
      // Handle different types of errors with appropriate toast messages
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password. Please try again.')
      } else if (error.message.includes('User account not found')) {
        toast.error('Account not found. Please contact support.')
      } else if (error.message.includes('Unexpected token')) {
        toast.error('Server error. Please try again later.')
      } else if (error.message.includes('Network') || error.message.includes('fetch')) {
        toast.error('Network error. Please check your connection.')
      } else {
        toast.error(error.message || 'An error occurred while signing in')
      }
    },
  })

  // Input validation function
  const validateForm = () => {
    let errors = { email: '', password: '' }
    let isValid = true

    if (!loginData.email) {
      errors.email = 'Email is required.'
      isValid = false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginData.email)) {
      errors.email = 'Please enter a valid email address.'
      isValid = false
    }

    if (!loginData.password) {
      errors.password = 'Password is required.'
      isValid = false
    } else if (loginData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.'
      isValid = false
    }
    setValidationErrors(errors)
    return isValid
  }

  // form handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }
    setIsLoggingIn(true) // Start loading
    loginMutation.mutate({
      email: loginData.email,
      password: loginData.password,
    })
  }

  // Add toast for validation errors
  const handleValidationErrors = () => {
    if (validationErrors.email) {
      toast.error(validationErrors.email)
    } else if (validationErrors.password) {
      toast.error(validationErrors.password)
    }
  }

  // Show validation errors when they change
  useEffect(() => {
    if (validationErrors.email || validationErrors.password) {
      handleValidationErrors()
    }
  }, [validationErrors])

  return (
    <section>
      <div className='relative w-full pt-44 2xl:pb-20 pb-10 before:absolute before:w-full before:h-full before:bg-linear-to-r before:from-blue_gradient before:via-white before:to-yellow_gradient before:rounded-full before:top-24 before:blur-3xl  before:-z-10 dark:before:from-dark_blue_gradient dark:before:via-black dark:before:to-dark_yellow_gradient dark:before:rounded-full dark:before:blur-3xl dark:before:-z-10'>
        <div className='container'>
          <div className='-mx-4 flex flex-wrap'>
            <div className='w-full px-4'>
              <div className='relative shadow-lg mx-auto max-w-32 overflow-hidden rounded-lg bg-white dark:bg-dark_black px-8 py-14 text-center sm:px-12 md:px-16'>
                <div className='mb-10 flex justify-center'>
                  <Logo />
                </div>


                <form onSubmit={handleSubmit}>
                  <div className='mb-5 text-left'>
                    <input
                      type='email'
                      placeholder='Email'
                      onChange={(e) =>
                        setLoginData({ ...loginData, email: e.target.value })
                      }
                      className={`w-full rounded-full border px-5 py-3 outline-hidden transition dark:border-white/20 dark:bg-black/40
                                                ${
                                                  validationErrors.email
                                                    ? 'border-red-500'
                                                    : 'border-stroke'
                                                } 
                                                focus:border-dark_black/50 dark:focus:border-white/50 dark:focus:border-opacity-50`}
                    />
                    {validationErrors.email && (
                      <p className='text-red-500 dark:text-red-500 text-sm mt-1'>
                        {validationErrors.email}
                      </p>
                    )}
                  </div>
                  <div className='mb-5 text-left'>
                    <input
                      type='password'
                      placeholder='Password'
                      onChange={(e) =>
                        setLoginData({ ...loginData, password: e.target.value })
                      }
                      className={`w-full rounded-full border px-5 py-3 outline-hidden transition  dark:border-white/20 dark:bg-black/40 
                                                ${
                                                  validationErrors.email
                                                    ? ' border-red-500'
                                                    : 'border-stroke'
                                                } 
                                                focus:border-dark_black/50 dark:focus:border-white/50`}
                    />
                    {validationErrors.password && (
                      <p className='text-red-500 dark:text-red-500 text-sm mt-1'>
                        {validationErrors.password}
                      </p>
                    )}
                  </div>
                  <div className='mb-9'>
                    <button
                      type='submit'
                      disabled={isLoggingIn}
                      className='flex w-full px-5 py-3 font-medium cursor-pointer items-center justify-center transition duration-300 ease-in-out rounded-full border border-dark_black bg-dark_black hover:bg-white dark:hover:bg-white/20 dark:bg-white text-white dark:hover:text-white hover:text-dark_black dark:text-dark_black disabled:opacity-50 disabled:cursor-not-allowed'>
                      {isLoggingIn ? 'Signing in...' : 'Sign In'} {isLoggingIn && <Loader />}
                    </button>
                  </div>
                </form>

                {/* <Link
                  href='/forgot-password'
                  className='mb-2 inline-block text-dark_black/50 dark:text-white/50 dark:hover:text-white/70 hover:text-dark_black'>
                  Forget Password?
                </Link> */}
           
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Signin
