'use client';

import { useEffect } from 'react';

// Error component for handling errors in the app
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {}, [error]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-neutral-900 via-brand-900 to-neutral-900 flex items-center justify-center px-4'>
      <div className='text-center'>
        <h1 className='text-6xl font-bold text-white mb-4'>⚠️</h1>
        <h2 className='text-2xl font-semibold text-brand-400 mb-6'>Something went wrong!</h2>
        <p className='text-neutral-300 mb-8 max-w-md'>
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        <div className='space-x-4'>
          <button
            onClick={reset}
            className='px-6 py-3 bg-gradient-to-r from-brand-500 to-accent-500 text-white font-semibold rounded-lg hover:from-brand-400 hover:to-accent-400 transition-all duration-300'
          >
            Try again
          </button>
          <a
            href='/'
            className='px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-lg hover:from-gray-500 hover:to-gray-600 transition-all duration-300 inline-block'
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
