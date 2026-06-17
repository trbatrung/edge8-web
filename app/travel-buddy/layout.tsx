import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Travel Buddy | EO & YPO Event Trip Coordination — Edge8',
  description:
    'Travel Buddy handles every detail of your EO and YPO event travel — flights, hotels, transfers, visas, and group logistics — so you show up ready to connect, not recover.',
  openGraph: {
    title: 'Travel Buddy | EO & YPO Event Trip Coordination',
    description:
      'AI-powered trip coordination for EO and YPO members. Show up ready, not exhausted.',
    images: ['/social.jpg'],
  },
}

export default function TravelBuddyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
