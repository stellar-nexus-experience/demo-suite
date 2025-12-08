'use client';

import React, { useEffect, useState } from 'react';

interface Snowflake {
    id: number;
    left: number;
    animationDuration: number;
    animationDelay: number;
    fontSize: number;
    opacity: number;
}

export const BackgroundSnow: React.FC = () => {
    const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);

    useEffect(() => {
        // Generate snowflakes
        const flakes: Snowflake[] = [];
        const numberOfSnowflakes = 50; // Moderate amount for smooth performance

        for (let i = 0; i < numberOfSnowflakes; i++) {
            flakes.push({
                id: i,
                left: Math.random() * 100, // Random position across screen width
                animationDuration: 10 + Math.random() * 20, // 10-30 seconds fall time
                animationDelay: Math.random() * 10, // Stagger start times
                fontSize: 10 + Math.random() * 15, // Varying sizes
                opacity: 0.3 + Math.random() * 0.5, // Varying opacity
            });
        }

        setSnowflakes(flakes);
    }, []);

    return (
        <div className="background-snow-container">
            {snowflakes.map((flake) => (
                <div
                    key={flake.id}
                    className="snowflake"
                    style={{
                        left: `${flake.left}%`,
                        animationDuration: `${flake.animationDuration}s`,
                        animationDelay: `${flake.animationDelay}s`,
                        fontSize: `${flake.fontSize}px`,
                        opacity: flake.opacity,
                    }}
                >
                    ❄
                </div>
            ))}

            <style jsx>{`
        .background-snow-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
          overflow: hidden;
        }

        .snowflake {
          position: absolute;
          top: -20px;
          color: white;
          user-select: none;
          animation: snowfall linear infinite;
          text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
        }

        @keyframes snowfall {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
          }
          100% {
            transform: translateY(100vh) translateX(50px) rotate(360deg);
          }
        }

        /* Add subtle sway for more natural movement */
        .snowflake:nth-child(3n) {
          animation-name: snowfall-sway-1;
        }

        .snowflake:nth-child(3n+1) {
          animation-name: snowfall-sway-2;
        }

        .snowflake:nth-child(3n+2) {
          animation-name: snowfall-sway-3;
        }

        @keyframes snowfall-sway-1 {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
          }
          25% {
            transform: translateY(25vh) translateX(20px) rotate(90deg);
          }
          50% {
            transform: translateY(50vh) translateX(-10px) rotate(180deg);
          }
          75% {
            transform: translateY(75vh) translateX(30px) rotate(270deg);
          }
          100% {
            transform: translateY(100vh) translateX(0) rotate(360deg);
          }
        }

        @keyframes snowfall-sway-2 {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
          }
          25% {
            transform: translateY(25vh) translateX(-15px) rotate(90deg);
          }
          50% {
            transform: translateY(50vh) translateX(25px) rotate(180deg);
          }
          75% {
            transform: translateY(75vh) translateX(-20px) rotate(270deg);
          }
          100% {
            transform: translateY(100vh) translateX(10px) rotate(360deg);
          }
        }

        @keyframes snowfall-sway-3 {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
          }
          25% {
            transform: translateY(25vh) translateX(10px) rotate(90deg);
          }
          50% {
            transform: translateY(50vh) translateX(-25px) rotate(180deg);
          }
          75% {
            transform: translateY(75vh) translateX(15px) rotate(270deg);
          }
          100% {
            transform: translateY(100vh) translateX(-5px) rotate(360deg);
          }
        }
      `}</style>
        </div>
    );
};
