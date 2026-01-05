'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import {TRPCReactProvider} from '@/trpc/client'
import { ThemeProvider } from '@/theme/theme-provider'
import { ClubProvider } from '@/contexts/club-context'
import { usePathname } from 'next/navigation'

function ConditionalThemeProvider({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    
    // Use MUI ThemeProvider for dashboard routes (required for MUI components)
    if (pathname?.startsWith('/dashboard')) {
        return <ThemeProvider>{children}</ThemeProvider>
    }
    
    // For landing pages, use only NextThemesProvider (no MUI theme)
    return <>{children}</>
}

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <NextThemesProvider attribute="class" enableSystem={true} defaultTheme="system">
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
