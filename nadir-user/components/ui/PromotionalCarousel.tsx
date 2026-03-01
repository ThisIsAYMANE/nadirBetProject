'use client';
import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Sparkles, Trophy } from 'lucide-react';

import Image from 'next/image';

interface Promotion {
  title: string;
  description: string;
  percentage: string;
  period: string;
  type: 'slots' | 'live' | 'sports';
  image?: string;
}

interface PromotionalCarouselProps {
  promotions: Promotion[];
  autoplayDelay?: number;
}

export default function PromotionalCarousel({
  promotions,
  autoplayDelay = 5000
}: PromotionalCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  // Auto-scroll effect
  useEffect(() => {
    if (!emblaApi || isHovered) return;

    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, autoplayDelay);

    return () => clearInterval(interval);
  }, [emblaApi, autoplayDelay, isHovered]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'slots':
        return <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />;
      case 'live':
      case 'sports':
        return <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />;
      default:
        return <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />;
    }
  };

  const getGradient = (type: string) => {
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
    <div
      className="relative mb-6 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Carousel Container */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {promotions.map((promo, index) => (
            <div key={index} className="flex-[0_0_100%] min-w-0 px-2">
              <div className={`relative ${promo.image ? '' : `bg-gradient-to-r ${getGradient(promo.type)} p-4 sm:p-6`} rounded-xl overflow-hidden`}>
                {promo.image ? (
                  <Image
                    src={promo.image}
                    alt={promo.title}
                    width={1920}
                    height={480}
                    className="w-full h-auto object-cover"
                    priority={index === 0}
                  />
                ) : (
                  <>
                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex-shrink-0 bg-white/20 p-3 rounded-lg">
                        {getIcon(promo.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                          <div>
                            <h3 className="text-white font-bold text-lg sm:text-xl mb-1">
                              {promo.title}
                            </h3>
                            <p className="text-white/90 text-sm sm:text-base">
                              {promo.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="text-right">
                              <div className="text-2xl sm:text-3xl font-black text-white">
                                {promo.percentage}
                              </div>
                              <div className="text-white/80 text-xs sm:text-sm font-medium">
                                {promo.period}
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
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={scrollPrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 rounded-full p-2 shadow-lg transition-all opacity-0 group-hover:opacity-100 z-20"
        aria-label="Previous promotion"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 rounded-full p-2 shadow-lg transition-all opacity-0 group-hover:opacity-100 z-20"
        aria-label="Next promotion"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots Indicator */}
      {promotions.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          {promotions.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollTo(index)}
              className={`shrink-0 w-2.5 h-2.5 min-w-[10px] min-h-[10px] transition-all rounded-full ${index === selectedIndex
                  ? 'bg-white opacity-100'
                  : 'bg-gray-400 opacity-50 hover:opacity-75'
                }`}
              aria-label={`Go to promotion ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

