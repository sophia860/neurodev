import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Heart, Zap, CloudRain, Sun } from 'lucide-react';
import { cn } from '../lib/utils';

export default function DailyCheckIn({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [mood, setMood] = useState<string | null>(null);

  const moods = [
    { id: 'foggy', icon: CloudRain, label: 'foggy', color: 'text-soft-grey' },
    { id: 'bright', icon: Sun, label: 'bright', color: 'text-terracotta' },
    { id: 'low', icon: Heart, label: 'low energy', color: 'text-dusty-blush' },
    { id: 'wired', icon: Zap, label: 'wired', color: 'text-deep-plum' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-deep-plum/40 backdrop-blur-md z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 m-auto w-[500px] h-[600px] glass-panel shadow-2xl z-[110] flex flex-col overflow-hidden"
          >
            <div className="p-8 flex justify-end">
              <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-xl transition-colors">
                <X className="w-6 h-6 text-soft-grey" />
              </button>
            </div>

            <div className="flex-1 px-12 pb-12 flex flex-col items-center text-center space-y-12">
              <div className="w-20 h-20 bg-deep-plum rounded-[32px] flex items-center justify-center text-warm-cream shadow-xl">
                <Sparkles className="w-10 h-10" />
              </div>

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="space-y-4">
                      <h3 className="text-3xl font-display font-bold text-deep-plum tracking-tight">how's the weather inside?</h3>
                      <p className="text-soft-grey italic font-display">no judgment. just noticing.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {moods.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => { setMood(m.id); setStep(2); }}
                          className="p-6 bg-white/40 border border-white/60 rounded-3xl hover:bg-white/60 transition-all flex flex-col items-center gap-3 group"
                        >
                          <m.icon className={cn("w-8 h-8 transition-transform group-hover:scale-110", m.color)} />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-soft-grey font-mono">{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8 w-full"
                  >
                    <div className="space-y-4">
                      <h3 className="text-3xl font-display font-bold text-deep-plum tracking-tight">what's the one thing?</h3>
                      <p className="text-soft-grey italic font-display">if you only did one thing today to feel okay, what would it be?</p>
                    </div>

                    <textarea 
                      placeholder="e.g., drink water, reply to mom..."
                      className="w-full h-32 bg-white/40 border-none rounded-3xl p-6 text-lg focus:ring-2 focus:ring-deep-plum/10 resize-none placeholder:text-soft-grey/30 shadow-inner font-display italic"
                    />

                    <button 
                      onClick={onClose}
                      className="w-full florr-button py-4 text-lg"
                    >
                      set the tone ✹
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
