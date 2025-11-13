'use client';

import Script from 'next/script';
import { useEffect } from 'react';

interface GoogleAnalyticsProps {
  measurementId: string;
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  useEffect(() => {
    // Debug logging (always log for troubleshooting)
    console.log('[Google Analytics] Initializing with ID:', measurementId);
    console.log('[Google Analytics] Script will load from:', `https://www.googletagmanager.com/gtag/js?id=${measurementId}`);
  }, [measurementId]);

  if (!measurementId || measurementId.trim() === '') {
    console.warn('[Google Analytics] No measurement ID provided. Check your NEXT_PUBLIC_ANALYTICS_ID environment variable.');
    return null;
  }

  // Validate GA4 ID format (should start with G-)
  // GA4 measurement IDs follow the format: G-XXXXXXXXXX (alphanumeric after G-)
  // Note: The validation is a warning only - Google Analytics will handle invalid IDs
  if (!measurementId.startsWith('G-')) {
    console.warn(
      '[Google Analytics] Warning: Measurement ID does not start with "G-".',
      'GA4 measurement IDs should start with "G-" (e.g., G-XXXXXXXXXX).',
      'Current ID:', measurementId,
      'If this is a valid GA4 ID from your Google Analytics dashboard, you can ignore this warning.'
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

