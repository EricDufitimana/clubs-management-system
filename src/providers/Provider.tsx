'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { TRPCReactProvider } from '@/trpc/client'
import { ClubProvider } from '@/contexts/club-context'

// ❌ No MUI ThemeProvider here anymore

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <NextThemesProvider
                attribute="class"
                defaultTheme="light"   // ✅ first-time visitors get light
                enableSystem={false}   // ✅ ignore OS dark mode preference
                storageKey="crc-theme"
            >
                <TRPCReactProvider>
                    <ClubProvider>
                        {children}
                    </ClubProvider>
                </TRPCReactProvider>
            </NextThemesProvider>
        </SessionProvider>
    )
}
