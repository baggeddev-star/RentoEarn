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

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-xl',
};

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.charAt(0).toUpperCase();
}

function getColorFromName(name: string): string {
  const colors = [
    'from-blue-500 to-blue-700',
    'from-purple-500 to-purple-700',
    'from-pink-500 to-pink-700',
    'from-indigo-500 to-indigo-700',
    'from-cyan-500 to-cyan-700',
    'from-teal-500 to-teal-700',
    'from-emerald-500 to-emerald-700',
    'from-orange-500 to-orange-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Avatar component with fallback for broken/missing images
 */
export function Avatar({ src, alt = '', size = 'md', className = '' }: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const sizeClass = sizeClasses[size];
  const textSizeClass = textSizeClasses[size];

  // Check if URL is valid
  const isValidUrl = src && src.startsWith('http');

  if (!isValidUrl || hasError) {
    const initials = getInitials(alt);
    const gradientColor = getColorFromName(alt || 'default');
    
    return (
      <div 
        className={`${sizeClass} rounded-full bg-gradient-to-br ${gradientColor} flex items-center justify-center flex-shrink-0 ${className}`}
      >
        <span className={`text-white font-semibold ${textSizeClass}`}>
          {initials}
        </span>
      </div>
    );
  }

  return (
    <div className={`${sizeClass} rounded-full border border-white/20 flex-shrink-0 overflow-hidden bg-white/10 ${className}`}>
      {isLoading && (
        <div className="w-full h-full bg-white/10 animate-pulse" />
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
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
