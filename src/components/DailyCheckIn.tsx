import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CloudRain, Sun, Heart, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

export default function DailyCheckIn({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [mood, setMood] = useState<string | null>(null);

  const moods = [
    { id: 'foggy', icon: CloudRain, label: 'foggy', sub: 'mind is elsewhere', color: 'var(--color-muted)' },
    { id: 'bright', icon: Sun, label: 'bright', sub: 'feeling capable', color: 'var(--color-amber)' },
    { id: 'low', icon: Heart, label: 'low energy', sub: 'surviving for now', color: 'var(--color-blush-deep)' },
    { id: 'wired', icon: Zap, label: 'wired', sub: 'hyper and restless', color: 'var(--color-teal)' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-sm z-[100]"
            style={{ background: 'rgba(22,32,42,0.3)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-0 m-auto w-[440px] max-h-[580px] nd-card shadow-2xl z-[110] flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/50">
              <div>
                <p className="nd-label text-muted">step {step} of 2</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
                <X className="w-4 h-4 text-muted" />
              </button>
            </div>

            <div className="flex-1 px-6 py-6 flex flex-col overflow-hidden">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col gap-6"
                  >
                    <div>
                      <h3 className="font-display font-light text-2xl text-ink mb-1.5">how's the weather inside?</h3>
                      <p className="text-sm text-soft-grey font-light">no judgment. just noticing.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {moods.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => { setMood(m.id); setStep(2); }}
                          className="p-5 rounded-xl border border-border/60 hover:border-border text-left transition-all group"
                          style={{ background: 'rgba(255,255,255,0.5)' }}
                        >
                          <m.icon className="w-5 h-5 mb-3 transition-transform group-hover:scale-110" style={{ color: m.color }} />
                          <p className="text-sm font-medium text-ink">{m.label}</p>
                          <p className="text-[11px] text-muted mt-0.5">{m.sub}</p>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col gap-6"
                  >
                    <div>
                      <h3 className="font-display font-light text-2xl text-ink mb-1.5">what's the one thing?</h3>
                      <p className="text-sm text-soft-grey font-light">if you only did one thing today to feel okay — what would it be?</p>
                    </div>

                    <textarea
                      autoFocus
                      placeholder="e.g. drink water, reply to that one message..."
                      className="nd-input resize-none text-sm font-display italic font-light"
                      rows={4}
                      style={{ lineHeight: '1.6' }}
                    />

                    <div className="flex gap-2.5">
                      <button
                        onClick={() => setStep(1)}
                        className="nd-button-ghost flex-1 text-sm"
                      >
                        back
                      </button>
                      <button
                        onClick={onClose}
                        className="nd-button flex-1 text-sm"
                      >
                        set the tone ✹
                      </button>
                    </div>
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
