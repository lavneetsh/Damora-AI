'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BootSequenceProps {
  onComplete: () => void;
}

const bootLines = [
  { text: 'Initializing AI Knowledge Engine...', delay: 500 },
  { text: 'Connecting PostgreSQL Memory...', delay: 400 },
  { text: 'Loading Qdrant Vector Database...', delay: 450 },
  { text: 'Embedding Intelligence Layer...', delay: 400 },
  { text: 'Mounting BullMQ Worker Pipeline...', delay: 350 },
  { text: 'System Ready.', delay: 300 },
];

export default function BootSequence({ onComplete }: BootSequenceProps) {
  const [phase, setPhase] = useState<'init' | 'title' | 'typing' | 'glow' | 'done'>('init');
  const [currentLine, setCurrentLine] = useState(0);
  const [displayedChars, setDisplayedChars] = useState(0);
  const [completedLines, setCompletedLines] = useState<number[]>([]);
  const hasCalledComplete = useRef(false);

  const safeComplete = useCallback(() => {
    if (hasCalledComplete.current) return;
    hasCalledComplete.current = true;
    onComplete();
  }, [onComplete]);

  // Check localStorage for returning visitors
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasVisited = localStorage.getItem('damora-boot-seen');
      if (hasVisited) {
        safeComplete();
        return;
      }
    }
    // Start title phase after a brief pause
    const timer = setTimeout(() => setPhase('title'), 200);
    return () => clearTimeout(timer);
  }, [safeComplete]);

  // Title → typing transition
  useEffect(() => {
    if (phase !== 'title') return;
    const timer = setTimeout(() => setPhase('typing'), 1800);
    return () => clearTimeout(timer);
  }, [phase]);

  // Typing animation
  useEffect(() => {
    if (phase !== 'typing') return;

    if (currentLine >= bootLines.length) {
      // All lines done → glow phase
      const timer = setTimeout(() => setPhase('glow'), 400);
      return () => clearTimeout(timer);
    }

    const line = bootLines[currentLine];
    if (displayedChars < line.text.length) {
      const timer = setTimeout(
        () => setDisplayedChars((prev) => prev + 1),
        25 + Math.random() * 35
      );
      return () => clearTimeout(timer);
    } else {
      // Line finished typing
      const timer = setTimeout(() => {
        setCompletedLines((prev) => [...prev, currentLine]);
        setCurrentLine((prev) => prev + 1);
        setDisplayedChars(0);
      }, line.delay);
      return () => clearTimeout(timer);
    }
  }, [phase, currentLine, displayedChars]);

  // Glow → done transition
  useEffect(() => {
    if (phase !== 'glow') return;
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('damora-boot-seen', 'true');
      }
      setPhase('done');
    }, 1000);
    return () => clearTimeout(timer);
  }, [phase]);

  // Done → call onComplete after fade-out
  useEffect(() => {
    if (phase !== 'done') return;
    const timer = setTimeout(safeComplete, 600);
    return () => clearTimeout(timer);
  }, [phase, safeComplete]);

  const handleSkip = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('damora-boot-seen', 'true');
    }
    safeComplete();
  }, [safeComplete]);

  // Don't render if already completed
  if (phase === 'init' && typeof window !== 'undefined' && localStorage.getItem('damora-boot-seen')) {
    return null;
  }

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="boot-overlay"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ background: '#050510' }}
        >
          {/* Glow effect behind text */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              opacity: phase === 'glow' ? 0.3 : 0,
            }}
            transition={{ duration: 0.8 }}
            style={{
              background:
                'radial-gradient(circle at center, rgba(108,59,250,0.4) 0%, transparent 60%)',
            }}
          />

          {/* Terminal content */}
          <div className="relative w-full max-w-lg px-6">
            {/* Title */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="font-mono text-center mb-8"
            >
              <span className="text-2xl md:text-3xl font-bold tracking-wider">
                <span className="bg-gradient-to-r from-[#6c3bfa] to-[#3b8ef8] bg-clip-text text-transparent">
                  Damora AI
                </span>
              </span>
              {phase === 'title' && (
                <span className="inline-block w-3 h-6 ml-1 bg-[#6c3bfa] animate-pulse align-middle" />
              )}
            </motion.div>

            {/* Boot lines */}
            {phase !== 'title' && phase !== 'init' && (
              <div className="space-y-2 font-mono text-xs md:text-sm">
                {bootLines.map((line, index) => {
                  if (index > currentLine && !completedLines.includes(index)) return null;

                  const isCurrentlyTyping = index === currentLine && phase === 'typing';
                  const isCompleted = completedLines.includes(index);

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-3"
                    >
                      <span className="text-slate-500 select-none">{'>'}</span>
                      <span className="text-slate-300 flex-1">
                        {isCurrentlyTyping
                          ? line.text.slice(0, displayedChars)
                          : isCompleted
                          ? line.text
                          : ''}
                        {isCurrentlyTyping && (
                          <span className="inline-block w-2 h-4 ml-0.5 bg-[#6c3bfa] animate-pulse align-middle" />
                        )}
                      </span>
                      {isCompleted && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2 }}
                          className={
                            index === bootLines.length - 1
                              ? 'text-[#6c3bfa] font-bold'
                              : 'text-emerald-400'
                          }
                        >
                          {index === bootLines.length - 1 ? '●' : '✓'}
                        </motion.span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Skip button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            whileHover={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.3 }}
            onClick={handleSkip}
            className="absolute bottom-8 right-8 text-xs text-slate-500 hover:text-slate-300 font-mono transition-colors cursor-pointer"
          >
            Skip intro →
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
