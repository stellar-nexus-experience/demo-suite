import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  hover?: boolean;
  onClick?: () => void;
}

const variantStyles = {
  default: 'bg-white/10 backdrop-blur-sm border border-white/20',
  elevated: 'bg-white/15 backdrop-blur-md border border-white/30 shadow-lg',
  outlined: 'bg-transparent border border-white/30',
  filled: 'bg-white/20 backdrop-blur-sm',
};

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-12',
};

const roundedStyles = {
  none: '',
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  xl: 'rounded-2xl',
  '2xl': 'rounded-3xl',
  '3xl': 'rounded-3xl',
};

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  rounded = 'lg',
  hover = false,
  onClick,
}) => {
  const baseClasses = [
    variantStyles[variant],
    paddingStyles[padding],
    roundedStyles[rounded],
    hover && 'transition-all duration-300 transform hover:scale-105 hover:shadow-xl',
    onClick && 'cursor-pointer',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={baseClasses} onClick={onClick}>
      {children}
    </div>
  );
};
