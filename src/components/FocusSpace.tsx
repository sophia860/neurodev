import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, CheckCircle2, Sparkles, Snowflake, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { taskThaw } from '../services/gemini';

export default function FocusSpace() {
  const [task, setTask] = useState('');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [isThawing, setIsThawing] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleThaw = async () => {
    if (!task.trim()) return;
    setIsThawing(true);
    try {
      const response = await taskThaw(task);
      const parsedSteps = response.split('\n').filter(s => s.trim());
      setSteps(parsedSteps);
    } catch (error) {
      console.error('Thaw error:', error);
    } finally {
      setIsThawing(false);
    }
  };

  const progress = ((25 * 60 - timeLeft) / (25 * 60)) * 100;

  return (
    <div className="h-full flex flex-col items-center justify-center max-w-4xl mx-auto space-y-16">
      <div className="text-center space-y-4">
        <h2 className="text-7xl font-display font-bold text-deep-plum tracking-tighter">focus space.</h2>
        <p className="text-2xl text-soft-grey italic font-display">one thing at a time. you've got this.</p>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Timer Section */}
        <div className="flex flex-col items-center space-y-12">
          <div className="relative w-80 h-80 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="160"
                cy="160"
                r="150"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-black/5"
              />
              <motion.circle
                cx="160"
                cy="160"
                r="150"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray="942"
                animate={{ strokeDashoffset: 942 - (942 * progress) / 100 }}
                transition={{ duration: 1, ease: "linear" }}
                className="text-deep-plum"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-7xl font-mono font-bold text-deep-plum tracking-tighter">
                {formatTime(timeLeft)}
              </span>
              <span className="text-[10px] font-bold text-soft-grey uppercase tracking-[0.2em] mt-2 font-mono">
                focusing ✹
              </span>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setIsActive(!isActive)}
              className="florr-button px-12 py-4 text-lg"
            >
              {isActive ? 'pause' : 'start'}
            </button>
            <button
              onClick={() => { setTimeLeft(25 * 60); setIsActive(false); }}
              className="p-4 bg-black/5 text-soft-grey rounded-2xl hover:bg-black/10 transition-colors"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Task Section */}
        <div className="space-y-8">
          <div className="florr-card p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-soft-grey uppercase tracking-widest font-mono">what are we doing?</label>
              <input
                type="text"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="e.g., reply to that email"
                className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-lg focus:ring-2 focus:ring-deep-plum/10 transition-all font-display italic"
              />
            </div>

            <button
              onClick={handleThaw}
              disabled={!task.trim() || isThawing}
              className="w-full py-4 bg-sage-mist/30 text-forest-green rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-sage-mist/50 transition-all disabled:opacity-50 font-mono text-[11px] uppercase tracking-widest"
            >
              {isThawing ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                  <Sparkles className="w-5 h-5" />
                </motion.div>
              ) : (
                <>
                  <Snowflake className="w-5 h-5" />
                  <span>task thaw ✹</span>
                </>
              )}
            </button>
          </div>

          <AnimatePresence>
            {steps.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-soft-grey">
                  <ArrowRight className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest font-mono">tiny steps</span>
                </div>
                <div className="space-y-3">
                  {steps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-5 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/40 flex items-center gap-4 group hover:bg-white/80 transition-all"
                    >
                      <div className="w-6 h-6 rounded-full border-2 border-sage-mist flex items-center justify-center text-[10px] font-bold text-forest-green group-hover:bg-sage-mist transition-colors font-mono">
                        {i + 1}
                      </div>
                      <p className="text-sm text-dark-text font-medium font-display italic tracking-tight">{step.replace(/^\d+\.\s*/, '')}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

