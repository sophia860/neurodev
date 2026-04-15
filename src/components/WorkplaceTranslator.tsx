import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Languages, ArrowRight, Sparkles, MessageSquare, ShieldCheck } from 'lucide-react';
import { getFloResponse } from '../services/gemini';
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
      ? `Decode this workplace communication. What are they actually saying? What is the subtext? How should I feel about it? Keep it warm and supportive. Text: "${input}"`
      : `Help me write this workplace communication. I want to say: "${input}". Make it professional but authentic, and neurodivergent-friendly.`;

    try {
      const response = await getFloResponse([{ role: 'user', text: prompt }]);
      setTranslation(response);
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="florr-card p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-lavender-grey/30 text-deep-plum rounded-xl">
            <Languages className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold text-deep-plum font-display italic">workplace translator</h3>
        </div>
        <div className="flex bg-black/5 p-1 rounded-xl">
          <button 
            onClick={() => setMode('decode')}
            className={cn(
              "px-4 py-1.5 text-[9px] font-bold rounded-lg transition-all font-mono uppercase tracking-widest",
              mode === 'decode' ? "bg-white text-deep-plum shadow-sm" : "text-soft-grey"
            )}
          >
            decode
          </button>
          <button 
            onClick={() => setMode('encode')}
            className={cn(
              "px-4 py-1.5 text-[9px] font-bold rounded-lg transition-all font-mono uppercase tracking-widest",
              mode === 'encode' ? "bg-white text-deep-plum shadow-sm" : "text-soft-grey"
            )}
          >
            encode
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'decode' ? "paste that confusing email here..." : "what do you want to say?"}
          className="w-full h-32 bg-black/5 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-deep-plum/10 resize-none placeholder:text-soft-grey/50 font-display italic"
        />
        
        <button 
          onClick={handleTranslate}
          disabled={!input.trim() || isTranslating}
          className="w-full florr-button flex items-center justify-center gap-2"
        >
          {isTranslating ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-5 h-5" />
            </motion.div>
          ) : (
            <>
              <span>{mode === 'decode' ? 'decode subtext' : 'generate script'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {translation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="p-6 bg-sage-mist/20 border border-sage-mist/30 rounded-2xl space-y-3"
          >
            <div className="flex items-center gap-2 text-forest-green">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[9px] font-bold uppercase tracking-widest font-mono">flo's take</span>
            </div>
            <p className="text-sm text-dark-text leading-relaxed italic font-display">
              {translation}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
