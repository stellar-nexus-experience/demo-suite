'use client';

import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ui/ThemeContext';

export const AnimatedBackground: React.FC = () => {
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Star particles
    const stars: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      twinkle: number;
    }> = [];

    // Create stars
    const createStars = () => {
      stars.length = 0;
      const starCount = theme === 'dark' ? 200 : 50;

      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.8 + 0.2,
          twinkle: Math.random() * Math.PI * 2,
        });
      }
    };

    createStars();

    // Animation loop
    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (theme === 'dark') {
        // Dark theme - stars and space
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#0a0a0f');
        gradient.addColorStop(0.3, '#1a1a2e');
        gradient.addColorStop(0.7, '#16213e');
        gradient.addColorStop(1, '#0f0f23');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw stars
        stars.forEach(star => {
          star.x += star.vx;
          star.y += star.vy;
          star.twinkle += 0.02;

          // Wrap around edges
          if (star.x < 0) star.x = canvas.width;
          if (star.x > canvas.width) star.x = 0;
          if (star.y < 0) star.y = canvas.height;
          if (star.y > canvas.height) star.y = 0;

          // Twinkling effect
          const twinkleOpacity = star.opacity + Math.sin(star.twinkle) * 0.3;
          const clampedOpacity = Math.max(0.1, Math.min(1, twinkleOpacity));

          ctx.save();
          ctx.globalAlpha = clampedOpacity;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();

          // Add glow effect for larger stars
          if (star.size > 1.5) {
            ctx.globalAlpha = clampedOpacity * 0.3;
            ctx.fillStyle = '#4a9eff';
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        });

        // Add some shooting stars occasionally
        if (Math.random() < 0.001) {
          const shootingStar = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.3,
            vx: (Math.random() + 1) * 3,
            vy: (Math.random() + 1) * 3,
            life: 1,
          };

          const drawShootingStar = () => {
            if (shootingStar.life <= 0) return;

            ctx.save();
            ctx.globalAlpha = shootingStar.life;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(shootingStar.x, shootingStar.y);
            ctx.lineTo(shootingStar.x - 20, shootingStar.y - 20);
            ctx.stroke();
            ctx.restore();

            shootingStar.x += shootingStar.vx;
            shootingStar.y += shootingStar.vy;
            shootingStar.life -= 0.02;

            if (shootingStar.x < canvas.width && shootingStar.y < canvas.height) {
              requestAnimationFrame(drawShootingStar);
            }
          };

          drawShootingStar();
        }
      } else {
        // Light theme - sunny day with clouds
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.3, '#98D8E8');
        gradient.addColorStop(0.7, '#B0E0E6');
        gradient.addColorStop(1, '#E0F6FF');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw sun
        const sunX = canvas.width * 0.8;
        const sunY = canvas.height * 0.2;
        const sunRadius = 60;

        // Sun glow
        const sunGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 2);
        sunGradient.addColorStop(0, 'rgba(255, 255, 0, 0.3)');
        sunGradient.addColorStop(0.5, 'rgba(255, 255, 0, 0.1)');
        sunGradient.addColorStop(1, 'rgba(255, 255, 0, 0)');

        ctx.fillStyle = sunGradient;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Sun
        const sunFillGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius);
        sunFillGradient.addColorStop(0, '#FFD700');
        sunFillGradient.addColorStop(1, '#FFA500');

        ctx.fillStyle = sunFillGradient;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();

        // Sun rays
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 12; i++) {
          const angle = (i * Math.PI * 2) / 12;
          const startX = sunX + Math.cos(angle) * (sunRadius + 10);
          const startY = sunY + Math.sin(angle) * (sunRadius + 10);
          const endX = sunX + Math.cos(angle) * (sunRadius + 30);
          const endY = sunY + Math.sin(angle) * (sunRadius + 30);

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }

        // Draw clouds
        const drawCloud = (x: number, y: number, size: number) => {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.arc(x + size * 0.8, y, size * 0.8, 0, Math.PI * 2);
          ctx.arc(x + size * 1.6, y, size * 0.6, 0, Math.PI * 2);
          ctx.arc(x + size * 0.4, y - size * 0.5, size * 0.7, 0, Math.PI * 2);
          ctx.arc(x + size * 1.2, y - size * 0.3, size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        };

        // Animate clouds
        const time = Date.now() * 0.0001;
        drawCloud(100 + Math.sin(time) * 50, 100, 30);
        drawCloud(300 + Math.sin(time * 0.7) * 40, 80, 25);
        drawCloud(500 + Math.sin(time * 1.2) * 60, 120, 35);
        drawCloud(700 + Math.sin(time * 0.5) * 30, 90, 20);

        // Light particles (like dust in sunlight)
        stars.forEach(particle => {
          particle.x += particle.vx * 0.5;
          particle.y += particle.vy * 0.5;
          particle.twinkle += 0.01;

          // Wrap around edges
          if (particle.x < 0) particle.x = canvas.width;
          if (particle.x > canvas.width) particle.x = 0;
          if (particle.y < 0) particle.y = canvas.height;
          if (particle.y > canvas.height) particle.y = 0;

          const twinkleOpacity = particle.opacity + Math.sin(particle.twinkle) * 0.2;
          const clampedOpacity = Math.max(0.1, Math.min(0.6, twinkleOpacity));

          ctx.save();
          ctx.globalAlpha = clampedOpacity;
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className='fixed inset-0 w-full h-full pointer-events-none z-0'
      style={{ zIndex: -1 }}
    />
  );
};
