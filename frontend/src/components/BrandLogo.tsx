import React from 'react';
import { Sparkles, Compass } from 'lucide-react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  showMeaning?: boolean;
  stacked?: boolean;
  className?: string;
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showTagline = false,
  showMeaning = false,
  stacked = false,
  className = '',
  onClick
}) => {
  // Dimensions based on size
  const iconSizes = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
    xl: 'h-12 w-12 text-lg'
  };

  const tamilSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-xl'
  };

  const englishSizes = {
    sm: 'text-sm font-semibold tracking-tight',
    md: 'text-base font-semibold tracking-tight',
    lg: 'text-xl font-bold tracking-tight',
    xl: 'text-2xl font-bold tracking-tight'
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center space-x-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Icon Badge: The Light of Learning */}
      <div
        className={`flex ${iconSizes[size]} shrink-0 items-center justify-center rounded-[7px] bg-[#0F766E] text-white shadow-sm border border-[#0D655E]`}
        title="KATTR0LI | கற்றொளி — The Light of Learning"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
        >
          {/* Beacon / Flame of Knowledge with Compass Orientation */}
          <path d="M12 2v4" />
          <path d="M12 18v4" />
          <path d="M4.93 4.93l2.83 2.83" />
          <path d="M16.24 16.24l2.83 2.83" />
          <path d="M2 12h4" />
          <path d="M18 12h4" />
          <path d="M4.93 19.07l2.83-2.83" />
          <path d="M16.24 7.76l2.83-2.83" />
          <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.3" />
        </svg>
      </div>

      {/* Typography: Tamil & English Identity */}
      <div className={`flex ${stacked ? 'flex-col' : 'flex-col leading-tight'}`}>
        <div className="flex items-baseline space-x-1.5">
          <span className={`font-bold text-[#0F766E] ${tamilSizes[size]}`} style={{ fontFamily: "'Noto Sans Tamil', 'IBM Plex Sans', sans-serif" }}>
            கற்றொளி
          </span>
          <span className="text-[#DDE1E7] font-light">|</span>
          <span className={`font-semibold text-[#17202A] ${englishSizes[size]}`}>
            KATTR0LI
          </span>
        </div>

        {showMeaning && (
          <span className="text-[10px] text-[#5B6573] font-medium tracking-normal mt-0.5">
            The light of learning
          </span>
        )}

        {showTagline && (
          <span className="text-[11px] text-[#0F766E] font-medium tracking-wide mt-0.5">
            Learn. Discover. Evolve.
          </span>
        )}
      </div>
    </div>
  );
};
