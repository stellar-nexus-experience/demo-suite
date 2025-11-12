import React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { config } from '@/lib/config';
import { suppressHydrationWarning } from '@/lib/utils/suppress-hydration';
import { RootProviders } from './root';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Stellar Nexus Experience | Web3 Early Adopters Program',
  description: 'Join the Stellar Nexus Experience Web3 Early Adopters Program. Master trustless work on Stellar blockchain with interactive demos, earn badges, and compete on the global leaderboard. Experience the future of decentralized work.',
  keywords: [
    'Stellar blockchain',
    'trustless work',
    'decentralized work',
    'escrow management',
    'Web3 demos',
    'blockchain education',
    'Stellar network',
    'cryptocurrency',
    'defi',
    'smart contracts',
    'early adopters',
    'leaderboard',
    'badges',
    'gamification'
  ],
  authors: [{ name: 'Stellar Nexus Team' }],
  creator: 'Stellar Nexus Experience',
  publisher: 'Stellar Nexus Experience',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://stellar-nexus-experience.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Stellar Nexus Experience | Web3 Early Adopters Program',
    description: 'Join the Stellar Nexus Experience Web3 Early Adopters Program. Master trustless work on Stellar blockchain with interactive demos, earn badges, and compete on the global leaderboard.',
    url: 'https://stellar-nexus-experience.vercel.app',
    siteName: 'Stellar Nexus Experience',
    images: [
      {
        url: '/images/logo/logoicon.png',
        width: 1200,
        height: 630,
        alt: 'Stellar Nexus Experience - Web3 Early Adopters Program',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stellar Nexus Experience | Web3 Early Adopters Program',
    description: 'Join the Stellar Nexus Experience Web3 Early Adopters Program. Master trustless work on Stellar blockchain with interactive demos, earn badges, and compete on the global leaderboard.',
    images: ['/images/logo/logoicon.png'],
    creator: '@StellarNexus',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  manifest: '/manifest.json',
  category: 'technology',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Suppress hydration warnings in development
  if (config.development.isDevelopment) {
    suppressHydrationWarning();
  }

  return (
    <html lang='en' className='scroll-smooth'>
      <body className={inter.className} suppressHydrationWarning={true}>
        {/* Google Analytics */}
        {config.analytics.enabled && config.analytics.id && (
          <GoogleAnalytics measurementId={config.analytics.id} />
        )}
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
