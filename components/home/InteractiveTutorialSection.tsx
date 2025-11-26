'use client';

import Image from 'next/image';

interface InteractiveTutorialSectionProps {
  isVideoPlaying: boolean;
  onStartTutorial: () => void;
}

export const InteractiveTutorialSection = ({
  isVideoPlaying,
  onStartTutorial,
}: InteractiveTutorialSectionProps) => {
  return (
    <section
      id='interactive-tutorial'
      className={`relative w-full py-16 overflow-hidden -mb-20 mt-20 ${!isVideoPlaying ? 'animate-fadeIn' : 'opacity-0'}`}
    >
      {/* Irregular Background Shape - Full Width */}
      <div className='absolute inset-0'>
        {/* Main irregular shape using clip-path */}
        <div
          className='absolute inset-0 bg-gradient-to-br from-brand-500/20 via-accent-500/25 to-brand-400/20'
          style={{
            clipPath: 'polygon(0% 0%, 100% 8%, 92% 100%, 0% 92%)',
          }}
        ></div>

        {/* Secondary irregular shape overlay */}
        <div
          className='absolute inset-0 bg-gradient-to-tr from-accent-500/15 via-transparent to-brand-500/15'
          style={{
            clipPath: 'polygon(8% 0%, 100% 0%, 88% 100%, 0% 100%)',
          }}
        ></div>

        {/* Floating geometric elements */}
        <div className='absolute top-16 left-16 w-40 h-40 bg-gradient-to-r from-brand-400/25 to-accent-400/25 rounded-full blur-2xl animate-pulse'></div>
        <div
          className='absolute top-24 right-24 w-32 h-32 bg-gradient-to-r from-accent-400/25 to-brand-400/25 rounded-full blur-2xl animate-pulse'
          style={{ animationDelay: '1s' }}
        ></div>
        <div
          className='absolute bottom-24 left-24 w-36 h-36 bg-gradient-to-r from-brand-500/25 to-accent-500/25 rounded-full blur-2xl animate-pulse'
          style={{ animationDelay: '2s' }}
        ></div>
        <div
          className='absolute bottom-16 right-16 w-28 h-28 bg-gradient-to-r from-accent-500/25 to-brand-500/25 rounded-full blur-2xl animate-pulse'
          style={{ animationDelay: '3s' }}
        ></div>

        {/* Diagonal lines for texture */}
        <div className='absolute inset-0 opacity-15'>
          <div className='absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent transform rotate-12'></div>
          <div className='absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent transform -rotate-6'></div>
          <div className='absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent transform rotate-8'></div>
          <div className='absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent transform -rotate-4'></div>
          <div className='absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white to-transparent transform rotate-15'></div>
        </div>

        {/* Corner accents */}
        <div className='absolute top-0 left-0 w-40 h-40 border-l-4 border-t-4 border-brand-400/40 rounded-tl-3xl'></div>
        <div className='absolute top-0 right-0 w-40 h-40 border-r-4 border-t-4 border-accent-400/40 rounded-tr-3xl'></div>
        <div className='absolute bottom-0 left-0 w-40 h-40 border-l-4 border-b-4 border-accent-400/40 rounded-bl-3xl'></div>
        <div className='absolute bottom-0 right-0 w-40 h-40 border-r-4 border-b-4 border-brand-400/40 rounded-br-3xl'></div>
      </div>

      {/* Content */}
      <div className='relative z-10 max-w-6xl mx-auto px-4 text-center'>
        <div className='mb-12'>
          <h3 className='text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-accent-400 mb-6 drop-shadow-2xl'>
            🎓 Tutorial
          </h3>
          <p className='text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed'>
            New to Trustless Work or Stellar? <br /> Start with our tutorial to learn how everything
            works!
          </p>
        </div>

        <div className='mb-8 flex justify-center'>
          <button
            onClick={onStartTutorial}
            className='px-8 py-4 bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-white/20 hover:border-white/40'
          >
            <div className='flex items-center space-x-2'>
              <Image
                src='/images/character/baby.png'
                alt='Tutorial'
                width={50}
                height={50}
                style={{ width: 'auto', height: 'auto' }}
                className='rounded-full'
              />
              <span>Interactive Tutorial</span>
            </div>
          </button>
        </div>

        <div className='mt-4 text-center'>
          <p className='text-brand-300 text-sm animate-pulse'>
            💡 New here? Start with the tutorial to learn how everything works!
          </p>
          <br />
        </div>

        <div className='grid md:grid-cols-3 gap-8 text-sm'>
          <div className='group p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden'>
            {/* Card background effect */}
            <div className='absolute inset-0 bg-gradient-to-br from-brand-500/5 to-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>

            <div className='relative z-10'>
              <div className='text-4xl mb-4 group-hover:scale-110 transition-transform duration-300'>
                <Image
                  src='/images/icons/demos.png'
                  alt='Hands-on'
                  width={50}
                  height={50}
                  style={{ width: 'auto', height: 'auto', margin: '0 auto' }}
                />
              </div>
              <div className='font-semibold text-white/90 mb-2 text-base'>Quick Start</div>
              <div className='text-white/70'>
                Learn the basics in just a few minutes by going through the{' '}
                <span className='text-brand-300 font-bold'>Trustless Work</span> demos
              </div>
            </div>
          </div>

          <div className='group p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden'>
            {/* Card background effect */}
            <div className='absolute inset-0 bg-gradient-to-br from-accent-500/5 to-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>

            <div className='relative z-10'>
              <div className='text-4xl mb-4 group-hover:scale-105 transition-transform duration-300'>
                <Image
                  src='/images/icons/console.png'
                  alt='Hands-on'
                  width={50}
                  height={50}
                  style={{ width: 'auto', height: 'auto', margin: '0 auto' }}
                />
              </div>
              <div className='font-semibold text-white/90 mb-2 text-base'>Hands-on</div>
              <div className='text-white/70'>
                Interactive games and real scenarios to test your skills in the{' '}
                <span className='text-brand-300 font-bold'>Nexus Web3 Playground</span>
              </div>
            </div>
          </div>

          <div className='group p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden'>
            {/* Card background effect */}
            <div className='absolute inset-0 bg-gradient-to-br from-brand-500/5 to-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>

            <div className='relative z-10'>
              <div className='text-4xl mb-4 group-hover:scale-110 transition-transform duration-300'>
                <Image
                  src='/images/character/nexus-prime-chat.png'
                  alt='Smart Tips'
                  width={50}
                  height={50}
                  className='rounded-full bg-gradient-to-r from-cyan-400/20 to-purple-400/20'
                  style={{ height: 'auto', margin: '0 auto' }}
                />
              </div>
              <div className='font-semibold text-white/90 mb-2 text-base'>NEXUS PRIME</div>
              <div className='text-white/70'>Guardian of STELLAR NEXUS</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
