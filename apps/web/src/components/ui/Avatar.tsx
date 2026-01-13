'use client';

import { useState } from 'react';

interface AvatarProps {
  src: string | null | undefined;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-20 h-20',
};

/**
 * Avatar component with fallback for broken/missing images
 */
export function Avatar({ src, alt = '', size = 'md', className = '' }: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const sizeClass = sizeClasses[size];

  // Check if URL is valid and not a known broken default
  const isValidUrl = src && 
    !src.includes('default_avatar') && 
    !src.includes('default_profile') &&
    src.startsWith('http');

  if (!isValidUrl || hasError) {
    // Fallback: show initials or placeholder
    return (
      <div 
        className={`${sizeClass} border border-white/20 bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center flex-shrink-0 ${className}`}
      >
        <span className="text-white/40 text-xs font-mono">
          {alt ? alt.charAt(0).toUpperCase() : '?'}
        </span>
      </div>
    );
  }

  return (
    <div className={`${sizeClass} border border-white/20 flex-shrink-0 overflow-hidden ${className}`}>
      {isLoading && (
        <div className="w-full h-full bg-white/5 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover ${isLoading ? 'hidden' : ''}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
}
