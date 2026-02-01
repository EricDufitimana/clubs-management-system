'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import {TRPCReactProvider} from '@/trpc/client'
import { ThemeProvider } from '@/theme/theme-provider'
import { ClubProvider } from '@/contexts/club-context'
import { usePathname } from 'next/navigation'

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <NextThemesProvider attribute="class" enableSystem={true} defaultTheme="system">
                <TRPCReactProvider>
                        <ClubProvider>
                            {children}
                        </ClubProvider>
                </TRPCReactProvider>
            </NextThemesProvider>
        </SessionProvider>
    )
}
