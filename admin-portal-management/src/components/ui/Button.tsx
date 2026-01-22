import React from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-accent-green focus:ring-offset-2 focus:ring-offset-dark-bg',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-primary-green hover:bg-primary-green/90 text-white': variant === 'primary',
          'bg-card-bg hover:bg-card-bg/80 text-white border border-gray-600': variant === 'secondary',
          'bg-red-600 hover:bg-red-700 text-white': variant === 'danger',
          'hover:bg-card-bg text-white': variant === 'ghost',
        },
        {
          'px-2 py-1 text-sm h-8': size === 'sm',
          'px-4 py-2 text-sm h-10': size === 'md',
          'px-6 py-3 text-base h-12': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};