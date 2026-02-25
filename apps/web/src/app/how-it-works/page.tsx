'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { Footer } from '@/components/layout/Footer';

function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.15, 0.1, 0.15] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
    </div>
  );
}

function HashVisualizer() {
  const [hash, setHash] = useState('a4c3b2f1e8d7c6b5');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        const newHash = Array.from({ length: 16 }, () => 
          '0123456789abcdef'[Math.floor(Math.random() * 16)]
        ).join('');
        setHash(newHash);
        setIsAnimating(false);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="font-mono text-2xl sm:text-3xl tracking-wider">
      {hash.split('').map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          animate={isAnimating ? { y: [0, -10, 0], opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 0.3, delay: i * 0.02 }}
        >
          {char}
        </motion.span>
      ))}
    </div>
  );
}

function PixelGrid() {
  const [pixels, setPixels] = useState<number[][]>([]);

  useEffect(() => {
    const generatePixels = () => {
      const grid = Array.from({ length: 8 }, () =>
        Array.from({ length: 9 }, () => Math.floor(Math.random() * 256))
      );
      setPixels(grid);
    };
    generatePixels();
    const interval = setInterval(generatePixels, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-9 gap-1">
      {pixels.flat().map((value, i) => (
        <motion.div
          key={i}
          className="w-6 h-6 sm:w-8 sm:h-8"
          style={{ backgroundColor: `rgb(${value}, ${value}, ${value})` }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.01, duration: 0.2 }}
        />
      ))}
    </div>
  );
}

function HammingVisualizer() {
  const [bits1] = useState('1010110011001100');
  const [bits2, setBits2] = useState('1010110011011100');
  const [distance, setDistance] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      const newBits = bits1.split('').map((bit) => 
        Math.random() > 0.9 ? (bit === '1' ? '0' : '1') : bit
      ).join('');
      setBits2(newBits);
      let dist = 0;
      for (let i = 0; i < bits1.length; i++) {
        if (bits1[i] !== newBits[i]) dist++;
      }
      setDistance(dist);
    }, 2500);
    return () => clearInterval(interval);
  }, [bits1]);

  return (
    <div className="space-y-3 font-mono text-xs sm:text-sm">
      <div className="flex gap-1 flex-wrap">
        <span className="text-white/50 w-20">Expected:</span>
        {bits1.split('').map((bit, i) => (
          <span key={i} className={bits1[i] !== bits2[i] ? 'text-red-400' : 'text-white/70'}>{bit}</span>
        ))}
      </div>
      <div className="flex gap-1 flex-wrap">
        <span className="text-white/50 w-20">Actual:</span>
        {bits2.split('').map((bit, i) => (
          <span key={i} className={bits1[i] !== bits2[i] ? 'text-green-400' : 'text-white/70'}>{bit}</span>
        ))}
      </div>
      <div className="pt-2 border-t border-white/10">
        <span className="text-white/50">Distance: </span>
        <span className={distance <= 10 ? 'text-green-400' : 'text-red-400'}>{distance} bits</span>
        <span className="text-white/30 ml-2">{distance <= 10 ? '✓ MATCH' : '✗ MISMATCH'}</span>
      </div>
    </div>
  );
}

function TimelineStep({ step, title, description, isActive, delay }: { 
  step: number; title: string; description: string; isActive: boolean; delay: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -50 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      className="flex gap-4 sm:gap-6"
    >
      <div className="flex flex-col items-center">
        <motion.div
          className={`w-10 h-10 sm:w-12 sm:h-12 border-2 flex items-center justify-center font-bold text-lg ${
            isActive ? 'border-white bg-white text-black' : 'border-white/30 text-white/50'
          }`}
          animate={isActive ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        >
          {step}
        </motion.div>
        <div className={`w-0.5 h-16 sm:h-20 ${isActive ? 'bg-white/50' : 'bg-white/10'}`} />
      </div>
      <div className="pt-2">
        <h4 className={`font-bold text-lg ${isActive ? 'text-white' : 'text-white/50'}`}>{title}</h4>
        <p className="text-white/40 text-sm mt-1">{description}</p>
      </div>
    </motion.div>
  );
}

function BentoCard({ children, className = '', delay = 0, hover = true }: {
  children: React.ReactNode; className?: string; delay?: number; hover?: boolean;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
      whileHover={hover ? { scale: 1.02, borderColor: 'rgba(255,255,255,0.3)' } : {}}
      className={`bg-white/[0.02] border border-white/10 backdrop-blur-sm p-6 sm:p-8 transition-all duration-300 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// SVG Icons for each step
function UploadIcon({ active, completed }: { active: boolean; completed: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <motion.rect
        x="8" y="16" width="48" height="40" rx="4"
        fill="none"
        stroke={completed ? '#22c55e' : active ? '#fff' : '#333'}
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5 }}
      />
      <motion.path
        d="M32 28 L32 44"
        stroke={completed ? '#22c55e' : active ? '#fff' : '#333'}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: active || completed ? 1 : 0.5 }}
        transition={{ duration: 0.3 }}
      />
      <motion.path
        d="M24 36 L32 28 L40 36"
        fill="none"
        stroke={completed ? '#22c55e' : active ? '#fff' : '#333'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: active || completed ? 1 : 0.5 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      />
      {active && (
        <motion.rect
          x="16" y="24" width="32" height="24" rx="2"
          fill="#fff"
          fillOpacity="0.1"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0.8, 1.1, 1], opacity: [0, 0.3, 0.1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </svg>
  );
}

function NormalizeIcon({ active, completed }: { active: boolean; completed: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      {/* Original image outline */}
      <motion.rect
        x="6" y="12" width="24" height="20" rx="2"
        fill="none"
        stroke={completed ? '#22c55e40' : active ? '#fff40' : '#33340'}
        strokeWidth="1.5"
        strokeDasharray="3 2"
        initial={{ opacity: 0 }}
        animate={{ opacity: active || completed ? 1 : 0.3 }}
      />
      {/* Arrow */}
      <motion.path
        d="M34 24 L42 24"
        stroke={completed ? '#22c55e' : active ? '#fff' : '#333'}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3 }}
      />
      <motion.path
        d="M38 20 L42 24 L38 28"
        fill="none"
        stroke={completed ? '#22c55e' : active ? '#fff' : '#333'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Normalized image (1500x500 ratio = 3:1) */}
      <motion.rect
        x="46" y="18" width="12" height="12" rx="1"
        fill={completed ? '#22c55e20' : active ? '#fff20' : 'transparent'}
        stroke={completed ? '#22c55e' : active ? '#fff' : '#333'}
        strokeWidth="2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      />
      {/* Size label */}
      <motion.text
        x="32" y="48" textAnchor="middle"
        fill={completed ? '#22c55e' : active ? '#fff' : '#666'}
        fontSize="7" fontFamily="monospace"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        1500×500
      </motion.text>
      {active && (
        <motion.rect
          x="46" y="18" width="12" height="12" rx="1"
          fill="#fff"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </svg>
  );
}

function HashIcon({ active, completed }: { active: boolean; completed: boolean }) {
  const gridSize = 3;
  const cellSize = 6;
  const startX = 20;
  const startY = 14;
  
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      {/* 9x8 pixel grid representation */}
      {Array.from({ length: gridSize * gridSize }).map((_, i) => {
        const x = startX + (i % gridSize) * (cellSize + 1);
        const y = startY + Math.floor(i / gridSize) * (cellSize + 1);
        const shade = Math.random() > 0.5 ? (completed ? '#22c55e' : '#fff') : '#333';
        return (
          <motion.rect
            key={i}
            x={x} y={y} width={cellSize} height={cellSize}
            fill={active || completed ? shade : '#222'}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, delay: i * 0.03 }}
          />
        );
      })}
      {/* Arrow */}
      <motion.path
        d="M44 22 L50 22"
        stroke={completed ? '#22c55e' : active ? '#fff' : '#333'}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <motion.path
        d="M47 19 L50 22 L47 25"
        fill="none"
        stroke={completed ? '#22c55e' : active ? '#fff' : '#333'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Hash output */}
      <motion.text
        x="32" y="48" textAnchor="middle"
        fill={completed ? '#22c55e' : active ? '#fff' : '#666'}
        fontSize="6" fontFamily="monospace"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {active ? 'a4c3b2f1...' : completed ? '64-bit ✓' : '64-bit'}
      </motion.text>
      {active && (
        <motion.rect
          x={startX - 2} y={startY - 2}
          width={gridSize * (cellSize + 1) + 2}
          height={gridSize * (cellSize + 1) + 2}
          fill="none"
          stroke="#fff"
          strokeWidth="1"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.8, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
    </svg>
  );
}

function CompareIcon({ active, completed }: { active: boolean; completed: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      {/* Expected hash bar */}
      <motion.rect
        x="8" y="16" width="48" height="8" rx="1"
        fill={completed ? '#22c55e20' : active ? '#fff10' : '#22220'}
        stroke={completed ? '#22c55e' : active ? '#fff' : '#333'}
        strokeWidth="1.5"
      />
      <motion.text x="12" y="22" fill={completed ? '#22c55e' : active ? '#fff' : '#666'} fontSize="5" fontFamily="monospace">
        EXPECTED
      </motion.text>
      
      {/* Actual hash bar */}
      <motion.rect
        x="8" y="32" width="48" height="8" rx="1"
        fill={completed ? '#22c55e20' : active ? '#fff10' : '#22220'}
        stroke={completed ? '#22c55e' : active ? '#fff' : '#333'}
        strokeWidth="1.5"
      />
      <motion.text x="12" y="38" fill={completed ? '#22c55e' : active ? '#fff' : '#666'} fontSize="5" fontFamily="monospace">
        ACTUAL
      </motion.text>
      
      {/* Comparison indicator */}
      <motion.path
        d="M32 44 L32 52"
        stroke={completed ? '#22c55e' : active ? '#fff' : '#333'}
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      />
      
      {/* Distance indicator */}
      <motion.text
        x="32" y="58" textAnchor="middle"
        fill={completed ? '#22c55e' : active ? '#fff' : '#666'}
        fontSize="6" fontFamily="monospace"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {completed ? 'dist ≤ 10 ✓' : active ? 'comparing...' : 'hamming'}
      </motion.text>
      
      {active && (
        <>
          <motion.rect
            x="8" y="16" width="48" height="8" rx="1"
            fill="#fff"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.2, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
          <motion.rect
            x="8" y="32" width="48" height="8" rx="1"
            fill="#fff"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.2, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
          />
        </>
      )}
    </svg>
  );
}

function VerifyIcon({ active, completed }: { active: boolean; completed: boolean }) {
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      {/* Shield outline */}
      <motion.path
        d="M32 8 L52 16 L52 32 C52 44 42 54 32 58 C22 54 12 44 12 32 L12 16 Z"
        fill={completed ? '#22c55e15' : active ? '#fff08' : 'transparent'}
        stroke={completed ? '#22c55e' : active ? '#fff' : '#333'}
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6 }}
      />
      
      {/* Checkmark */}
      <motion.path
        d="M22 32 L28 38 L42 24"
        fill="none"
        stroke={completed ? '#22c55e' : active ? '#fff' : '#333'}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: completed || active ? 1 : 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      />
      
      {active && (
        <motion.path
          d="M32 8 L52 16 L52 32 C52 44 42 54 32 58 C22 54 12 44 12 32 L12 16 Z"
          fill="#fff"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.2, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
      
      {completed && (
        <motion.circle
          cx="32" cy="32" r="28"
          fill="none"
          stroke="#22c55e"
          strokeWidth="1"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1.2, opacity: [0.5, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </svg>
  );
}

// Animated connecting line between steps
function ConnectingLine({ active, completed }: { active: boolean; completed: boolean }) {
  return (
    <div className="flex-1 h-16 sm:h-20 flex items-center justify-center relative mx-1 sm:mx-2">
      {/* Base line */}
      <div className="absolute w-full h-0.5 bg-white/10" />
      
      {/* Animated progress line */}
      <motion.div
        className="absolute left-0 h-0.5"
        style={{ backgroundColor: completed ? '#22c55e' : '#fff' }}
        initial={{ width: '0%' }}
        animate={{ width: completed ? '100%' : active ? '100%' : '0%' }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      />
      
      {/* Moving dot */}
      {active && (
        <motion.div
          className="absolute w-2 h-2 rounded-full bg-white"
          initial={{ left: '0%', opacity: 0 }}
          animate={{ left: '100%', opacity: [0, 1, 1, 0] }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      )}
      
      {/* Arrow head */}
      <motion.svg
        viewBox="0 0 12 12"
        className="absolute right-0 w-3 h-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: completed || active ? 1 : 0.3 }}
      >
        <path
          d="M2 2 L10 6 L2 10"
          fill="none"
          stroke={completed ? '#22c55e' : active ? '#fff' : '#333'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.svg>
    </div>
  );
}

function VerificationFlow() {
  const [activeStep, setActiveStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev >= 4) {
          setIsComplete(true);
          setTimeout(() => {
            setIsComplete(false);
            setActiveStep(0);
          }, 2000);
          return prev;
        }
        return prev + 1;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { id: 'upload', label: 'Upload', Icon: UploadIcon },
    { id: 'normalize', label: 'Normalize', Icon: NormalizeIcon },
    { id: 'hash', label: 'Hash', Icon: HashIcon },
    { id: 'compare', label: 'Compare', Icon: CompareIcon },
    { id: 'verify', label: 'Verify', Icon: VerifyIcon },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Main flow container */}
      <div className="flex items-stretch justify-between">
        {steps.map((step, i) => {
          const isActive = activeStep === i && !isComplete;
          const isCompleted = activeStep > i || isComplete;
          
          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              {/* Step card */}
              <motion.div
                className={`relative flex flex-col items-center p-2 sm:p-4 rounded-lg border transition-all duration-300 ${
                  isActive 
                    ? 'border-white bg-white/10 shadow-lg shadow-white/10' 
                    : isCompleted 
                      ? 'border-green-500/50 bg-green-500/5' 
                      : 'border-white/10 bg-white/[0.02]'
                }`}
                animate={isActive ? { scale: [1, 1.02, 1] } : {}}
                transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
                style={{ minWidth: '70px' }}
              >
                {/* Icon container */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 mb-2">
                  <step.Icon active={isActive} completed={isCompleted} />
                </div>
                
                {/* Label */}
                <span className={`text-xs sm:text-sm font-medium transition-colors ${
                  isActive ? 'text-white' : isCompleted ? 'text-green-400' : 'text-white/40'
                }`}>
                  {step.label}
                </span>
                
                {/* Active indicator dot */}
                {isActive && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white"
                    animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                )}
                
                {/* Completed checkmark */}
                {isCompleted && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    <svg viewBox="0 0 12 12" className="w-2.5 h-2.5">
                      <path d="M2 6 L5 9 L10 3" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </motion.div>
                )}
              </motion.div>
              
              {/* Connecting line (not after last step) */}
              {i < steps.length - 1 && (
                <ConnectingLine 
                  active={activeStep === i && !isComplete} 
                  completed={activeStep > i || isComplete} 
                />
              )}
            </div>
          );
        })}
      </div>
      
      {/* Status bar */}
      <motion.div 
        className="mt-6 sm:mt-8 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${
          isComplete 
            ? 'border-green-500/50 bg-green-500/10' 
            : 'border-white/20 bg-white/5'
        }`}>
          {isComplete ? (
            <>
              <motion.div
                className="w-2 h-2 rounded-full bg-green-500"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.5, repeat: 3 }}
              />
              <span className="text-green-400 text-sm font-medium">Verification Complete</span>
            </>
          ) : (
            <>
              <motion.div
                className="w-2 h-2 rounded-full bg-white"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
              <span className="text-white/60 text-sm">
                Step {activeStep + 1} of 5: <span className="text-white">{steps[activeStep]?.label}</span>
              </span>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function HowItWorksPage() {
  const [activeTimelineStep, setActiveTimelineStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTimelineStep((prev) => (prev + 1) % 5);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white">
      <GridBackground />
      
      <section className="relative pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="inline-block px-4 py-2 border border-white/20 text-white/60 text-sm tracking-widest mb-8">
              VERIFICATION TECHNOLOGY
            </span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight mb-6"
          >
            TRUST THROUGH
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/60">
              TECHNOLOGY
            </span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-white/50 text-lg sm:text-xl max-w-2xl mx-auto mb-12"
          >
            Every campaign is verified using cutting-edge perceptual hashing. No trust required—just math.
          </motion.p>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.6 }}>
            <VerificationFlow />
          </motion.div>
        </div>
      </section>

      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            
            <BentoCard className="lg:col-span-2 lg:row-span-2" delay={0.1}>
              <div className="h-full flex flex-col">
                <span className="text-white/40 text-sm tracking-widest mb-4">PERCEPTUAL HASHING</span>
                <h2 className="text-3xl sm:text-4xl font-black mb-4">dHash Algorithm</h2>
                <p className="text-white/50 mb-8 flex-grow">
                  Unlike traditional file comparison, dHash creates a visual fingerprint of your image. 
                  It&apos;s resilient to compression, resizing, and format changes—perfect for verifying 
                  Twitter headers that get re-processed on upload.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-white/60 text-sm font-semibold">9×8 PIXEL GRID</h4>
                    <PixelGrid />
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-white/60 text-sm font-semibold">64-BIT HASH OUTPUT</h4>
                    <div className="p-4 bg-black/50 border border-white/10">
                      <HashVisualizer />
                    </div>
                    <p className="text-white/30 text-xs">Each hash uniquely identifies the visual structure of an image</p>
                  </div>
                </div>
              </div>
            </BentoCard>

            <BentoCard delay={0.2}>
              <span className="text-white/40 text-sm tracking-widest">PRECISION</span>
              <div className="mt-4">
                <div className="text-6xl font-black"><AnimatedCounter value={64} /></div>
                <p className="text-white/50 mt-2">bits of visual fingerprint</p>
              </div>
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="text-3xl font-bold text-green-400">≤10</div>
                <p className="text-white/40 text-sm">bit tolerance for match</p>
              </div>
            </BentoCard>

            <BentoCard delay={0.3}>
              <span className="text-white/40 text-sm tracking-widest">COMPARISON</span>
              <h3 className="text-xl font-bold mt-4 mb-6">Hamming Distance</h3>
              <HammingVisualizer />
            </BentoCard>

            <BentoCard className="lg:col-span-2" delay={0.4}>
              <span className="text-white/40 text-sm tracking-widest">THE PROCESS</span>
              <h3 className="text-2xl font-bold mt-4 mb-8">How We Verify Your Banner</h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { step: '01', title: 'Normalize', desc: 'Resize to 1500×500' },
                  { step: '02', title: 'Grayscale', desc: 'Remove color data' },
                  { step: '03', title: 'Shrink', desc: 'Reduce to 9×8 pixels' },
                  { step: '04', title: 'Compare', desc: 'Adjacent pixel diff' },
                ].map((item) => (
                  <motion.div
                    key={item.step}
                    className="text-center p-4 border border-white/10 bg-white/[0.02]"
                    whileHover={{ borderColor: 'rgba(255,255,255,0.3)', y: -5 }}
                  >
                    <div className="text-3xl font-black text-white/20 mb-2">{item.step}</div>
                    <div className="font-semibold text-white">{item.title}</div>
                    <div className="text-white/40 text-xs mt-1">{item.desc}</div>
                  </motion.div>
                ))}
              </div>
            </BentoCard>

            <BentoCard delay={0.5}>
              <span className="text-white/40 text-sm tracking-widest">BIO SLOTS</span>
              <h3 className="text-xl font-bold mt-4 mb-4">Text Verification</h3>
              <div className="space-y-4">
                <div className="p-3 bg-black/50 border border-white/10 font-mono text-sm">
                  <span className="text-white/40">bio.includes(</span>
                  <span className="text-green-400">&quot;required_text&quot;</span>
                  <span className="text-white/40">)</span>
                </div>
                <p className="text-white/40 text-sm">
                  Simple substring matching. Case-insensitive. The exact phrase must appear in your bio.
                </p>
              </div>
            </BentoCard>

            <BentoCard className="lg:col-span-2" delay={0.6}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                  <span className="text-white/40 text-sm tracking-widest">MONITORING</span>
                  <h3 className="text-2xl font-bold mt-4">Keep-Alive Checks</h3>
                  <p className="text-white/50 mt-2">
                    Once live, we verify your banner every ~3.4 hours. 
                    <span className="text-red-400 font-semibold"> One mismatch = instant hard cancel.</span>
                  </p>
                </div>
                <div className="flex-shrink-0 text-center p-6 border border-white/10 bg-white/[0.02]">
                  <div className="text-5xl font-black">7×</div>
                  <div className="text-white/40 text-sm mt-2">checks per day</div>
                </div>
              </div>
            </BentoCard>

            <BentoCard delay={0.7}>
              <span className="text-white/40 text-sm tracking-widest">SECURITY</span>
              <h3 className="text-xl font-bold mt-4 mb-4">Zero Trust</h3>
              <ul className="space-y-3 text-white/50 text-sm">
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Automated verification</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> No human intervention</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Transparent logging</li>
                <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Instant enforcement</li>
              </ul>
            </BentoCard>

          </div>
        </div>
      </section>

      <section className="relative py-20 px-4 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-white/40 text-sm tracking-widest">VERIFICATION FLOW</span>
            <h2 className="text-4xl sm:text-5xl font-black mt-4">From Click to Live</h2>
          </motion.div>

          <div className="space-y-0">
            <TimelineStep step={1} title="Creator Applies Banner" description="Creator uploads the sponsor's banner to their X profile and clicks 'I Applied It'" isActive={activeTimelineStep === 0} delay={0.1} />
            <TimelineStep step={2} title="Initial Verification Begins" description="System polls Twitter every 60 seconds, fetching the live header image" isActive={activeTimelineStep === 1} delay={0.2} />
            <TimelineStep step={3} title="Hash Comparison" description="dHash computed and compared. Need 2 consecutive matches within 30 minutes" isActive={activeTimelineStep === 2} delay={0.3} />
            <TimelineStep step={4} title="Campaign Goes Live" description="Funds locked, campaign active. Keep-alive monitoring begins" isActive={activeTimelineStep === 3} delay={0.4} />
            <TimelineStep step={5} title="Continuous Monitoring" description="7 checks per day until campaign ends. Any mismatch triggers hard cancel" isActive={activeTimelineStep === 4} delay={0.5} />
          </div>
        </div>
      </section>

      <section className="relative py-20 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-white/40 text-sm tracking-widest">FOR DEVELOPERS</span>
            <h2 className="text-4xl sm:text-5xl font-black mt-4">Technical Specifications</h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {[
              { label: 'Algorithm', value: 'dHash' },
              { label: 'Hash Size', value: '64 bits' },
              { label: 'Grid Size', value: '9×8 px' },
              { label: 'Match Threshold', value: '≤10 bits' },
              { label: 'Normalization', value: '1500×500' },
              { label: 'Format', value: 'JPEG 90%' },
              { label: 'Poll Interval', value: '60 sec' },
              { label: 'Max Wait', value: '30 min' },
              { label: 'Required Matches', value: '2 consecutive' },
              { label: 'Keep-alive', value: '~3.4 hours' },
              { label: 'Checks/Day', value: '7' },
              { label: 'Tolerance', value: 'Zero' },
            ].map((spec, i) => (
              <motion.div
                key={spec.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-4 border border-white/10 bg-white/[0.02] text-center"
              >
                <div className="text-white/40 text-xs tracking-widest mb-2">{spec.label.toUpperCase()}</div>
                <div className="font-mono font-bold text-lg">{spec.value}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="relative py-20 px-4 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl sm:text-5xl font-black mb-6">Ready to Get Started?</h2>
            <p className="text-white/50 text-lg mb-10">Join the trustless advertising revolution. No middlemen, just verified results.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/listings" className="px-8 py-4 bg-white text-black font-bold text-lg hover:bg-white/90 transition-all">
                Browse Listings
              </Link>
              <Link href="/listings/create" className="px-8 py-4 border-2 border-white text-white font-bold text-lg hover:bg-white hover:text-black transition-all">
                Create Listing
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
