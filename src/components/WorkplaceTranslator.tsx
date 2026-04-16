import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Languages, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { getKaiResponse } from '../services/gemini';
import { cn } from '../lib/utils';

export default function WorkplaceTranslator() {
  const [input, setInput] = useState('');
  const [translation, setTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [mode, setMode] = useState<'decode' | 'encode'>('decode');

  const handleTranslate = async () => {
    if (!input.trim()) return;
    setIsTranslating(true);
    const prompt = mode === 'decode'
      ? `Decode this workplace communication. What are they actually saying? What is the subtext? Keep it warm and supportive. Text: "${input}"`
      : `Help me write this workplace communication professionally but authentically. I want to say: "${input}". Make it neurodivergent-friendly.`;
    try {
      const response = await getKaiResponse([{ role: 'user', text: prompt }]);
      setTranslation(response);
    } catch (e) {
      console.error('Translation error:', e);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="nd-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4 text-soft-grey" />
          <h3 className="font-display italic text-ink text-base">translator</h3>
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded-lg border border-border/60" style={{background:'rgba(255,255,255,0.5)'}}>
          {(['decode', 'encode'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                mode === m ? "bg-ink text-canvas shadow-sm" : "text-soft-grey hover:text-ink"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={mode === 'decode' ? "paste that confusing email here..." : "what do you want to say?"}
        className="nd-input resize-none text-sm font-display italic font-light"
        rows={3}
      />

      <button
        onClick={handleTranslate}
        disabled={!input.trim() || isTranslating}
        className="nd-button text-sm flex items-center justify-center gap-2"
      >
        {isTranslating ? (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
            <Sparkles className="w-4 h-4" />
          </motion.div>
        ) : (
          <>
            <span>{mode === 'decode' ? 'decode subtext' : 'generate script'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </>
        )}
      </button>

      <AnimatePresence>
        {translation && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="p-4 rounded-xl border"
            style={{ background: 'rgba(208,228,210,0.2)', borderColor: 'rgba(184,212,187,0.4)' }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--color-teal)' }} />
              <span className="nd-label" style={{ color: 'var(--color-teal)' }}>kai's take</span>
            </div>
            <p className="text-[12px] text-ink leading-relaxed font-display italic font-light">{translation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
