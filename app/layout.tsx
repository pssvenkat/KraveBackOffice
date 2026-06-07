import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    template: '%s | Krave Microgreens',
    default: 'Krave Microgreens — Back Office',
  },
  description: 'Internal back-office application for Krave Microgreens — manage inventory, invoices, and receivables.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-[#0a0f1a] text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  )
}
