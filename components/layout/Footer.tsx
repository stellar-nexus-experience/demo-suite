'use client';

import { appConfig, stellarConfig } from '@/lib/stellar/wallet-config';
import Image from 'next/image';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='bg-white/5 backdrop-blur-md border-t border-white/20 mt-16'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='text-center'>
          {/* App Information */}
          <div className='max-w-2xl mx-auto'>
            <div className='flex items-center justify-center space-x-3 mb-4'>
              <div className='-mt-4'>
                <Image
                  src='/images/logo/logoicon.png'
                  alt='STELLAR NEXUS'
                  width={150}
                  height={150}
                />
              </div>
              <div>
                <Image
                  src='/images/logo/iconletter.png'
                  alt='STELLAR NEXUS'
                  width={100}
                  height={24}
                  style={{ width: 'auto', height: 'auto' }}
                />
                <p className='text-sm text-white/60'>v{appConfig.version}</p>
              </div>
            </div>
            <p className='text-white/80 text-sm mb-4'>
              Master the art of <span className='text-brand-200 font-semibold'>Trustless Work</span>{' '}
              escrow management on the&nbsp;
              <span className='text-brand-200 font-semibold'>Stellar</span> blockchain. <br />{' '}
              Experience the future of decentralized work with{' '}
              <span className='text-brand-200 font-semibold'>Stellar Nexus Experience</span>.
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className='border-t border-white/20 mt-8 pt-8'>
          <div className='text-center space-y-4'>
            <div className='text-white/60 text-sm'>
              © {currentYear} {appConfig.name}. All rights reserved.
            </div>

            <div className='flex items-center justify-center space-x-6'>
              <span className='text-white/60 text-sm'>Built with ❤️ on Stellar</span>
              <div className='flex items-center space-x-2'>
                <span className='text-xs text-white/40'>Status:</span>
                <span className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></span>
                <span className='text-xs text-white/40'>Live</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
