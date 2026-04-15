import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Snowflake, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { taskThaw } from '../services/gemini';

export default function FocusSpace() {
  const [task, setTask] = useState('');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [isThawing, setIsThawing] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, timeLeft]);

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleThaw = async () => {
    if (!task.trim()) return;
    setIsThawing(true);
    try {
      const response = await taskThaw(task);
      setSteps((response || '').split('\n').filter(s => s.trim()));
    } catch (error) {
      console.error('Thaw error:', error);
    } finally {
      setIsThawing(false);
    }
  };

  const progress = ((25 * 60 - timeLeft) / (25 * 60)) * 100;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="max-w-4xl mx-auto pb-16">
      <header className="mb-10">
        <h2 className="font-display font-light text-4xl text-ink mb-1.5">focus space.</h2>
        <p className="text-soft-grey italic font-display font-light">one thing at a time.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Timer */}
        <div className="nd-card p-8 flex flex-col items-center gap-8">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 absolute inset-0">
              <circle cx="96" cy="96" r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-border" />
              <motion.circle
                cx="96" cy="96" r={radius} fill="none"
                stroke="var(--color-teal)" strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                animate={{ strokeDashoffset: circumference - (circumference * progress) / 100 }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </svg>
            <div className="flex flex-col items-center z-10">
              <span className="font-mono text-4xl font-bold text-ink tracking-tighter">{formatTime(timeLeft)}</span>
              <span className="nd-label text-muted mt-1">{isActive ? 'focusing' : 'paused'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsActive(!isActive)}
              className="nd-button px-8 py-3 text-sm flex items-center gap-2"
            >
              {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isActive ? 'pause' : 'start'}
            </button>
            <button
              onClick={() => { setTimeLeft(25 * 60); setIsActive(false); }}
              className="nd-button-ghost p-3"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Task Thaw */}
        <div className="flex flex-col gap-4">
          <div className="nd-card p-6 flex flex-col gap-4">
            <div>
              <h3 className="font-display italic text-ink text-base mb-0.5">what are we doing?</h3>
              <p className="text-[11px] text-muted font-light">frozen? task thaw will break it down.</p>
            </div>
            <input
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleThaw(); }}
              placeholder="e.g. reply to that email..."
              className="nd-input text-sm"
            />
            <button
              onClick={handleThaw}
              disabled={!task.trim() || isThawing}
              className="nd-button-ghost flex items-center justify-center gap-2 py-2.5 text-sm"
              style={!task.trim() || isThawing ? undefined : {borderColor:'var(--color-teal-light)', color:'var(--color-teal)'}}
            >
              {isThawing ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
                  <Snowflake className="w-4 h-4" />
                </motion.div>
              ) : (
                <Snowflake className="w-4 h-4" />
              )}
              {isThawing ? 'thawing...' : 'task thaw ✹'}
            </button>
          </div>

          <AnimatePresence>
            {steps.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="nd-card p-5 flex flex-col gap-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <ArrowRight className="w-3.5 h-3.5 text-teal" style={{color:'var(--color-teal)'}} />
                  <span className="nd-label" style={{color:'var(--color-teal)'}}>tiny steps</span>
                </div>
                {steps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-3 p-3 rounded-xl border border-border/50 group hover:border-border hover:bg-white/50 transition-all"
                    style={{ background: 'rgba(255,255,255,0.35)' }}
                  >
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5 font-mono"
                      style={{ borderColor: 'var(--color-teal)', color: 'var(--color-teal)' }}>
                      {i + 1}
                    </div>
                    <p className="text-sm text-ink font-light leading-relaxed">{step.replace(/^\d+\.\s*/, '')}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
