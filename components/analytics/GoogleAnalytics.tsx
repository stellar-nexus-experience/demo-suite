'use client';

import Script from 'next/script';
import { useEffect } from 'react';

interface GoogleAnalyticsProps {
  measurementId: string;
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  useEffect(() => {
    // Debug logging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Google Analytics] Initializing with ID:', measurementId);
      console.log('[Google Analytics] Script will load from:', `https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
    }
  }, [measurementId]);

  if (!measurementId || measurementId.trim() === '') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Google Analytics] No measurement ID provided. Check your NEXT_PUBLIC_ANALYTICS_ID environment variable.');
    }
    return null;
  }

  // Validate GA4 ID format (should start with G-)
  if (!measurementId.startsWith('G-')) {
    console.warn(
      '[Google Analytics] Invalid measurement ID format. GA4 IDs should start with "G-".',
      'Current ID:', measurementId
    );
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy='afterInteractive'
      />
      <Script id='google-analytics' strategy='afterInteractive'>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  );
}

