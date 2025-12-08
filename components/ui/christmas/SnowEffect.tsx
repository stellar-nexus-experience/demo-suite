'use client';

import React from 'react';

interface SnowEffectProps {
    density?: number;
    className?: string;
}

export const SnowEffect: React.FC<SnowEffectProps> = ({
    density = 6,
    className = ''
}) => {
    const snowflakes = Array.from({ length: density }, (_, i) => i);

    return (
        <div className={`snow-effect-container ${className}`}>
            {snowflakes.map((index) => (
                <div
                    key={index}
                    className="snowflake"
                    style={{
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 3}s`,
                        animationDuration: `${3 + Math.random() * 2}s`,
                        opacity: 0.3 + Math.random() * 0.5,
                    }}
                >
                    ❄
                </div>
            ))}

            <style jsx>{`
        .snow-effect-container {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .snowflake {
          position: absolute;
          top: -10px;
          color: white;
          font-size: 12px;
          animation: snow-fall linear infinite;
          text-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
        }

        @keyframes snow-fall {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
          }
          100% {
            transform: translateY(100vh) translateX(20px) rotate(360deg);
          }
        }
      `}</style>
        </div>
    );
};
