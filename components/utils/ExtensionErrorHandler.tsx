'use client';

import { useEffect } from 'react';

/**
 * Component to suppress browser extension errors that don't affect app functionality
 * These errors come from wallet extensions (MetaMask, Phantom, etc.) trying to inject providers
 */
export const ExtensionErrorHandler: React.FC = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Suppress extension-related errors
    const originalError = window.console.error;
    const originalWarn = window.console.warn;
    const originalFetch = window.fetch;

    // Filter out extension errors
    const shouldSuppressError = (args: any[]): boolean => {
      const errorString = args.join(' ').toLowerCase();

      // Suppress common extension errors
      const suppressedPatterns = [
        'cannot redefine property: ethereum',
        'cannot redefine property: solana',
        'evmask.js',
        'evmAsk.js',
        'solanaActionsContentScript.js',
        'chrome-extension://',
        'moz-extension://',
        'safari-extension://',
        '__nextjs_original-stack-frame',
        'nextjs_original-stack-frame',
        'something went wrong', // Generic Solana extension error
        'typeerror: cannot redefine property',
        'bfnaelmomeimhlpmgjnjophhpkkoljpa', // Common extension ID
        'original-stack-frame',
        'failed to load resource: the server responded with a status of 400',
        '400 (bad request)',
      ];

      return suppressedPatterns.some(pattern => errorString.includes(pattern));
    };

    // Override console.error
    window.console.error = (...args: any[]) => {
      if (!shouldSuppressError(args)) {
        originalError.apply(console, args);
      }
      // Silently suppress extension errors
    };

    // Override console.warn for extension warnings
    window.console.warn = (...args: any[]) => {
      if (!shouldSuppressError(args)) {
        originalWarn.apply(console, args);
      }
      // Silently suppress extension warnings
    };

    // Handle unhandled promise rejections from extensions
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorString = String(event.reason || '').toLowerCase();
      const errorMessage = event.reason?.message?.toLowerCase() || '';
      const errorStack = event.reason?.stack?.toLowerCase() || '';

      const isExtensionError =
        errorString.includes('ethereum') ||
        errorString.includes('solana') ||
        errorString.includes('chrome-extension') ||
        errorString.includes('moz-extension') ||
        errorString.includes('safari-extension') ||
        errorMessage.includes('cannot redefine property') ||
        errorMessage.includes('something went wrong') ||
        errorStack.includes('evmAsk.js') ||
        errorStack.includes('solanaActionsContentScript.js') ||
        errorStack.includes('evmask.js');

      if (isExtensionError) {
        event.preventDefault(); // Suppress the error
        event.stopPropagation(); // Stop event bubbling
        return;
      }
    };

    // Handle general errors from extensions
    const handleError = (event: ErrorEvent) => {
      const errorString = (event.message || '').toLowerCase();
      const filename = (event.filename || '').toLowerCase();
      const errorName = (event.error?.name || '').toLowerCase();

      // Check if this is an extension-related error
      const isExtensionError =
        errorString.includes('cannot redefine property') ||
        errorString.includes('ethereum') ||
        errorString.includes('solana') ||
        (errorName.includes('typeerror') && errorString.includes('redefine')) ||
        filename.includes('chrome-extension') ||
        filename.includes('moz-extension') ||
        filename.includes('safari-extension') ||
        filename.includes('evmask.js') ||
        filename.includes('evmAsk.js') ||
        filename.includes('solanaActionsContentScript.js') ||
        filename.includes('bfnaelmomeimhlpmgjnjophhpkkoljpa') ||
        filename.includes('__nextjs_original-stack-frame');

      if (isExtensionError) {
        event.preventDefault(); // Suppress the error
        event.stopPropagation(); // Stop event bubbling
        return false; // Prevent default error handling
      }
    };

    // Handle network errors from extension source maps and failed resource loads
    const handleResourceError = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target && 'src' in target) {
        const src = (target as any).src || '';
        if (
          src.includes('chrome-extension://') ||
          src.includes('moz-extension://') ||
          src.includes('safari-extension://') ||
          src.includes('__nextjs_original-stack-frame') ||
          src.includes('nextjs_original-stack-frame') ||
          src.includes('bfnaelmomeimhlpmgjnjophhpkkoljpa') ||
          src.includes('evmAsk.js') ||
          src.includes('solanaActionsContentScript.js')
        ) {
          event.preventDefault();
          event.stopPropagation();
          return false;
        }
      }
    };

    // Listen for resource loading errors (images, scripts, etc.)
    window.addEventListener('error', handleResourceError, true);

    // Also intercept fetch errors for extension-related requests
    window.fetch = async (...args) => {
      const url = typeof args[0] === 'string'
        ? args[0]
        : args[0] instanceof Request
          ? args[0].url
          : (args[0] as URL)?.href || '';

      // Suppress fetch requests to extension-related resources before making the request
      if (
        url.includes('chrome-extension://') ||
        url.includes('moz-extension://') ||
        url.includes('safari-extension://') ||
        url.includes('__nextjs_original-stack-frame') ||
        url.includes('nextjs_original-stack-frame') ||
        url.includes('bfnaelmomeimhlpmgjnjophhpkkoljpa')
      ) {
        // Return a rejected promise that will be caught silently
        return Promise.reject(new Error('Extension resource load suppressed'));
      }

      try {
        const response = await originalFetch(...args);

        // Also check response URL in case of redirects to extension resources
        if (
          response &&
          response.url &&
          (response.url.includes('chrome-extension://') ||
            response.url.includes('moz-extension://') ||
            response.url.includes('__nextjs_original-stack-frame'))
        ) {
          // Return a mock failed response to suppress the error
          return new Response(null, { status: 400, statusText: 'Bad Request' });
        }

        return response;
      } catch (error: any) {
        // Only suppress if it's an extension-related error
        if (
          url.includes('chrome-extension://') ||
          url.includes('moz-extension://') ||
          url.includes('__nextjs_original-stack-frame')
        ) {
          // Silently fail extension-related fetch requests
          return Promise.reject(new Error('Extension resource load suppressed'));
        }
        throw error;
      }
    };

    window.addEventListener('error', handleError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup on unmount
    return () => {
      window.console.error = originalError;
      window.console.warn = originalWarn;
      window.fetch = originalFetch;
      window.removeEventListener('error', handleError, true);
      window.removeEventListener('error', handleResourceError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null; // This component doesn't render anything
};
