import './globals.css'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer/Footer'
import Providers from '../providers/Provider'
import { Toaster } from 'react-hot-toast'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/cms-logo-notext-dark.svg" type="image/svg+xml" />
        <link rel="icon" href="/cms-logo-notext-light.svg" type="image/svg+xml" media="(prefers-color-scheme: dark)" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  )
}
