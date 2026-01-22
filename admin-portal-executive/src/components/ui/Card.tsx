import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hover = false }) => {
  return (
    <div
      className={clsx(
        'bg-card-bg rounded-xl p-6 shadow-lg',
        {
          'transition-transform hover:scale-[1.02] cursor-pointer': hover,
        },
        className
      )}
    >
      {children}
    </div>
  );
};