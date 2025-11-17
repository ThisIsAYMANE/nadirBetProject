'use client';
import { Percent, Sparkles, Trophy, X } from 'lucide-react';
import { useState } from 'react';

interface PromotionalBannerProps {
  title: string;
  description: string;
  percentage: string;
  period: string;
  type: 'slots' | 'live' | 'sports';
  onClose?: () => void;
  dismissible?: boolean;
}

export default function PromotionalBanner({
  title,
  description,
  percentage,
  period,
  type,
  onClose,
  dismissible = false,
}: PromotionalBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  const getIcon = () => {
    switch (type) {
      case 'slots':
        return <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'live':
        return <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'sports':
        return <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />;
      default:
        return <Percent className="w-5 h-5 sm:w-6 sm:h-6" />;
    }
  };

  const getGradient = () => {
    switch (type) {
      case 'slots':
        return 'from-purple-600 to-purple-400';
      case 'live':
        return 'from-red-600 to-red-400';
      case 'sports':
        return 'from-green-600 to-green-400';
      default:
        return 'from-blue-600 to-blue-400';
    }
  };

  return (
    <div className={`relative bg-gradient-to-r ${getGradient()} rounded-xl p-4 sm:p-6 mb-6 overflow-hidden`}>
      {dismissible && (
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white/80 hover:text-white transition-colors z-10"
          aria-label="Close banner"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}
      
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-shrink-0 bg-white/20 p-3 rounded-lg">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div>
              <h3 className="text-white font-bold text-lg sm:text-xl mb-1">
                {title}
              </h3>
              <p className="text-white/90 text-sm sm:text-base">
                {description}
              </p>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="text-right">
                <div className="text-2xl sm:text-3xl font-black text-white">
                  {percentage}
                </div>
                <div className="text-white/80 text-xs sm:text-sm font-medium">
                  {period}
                </div>
              </div>
              
              <button className="bg-white text-gray-900 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors text-sm sm:text-base whitespace-nowrap">
                Claim Now
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute -right-10 -top-10 w-32 h-32 sm:w-40 sm:h-40 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -right-5 -bottom-5 w-24 h-24 sm:w-32 sm:h-32 bg-white/5 rounded-full blur-xl" />
    </div>
  );
}

