import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'
import AppShell from '@/components/AppShell'

// Simple LocaleWrapper fallback if the module is missing.
// Keeps layout working while a dedicated component file is added.
function LocaleWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'InkMatching - Find Your Perfect Tattoo Artist',
  description: 'Discover talented tattoo artists and connect instantly',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <LocaleWrapper>
            <AppShell>{children}</AppShell>
          </LocaleWrapper>
        </AuthProvider>
      </body>
    </html>
  )
}
