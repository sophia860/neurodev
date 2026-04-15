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

  const canStep1 = interests.trim().length > 0 && skills.trim().length > 0;
  const canStep2 = energyStyle !== null && workMode !== null && timeMode !== null;

  const handleGenerate = async () => {
    if (!canStep2) return;
    setLoading(true);
    setIdeas([]);
    try {
      const workStyleDesc = `energy: ${energyStyle}, work mode: ${workMode}, time style: ${timeMode === 'async' ? 'async-first, no live calls' : timeMode === 'live' ? 'live sessions' : 'mix of async and live'}`;
      const result = await generateWhopIdeas(interests, skills, workStyleDesc);
      setIdeas(result);
      setStep(3);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const SelectButton = ({ active, label, desc, onClick }: { active: boolean; label: string; desc: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={cn("p-4 rounded-xl border text-left transition-all",
        active ? "border-transparent text-canvas" : "border-border/60 hover:border-border"
      )}
      style={active ? { background: 'var(--color-ink)' } : { background: 'rgba(255,255,255,0.5)' }}
    >
      <p className="text-sm font-medium">{label}</p>
      <p className={cn("text-[11px] mt-0.5", active ? "text-canvas/60" : "text-muted")}>{desc}</p>
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto pb-16 space-y-8">
      <header>
        <p className="nd-label text-muted mb-2">whop idea generator</p>
        <h2 className="font-display font-light text-4xl text-ink mb-2">
          find your <em className="italic" style={{color:'var(--color-teal)'}}>whop niche.</em>
        </h2>
        <p className="text-soft-grey text-sm leading-relaxed max-w-md font-light">
          tell us about yourself. we'll generate 3 specific, low-competition whop ideas — built around how your brain works.
        </p>
      </header>

      <div className="flex items-center gap-2 mb-2">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-mono font-bold transition-all",
              step >= s ? "bg-ink text-canvas" : "border border-border text-muted"
            )}>
              {s}
            </div>
            {s < 3 && <div className={cn("flex-1 h-px transition-all", step > s ? "bg-ink" : "bg-border")} />}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.35, ease: [0.23,1,0.32,1] }} className="space-y-6">
            <div className="nd-card p-6 space-y-6">
              <div className="space-y-2">
                <p className="nd-label text-muted">what are you into?</p>
                <p className="text-[12px] text-muted font-light">"vintage synthesizers" beats "music" — be specific.</p>
                <textarea value={interests} onChange={(e) => setInterests(e.target.value)}
                  placeholder="e.g. sourdough baking, tabletop rpgs, accessibility design..."
                  className="nd-input resize-none text-sm font-display italic font-light" rows={3} />
              </div>
              <div className="space-y-2">
                <p className="nd-label text-muted">what can you do?</p>
                <p className="text-[12px] text-muted font-light">include things you wouldn't put on a cv.</p>
                <textarea value={skills} onChange={(e) => setSkills(e.target.value)}
                  placeholder="e.g. writing, figma, research rabbit holes, explaining complex things..."
                  className="nd-input resize-none text-sm font-display italic font-light" rows={3} />
              </div>
            </div>
            <button onClick={() => setStep(2)} disabled={!canStep1} className="nd-button text-sm flex items-center gap-2">
              next <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.35, ease: [0.23,1,0.32,1] }} className="space-y-6">
            <div className="nd-card p-6 space-y-8">
              <div className="space-y-3">
                <p className="nd-label text-muted">energy level</p>
                <p className="text-[12px] text-muted font-light">how much mental bandwidth do you typically have?</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { val: 'low', label: 'low energy', desc: 'short bursts' },
                    { val: 'medium', label: 'medium', desc: 'steady but bounded' },
                    { val: 'high', label: 'high energy', desc: 'go deep and long' },
                  ] as { val: EnergyStyle; label: string; desc: string }[]).map(({ val, label, desc }) => (
                    <SelectButton key={val} active={energyStyle === val} label={label} desc={desc} onClick={() => setEnergyStyle(val)} />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="nd-label text-muted">solo or community?</p>
                <p className="text-[12px] text-muted font-light">how do you prefer to work with people?</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { val: 'solo', label: 'solo', desc: 'minimal interaction' },
                    { val: 'community', label: 'community', desc: 'group energy' },
                    { val: 'both', label: 'depends', desc: 'mix depending on day' },
                  ] as { val: WorkMode; label: string; desc: string }[]).map(({ val, label, desc }) => (
                    <SelectButton key={val} active={workMode === val} label={label} desc={desc} onClick={() => setWorkMode(val)} />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="nd-label text-muted">async or live?</p>
                <p className="text-[12px] text-muted font-light">scheduled calls, or self-paced everything?</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { val: 'async', label: 'async only', desc: 'no calls' },
                    { val: 'live', label: 'live sessions', desc: 'real-time energy' },
                    { val: 'mix', label: 'mixed', desc: 'some of both' },
                  ] as { val: TimeMode; label: string; desc: string }[]).map(({ val, label, desc }) => (
                    <SelectButton key={val} active={timeMode === val} label={label} desc={desc} onClick={() => setTimeMode(val)} />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => setStep(1)} className="nd-button-ghost text-sm px-5 py-2.5">← back</button>
              <button onClick={handleGenerate} disabled={!canStep2 || loading} className="nd-button text-sm flex items-center gap-2">
                {loading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Sparkles className="w-4 h-4" />
                  </motion.div>
                ) : <Sparkles className="w-4 h-4" />}
                {loading ? 'thinking...' : 'generate my ideas'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && ideas.length > 0 && (
          <motion.div key="s3" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.35, ease: [0.23,1,0.32,1] }} className="space-y-5">
            <p className="text-sm text-soft-grey font-light">three ideas, just for you. none of them are trading signals.</p>

            {ideas.map((idea, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.45, ease: [0.23,1,0.32,1] }}
                className="nd-card p-6 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <span className="nd-label text-muted mb-2 block">idea {String(idx + 1).padStart(2, '0')}</span>
                    <p className="font-display font-light text-ink text-lg leading-snug">{idea.concept}</p>
                  </div>
                  <button
                    onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                    className="w-8 h-8 rounded-lg border border-border/60 flex items-center justify-center shrink-0 hover:bg-black/4 transition-colors"
                    style={{background:'rgba(255,255,255,0.5)'}}
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
                      transition={{ duration: 0.3, ease: [0.23,1,0.32,1] }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-5 pt-2 border-t border-border/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <p className="nd-label text-muted mb-1.5">why it's underserved</p>
                            <p className="text-sm text-soft-grey leading-relaxed font-light">{idea.whyUnderserved}</p>
                          </div>
                          <div>
                            <p className="nd-label text-muted mb-1.5">what to charge</p>
                            <p className="text-sm text-soft-grey leading-relaxed font-light">{idea.whatToCharge}</p>
                          </div>
                        </div>

                        <div>
                          <p className="nd-label text-muted mb-3">first 3 steps</p>
                          <div className="flex flex-col gap-2">
                            {idea.firstThreeSteps.map((s, sIdx) => (
                              <div key={sIdx} className="flex items-start gap-3">
                                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold shrink-0 mt-0.5 border-2"
                                  style={{ borderColor: 'var(--color-teal)', color: 'var(--color-teal)' }}>
                                  {sIdx + 1}
                                </span>
                                <p className="text-sm text-ink font-light leading-relaxed">{s}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {frozenIdx === idx ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 rounded-xl border border-blush/40"
                            style={{ background: 'rgba(232,213,204,0.25)' }}
                          >
                            <p className="text-sm font-medium text-ink mb-1.5">that's okay. really.</p>
                            <p className="text-sm text-soft-grey leading-relaxed font-light">
                              freezing is not failure — it means your brain is processing something real.
                            </p>
                            <p className="text-sm text-ink mt-2 font-medium font-display italic">
                              one tiny thing: write the name of your idea somewhere. a note, anywhere. that counts.
                            </p>
                            <button onClick={() => setFrozenIdx(null)} className="mt-3 nd-label text-muted hover:text-soft-grey transition-colors">
                              okay, i can do that
                            </button>
                          </motion.div>
                        ) : (
                          <button onClick={() => setFrozenIdx(idx)} className="nd-label text-muted hover:text-soft-grey transition-colors self-start">
                            i froze — help me start
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {expandedIdx !== idx && (
                  <button onClick={() => setExpandedIdx(idx)} className="nd-label text-muted hover:text-soft-grey transition-colors self-start">
                    see details →
                  </button>
                )}
              </motion.div>
            ))}

            <button onClick={() => { setStep(1); setIdeas([]); setExpandedIdx(null); setFrozenIdx(null); }}
              className="nd-label text-muted hover:text-soft-grey transition-colors">
              start again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
