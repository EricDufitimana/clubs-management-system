'use client'

import { usePathname } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import {TRPCReactProvider} from '@/trpc/client'
import { ThemeProvider } from '@/theme/theme-provider'
import { ClubProvider } from '@/contexts/club-context'

function ConditionalThemeProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isDashboard = pathname?.startsWith('/dashboard')
    
    if (isDashboard) {
        return <ThemeProvider>{children}</ThemeProvider>
    }
    
    return <>{children}</>
}

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <NextThemesProvider attribute="class" enableSystem={false} defaultTheme="light">
                <ConditionalThemeProvider>
                    <TRPCReactProvider>
                        <ClubProvider>
                            {children}
                        </ClubProvider>
                    </TRPCReactProvider>
                </ConditionalThemeProvider>
            </NextThemesProvider>
        </SessionProvider>
    )
}
