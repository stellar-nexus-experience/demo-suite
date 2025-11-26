import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  className?: string;
  variant?: 'default' | 'brand' | 'accent' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  showLabel?: boolean;
  label?: string;
}

const variantStyles = {
  default: 'bg-white/20',
  brand: 'bg-brand-500',
  accent: 'bg-accent-500',
  success: 'bg-green-500',
  warning: 'bg-warning-500',
  error: 'bg-red-500',
};

const sizeStyles = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = '',
  variant = 'default',
  size = 'md',
  animated = true,
  showLabel = false,
  label,
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className='flex justify-between items-center mb-2'>
          <span className='text-sm text-white/80'>{label || 'Progress'}</span>
          <span className='text-sm text-white/80'>{Math.round(clampedProgress)}%</span>
        </div>
      )}

      <div className={`w-full bg-white/10 rounded-full overflow-hidden ${sizeStyles[size]}`}>
        <div
          className={`${variantStyles[variant]} h-full rounded-full transition-all duration-500 ease-out ${
            animated ? 'animate-pulse' : ''
          }`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};
