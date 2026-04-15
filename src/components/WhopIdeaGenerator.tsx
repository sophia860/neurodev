import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { generateWhopIdeas, WhopIdea } from '../services/gemini';
import { cn } from '../lib/utils';

type EnergyStyle = 'low' | 'medium' | 'high';
type WorkMode = 'solo' | 'community' | 'both';
type TimeMode = 'async' | 'live' | 'mix';

export default function WhopIdeaGenerator() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [interests, setInterests] = useState('');
  const [skills, setSkills] = useState('');
  const [energyStyle, setEnergyStyle] = useState<EnergyStyle | null>(null);
  const [workMode, setWorkMode] = useState<WorkMode | null>(null);
  const [timeMode, setTimeMode] = useState<TimeMode | null>(null);
  const [ideas, setIdeas] = useState<WhopIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [frozenIdx, setFrozenIdx] = useState<number | null>(null);

  const canProceedStep1 = interests.trim().length > 0 && skills.trim().length > 0;
  const canProceedStep2 = energyStyle !== null && workMode !== null && timeMode !== null;

  const handleGenerate = async () => {
    if (!canProceedStep2) return;
    setLoading(true);
    setIdeas([]);
    try {
      const workStyleDesc = `energy: ${energyStyle}, work mode: ${workMode}, time style: ${timeMode === 'async' ? 'async-first, no live calls' : timeMode === 'live' ? 'live sessions and calls' : 'mix of async and live'}`;
      const result = await generateWhopIdeas(interests, skills, workStyleDesc);
      setIdeas(result);
      setStep(3);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const ideaColors = ['bg-slate-50 border-slate-200', 'bg-stone-50 border-stone-200', 'bg-zinc-50 border-zinc-200'];

  return (
    <div className="max-w-3xl mx-auto space-y-10 pb-16">
      <header className="space-y-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-soft-grey">whop idea generator</p>
        <h2 className="text-5xl font-display font-bold text-deep-slate tracking-tight">
          find your <em className="italic text-ocean-teal">whop niche.</em>
        </h2>
        <p className="text-soft-grey leading-relaxed max-w-lg">
          tell us a bit about yourself. we'll generate 3 specific, low-competition whop ideas — built around how your brain actually works.
        </p>
        <p className="text-[11px] text-soft-grey/60 font-mono">this saves automatically. nothing is lost if you close.</p>
      </header>

      <div className="flex items-center gap-3 mb-2">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all duration-300",
              step >= s ? "bg-deep-slate text-warm-cream" : "bg-black/8 text-soft-grey"
            )}>
              {s}
            </div>
            {s < 3 && <div className={cn("flex-1 h-[1px] transition-all duration-500", step > s ? "bg-deep-slate" : "bg-black/10")} />}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-8"
          >
            <div className="nd-card p-8 space-y-8">
              <div className="space-y-3">
                <label className="text-[11px] font-mono uppercase tracking-widest text-soft-grey">what are you into?</label>
                <p className="text-sm text-soft-grey/70 leading-relaxed">hobbies, obsessions, things you talk about without prompting. be specific — "vintage synthesizers" beats "music".</p>
                <textarea
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="e.g. sourdough baking, tabletop rpgs, accessibility design, obsessive note-taking..."
                  className="w-full h-28 nd-input resize-none text-sm"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[11px] font-mono uppercase tracking-widest text-soft-grey">what can you do?</label>
                <p className="text-sm text-soft-grey/70 leading-relaxed">skills you've picked up — even informally. include things you wouldn't normally put on a cv.</p>
                <textarea
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. writing, figma, research rabbit holes, explaining complex things simply, video editing..."
                  className="w-full h-28 nd-input resize-none text-sm"
                />
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="nd-button flex items-center gap-2"
            >
              next <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-8"
          >
            <div className="nd-card p-8 space-y-10">
              <div className="space-y-4">
                <label className="text-[11px] font-mono uppercase tracking-widest text-soft-grey">energy level</label>
                <p className="text-sm text-soft-grey/70">how much mental bandwidth do you typically have for work?</p>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { val: 'low', label: 'low energy', desc: 'short bursts, no pressure' },
                    { val: 'medium', label: 'medium energy', desc: 'steady but bounded' },
                    { val: 'high', label: 'high energy', desc: 'can go deep and long' },
                  ] as { val: EnergyStyle; label: string; desc: string }[]).map(({ val, label, desc }) => (
                    <button
                      key={val}
                      onClick={() => setEnergyStyle(val)}
                      className={cn(
                        "p-4 rounded-2xl border text-left transition-all duration-200",
                        energyStyle === val
                          ? "border-deep-slate bg-deep-slate text-warm-cream"
                          : "border-black/10 bg-white/60 hover:bg-white/80 text-dark-text"
                      )}
                    >
                      <p className="font-medium text-sm">{label}</p>
                      <p className={cn("text-[11px] mt-1", energyStyle === val ? "text-warm-cream/70" : "text-soft-grey")}>{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-mono uppercase tracking-widest text-soft-grey">solo or community?</label>
                <p className="text-sm text-soft-grey/70">how do you prefer to work with people?</p>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { val: 'solo', label: 'solo', desc: 'ship it myself, minimal interaction' },
                    { val: 'community', label: 'community', desc: 'love group energy and connection' },
                    { val: 'both', label: 'depends', desc: 'a mix depending on the day' },
                  ] as { val: WorkMode; label: string; desc: string }[]).map(({ val, label, desc }) => (
                    <button
                      key={val}
                      onClick={() => setWorkMode(val)}
                      className={cn(
                        "p-4 rounded-2xl border text-left transition-all duration-200",
                        workMode === val
                          ? "border-deep-slate bg-deep-slate text-warm-cream"
                          : "border-black/10 bg-white/60 hover:bg-white/80 text-dark-text"
                      )}
                    >
                      <p className="font-medium text-sm">{label}</p>
                      <p className={cn("text-[11px] mt-1", workMode === val ? "text-warm-cream/70" : "text-soft-grey")}>{desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-mono uppercase tracking-widest text-soft-grey">async or live?</label>
                <p className="text-sm text-soft-grey/70">scheduled calls and live sessions, or self-paced everything?</p>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { val: 'async', label: 'async only', desc: 'no calls, no scheduling' },
                    { val: 'live', label: 'live sessions', desc: 'i like real-time energy' },
                    { val: 'mix', label: 'mixed', desc: 'some of both' },
                  ] as { val: TimeMode; label: string; desc: string }[]).map(({ val, label, desc }) => (
                    <button
                      key={val}
                      onClick={() => setTimeMode(val)}
                      className={cn(
                        "p-4 rounded-2xl border text-left transition-all duration-200",
                        timeMode === val
                          ? "border-deep-slate bg-deep-slate text-warm-cream"
                          : "border-black/10 bg-white/60 hover:bg-white/80 text-dark-text"
                      )}
                    >
                      <p className="font-medium text-sm">{label}</p>
                      <p className={cn("text-[11px] mt-1", timeMode === val ? "text-warm-cream/70" : "text-soft-grey")}>{desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-3 border border-black/10 rounded-2xl text-soft-grey text-sm hover:text-dark-text transition-colors"
              >
                ← back
              </button>
              <button
                onClick={handleGenerate}
                disabled={!canProceedStep2 || loading}
                className="nd-button flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles className="w-4 h-4" />
                    </motion.div>
                    thinking...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    generate my ideas
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && ideas.length > 0 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-6"
          >
            <p className="text-sm text-soft-grey">three ideas, just for you. none of them are trading signals.</p>

            {ideas.map((idea, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.12, duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className={cn("rounded-3xl border p-8 space-y-6 transition-all duration-300", ideaColors[idx])}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <span className="text-[10px] font-mono text-soft-grey uppercase tracking-widest">idea {String(idx + 1).padStart(2, '0')}</span>
                    <p className="text-lg font-display font-bold text-deep-slate leading-snug">{idea.concept}</p>
                  </div>
                  <button
                    onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                    className="w-9 h-9 rounded-full border border-black/10 bg-white/60 flex items-center justify-center flex-shrink-0 hover:bg-white transition-colors"
                  >
                    {expandedIdx === idx ? <ChevronUp className="w-4 h-4 text-soft-grey" /> : <ChevronDown className="w-4 h-4 text-soft-grey" />}
                  </button>
                </div>

                <AnimatePresence>
                  {expandedIdx === idx && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-6 pt-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <p className="text-[10px] font-mono uppercase tracking-widest text-soft-grey">why it's underserved</p>
                            <p className="text-sm text-dark-text/80 leading-relaxed">{idea.whyUnderserved}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] font-mono uppercase tracking-widest text-soft-grey">what to charge</p>
                            <p className="text-sm text-dark-text/80 leading-relaxed">{idea.whatToCharge}</p>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <p className="text-[10px] font-mono uppercase tracking-widest text-soft-grey">first 3 steps to launch</p>
                          <div className="space-y-3">
                            {idea.firstThreeSteps.map((step, sIdx) => (
                              <div key={sIdx} className="flex items-start gap-4">
                                <span className="w-6 h-6 rounded-full bg-deep-slate text-warm-cream text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {sIdx + 1}
                                </span>
                                <p className="text-sm text-dark-text/80 leading-relaxed">{step}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {frozenIdx === idx ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-5 bg-warm-cream rounded-2xl border border-black/8"
                          >
                            <p className="text-sm text-deep-slate font-medium mb-2">that's okay. really.</p>
                            <p className="text-sm text-soft-grey leading-relaxed">
                              freezing is not failure — it means your brain is processing something real.
                            </p>
                            <p className="text-sm text-deep-slate mt-3 font-medium">
                              one tiny thing: just write the name of your idea somewhere. a note, a doc, anywhere. that's it. that counts.
                            </p>
                            <button
                              onClick={() => setFrozenIdx(null)}
                              className="mt-4 text-[11px] font-mono text-soft-grey hover:text-deep-slate transition-colors uppercase tracking-widest"
                            >
                              okay, i can do that
                            </button>
                          </motion.div>
                        ) : (
                          <button
                            onClick={() => setFrozenIdx(idx)}
                            className="text-[11px] font-mono text-soft-grey hover:text-deep-slate transition-colors uppercase tracking-widest"
                          >
                            i froze — help me start
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {expandedIdx !== idx && (
                  <button
                    onClick={() => setExpandedIdx(idx)}
                    className="text-[11px] font-mono text-soft-grey hover:text-deep-slate transition-colors uppercase tracking-widest"
                  >
                    see details →
                  </button>
                )}
              </motion.div>
            ))}

            <button
              onClick={() => { setStep(1); setIdeas([]); setExpandedIdx(null); setFrozenIdx(null); }}
              className="text-[11px] font-mono text-soft-grey hover:text-deep-slate transition-colors uppercase tracking-widest"
            >
              start again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
