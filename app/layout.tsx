import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.edge8.ai'),
  title: 'Edge8 | AI Leadership, Automation & Global Talent Solutions',
  description: 'Edge8 helps organizations become Tech-Forward through AI Leadership, AI Programs, and Global Talent Staffing. Achieve 8x efficiency.',
  openGraph: {
    title: 'Edge8 | AI Leadership, Automation & Global Talent Solutions',
    description: 'Edge8 helps organizations become Tech-Forward through AI Leadership, AI Programs, and Global Talent Staffing. Achieve 8x efficiency.',
    url: 'https://www.edge8.ai',
    siteName: 'Edge8',
    images: [{ url: '/social.jpg', width: 1200, height: 630, alt: 'Edge8' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Edge8 | AI Leadership, Automation & Global Talent Solutions',
    description: 'Edge8 helps organizations become Tech-Forward through AI Leadership, AI Programs, and Global Talent Staffing. Achieve 8x efficiency.',
    images: ['/social.jpg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  )
}
