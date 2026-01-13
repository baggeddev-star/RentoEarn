/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Two color system - void and signal
        void: {
          DEFAULT: '#09090B',
          50: '#09090B',
          100: '#0C0C0E',
          200: '#111113',
          300: '#18181B',
          400: '#27272A',
          500: '#3F3F46',
          600: '#52525B',
        },
        signal: {
          DEFAULT: '#FAFAFA',
          100: '#FAFAFA',
          200: '#E4E4E7',
          300: '#A1A1AA',
          400: '#71717A',
          500: '#52525B',
        },
      },
      fontFamily: {
        mono: ['var(--font-mono)', '"JetBrains Mono"', '"SF Mono"', '"Fira Code"', 'monospace'],
        display: ['var(--font-display)', '"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', '"Inter"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(3rem, 10vw, 7rem)', { lineHeight: '0.9', letterSpacing: '-0.04em' }],
        'display-lg': ['clamp(2rem, 6vw, 4rem)', { lineHeight: '1', letterSpacing: '-0.03em' }],
        'display-md': ['clamp(1.5rem, 4vw, 2.5rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      animation: {
        'blink': 'blink 1s step-end infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slide-down 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer': 'shimmer 1.5s infinite',
        'stripe': 'stripe 0.5s linear infinite',
        'scroll-left': 'scroll-left linear infinite',
        'scroll-right': 'scroll-right linear infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        stripe: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '16px 0' },
        },
        'scroll-left': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-33.33%)' },
        },
        'scroll-right': {
          '0%': { transform: 'translateX(-33.33%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      boxShadow: {
        'sharp': '4px 4px 0px 0px rgba(250, 250, 250, 0.1)',
        'sharp-lg': '8px 8px 0px 0px rgba(250, 250, 250, 0.1)',
        'sharp-white': '4px 4px 0px 0px #FAFAFA',
        'glow': '0 0 20px rgba(250, 250, 250, 0.15)',
        'glow-strong': '0 0 40px rgba(250, 250, 250, 0.25)',
      },
    },
  },
  plugins: [],
};
