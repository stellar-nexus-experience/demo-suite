'use client';

import React from 'react';

interface ChristmasHatProps {
    size?: number;
    className?: string;
    style?: React.CSSProperties;
}

export const ChristmasHat: React.FC<ChristmasHatProps> = ({
    size = 60,
    className = '',
    style = {}
}) => {
    return (
        <div
            className={`christmas-hat-container ${className}`}
            style={{
                width: `${size}px`,
                height: `${size}px`,
                ...style
            }}
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="christmas-hat-svg"
            >
                {/* Hat main body - rich red with gradient */}
                <defs>
                    <linearGradient id="hatGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#DC2626" />
                        <stop offset="100%" stopColor="#991B1B" />
                    </linearGradient>
                    <linearGradient id="furGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FFFFFF" />
                        <stop offset="100%" stopColor="#F3F4F6" />
                    </linearGradient>
                    <radialGradient id="bellGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#FCD34D" />
                        <stop offset="100%" stopColor="#F59E0B" />
                    </radialGradient>

                    {/* Sparkle filter */}
                    <filter id="sparkle">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
                        <feComponentTransfer>
                            <feFuncA type="discrete" tableValues="0 1 1 1 0" />
                        </feComponentTransfer>
                    </filter>
                </defs>

                {/* Hat cone */}
                <path
                    d="M 50 10 L 20 50 L 80 50 Z"
                    fill="url(#hatGradient)"
                    className="hat-body"
                />

                {/* White fur trim at base */}
                <ellipse
                    cx="50"
                    cy="50"
                    rx="32"
                    ry="8"
                    fill="url(#furGradient)"
                    className="hat-fur-trim sparkle-element"
                />

                {/* White pom-pom at top */}
                <circle
                    cx="50"
                    cy="10"
                    r="8"
                    fill="url(#furGradient)"
                    className="hat-pompom sparkle-element"
                />

                {/* Golden bell accent */}
                <circle
                    cx="50"
                    cy="10"
                    r="4"
                    fill="url(#bellGradient)"
                    className="hat-bell"
                />

                {/* Sparkle stars */}
                <g className="sparkle-stars">
                    <circle cx="35" cy="50" r="1.5" fill="white" opacity="0.8" className="sparkle-1" />
                    <circle cx="65" cy="50" r="1.5" fill="white" opacity="0.8" className="sparkle-2" />
                    <circle cx="50" cy="8" r="1.5" fill="white" opacity="0.8" className="sparkle-3" />
                </g>
            </svg>

            <style jsx>{`
        .christmas-hat-container {
          display: inline-block;
          animation: gentle-sway 3s ease-in-out infinite;
          transform-origin: center bottom;
        }

        @keyframes gentle-sway {
          0%, 100% {
            transform: rotate(-3deg);
          }
          50% {
            transform: rotate(3deg);
          }
        }

        .sparkle-element {
          animation: sparkle 2s ease-in-out infinite;
        }

        @keyframes sparkle {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        .sparkle-1 {
          animation: twinkle 1.5s ease-in-out infinite;
        }

        .sparkle-2 {
          animation: twinkle 1.5s ease-in-out infinite 0.5s;
        }

        .sparkle-3 {
          animation: twinkle 1.5s ease-in-out infinite 1s;
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.3);
          }
        }

        .hat-bell {
          animation: bell-shine 2s ease-in-out infinite;
        }

        @keyframes bell-shine {
          0%, 100% {
            filter: brightness(1);
          }
          50% {
            filter: brightness(1.3);
          }
        }
      `}</style>
        </div>
    );
};
