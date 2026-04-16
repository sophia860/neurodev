import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, Briefcase, Check, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Job } from '../types';
import { db, useAuth, handleFirestoreError, OperationType, collection, onSnapshot, query, addDoc, doc, updateDoc, deleteDoc } from '../services/firebase';

const SCOUT_JOBS: Omit<Job, 'id' | 'status'>[] = [
  {
    role: 'remote pa · startup',
    company: 'untitled co · london',
    pay: '£28/hr',
    signals: [{ t: 'remote', c: '' }, { t: 'flexible hours', c: '' }, { t: 'async-first', c: '' }, { t: 'low meetings', c: '' }],
    dayToDay: 'diary management, email triage, research tasks, and general admin for a fast-growing startup founder. all async, slack-based communication. you set your own hours around a core 10–4 window.',
    need: ['diary & inbox management', 'strong written communication', 'organised and self-directed'],
    nice: ['experience with founders or startups', 'notion or airtable familiarity'],
    fit: 'the async setup and flexible hours fit really well with variable energy days. no phone calls required. worth asking how they handle urgent requests.'
  },
  {
    role: 'freelance operations manager',
    company: 'bloom creative · manchester',
    pay: '£30k pro-rata',
    signals: [{ t: 'remote', c: '' }, { t: 'part-time', c: '' }, { t: 'structured role', c: '' }],
    dayToDay: 'oversee day-to-day operations for a small creative agency — process documentation, team coordination, supplier management. part-time, 3 days per week, with clear scope.',
    need: ['operations or project management', 'process documentation', 'team coordination'],
    nice: ['agency background', 'experience with clickup or monday.com'],
    fit: 'part-time and well-structured — good for protecting your rest days. the role has clear scope which means less ambiguity. some team coordination will require availability during core hours thu/fri.'
  },
  {
    role: 'content & admin support',
    company: 'halo studio · remote',
    pay: '£24/hr',
    signals: [{ t: 'fully remote', c: '' }, { t: 'flexible', c: '' }, { t: 'no calls required', c: '' }],
    dayToDay: 'content scheduling, newsletter management, light copywriting, and inbox support for a growing wellness brand. all deliverable-based, no fixed hours.',
    need: ['content scheduling experience', 'clear, friendly writing voice', 'self-managing'],
    nice: ['wellness or lifestyle brand experience', 'canva familiarity'],
    fit: 'deliverable-based with no fixed hours — as flexible as it gets. great fit for variable energy. slightly lower pay but the freedom trade-off is real. good as a second client alongside existing work.'
  }
];

const SOURCES = ['checking remote.co', 'scanning flexa', 'looking at we work remotely', 'filtering listings...', 'translating for you...'];

export default function JobScout() {
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [scanText, setScanText] = useState(SOURCES[0]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pipeline, setPipeline] = useState<Job[]>([]);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const path = `users/${user.uid}/jobs`;
    const unsubscribe = onSnapshot(query(collection(db, path)), (snapshot) => {
      setPipeline(snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Job[]);
    }, (e) => handleFirestoreError(e, OperationType.LIST, path));
    return () => unsubscribe();
  }, [user]);

  const startScan = () => {
    setIsScanning(true);
    setJobs([]);
    let i = 0;
    const interval = setInterval(() => { i = (i + 1) % SOURCES.length; setScanText(SOURCES[i]); }, 600);
    setTimeout(() => {
      clearInterval(interval);
      setIsScanning(false);
      setJobs(SCOUT_JOBS.map((j, idx) => ({ ...j, id: `job-${idx}`, status: 'spotted' } as Job)));
    }, 3000);
  };

  useEffect(() => { startScan(); }, []);

  const addToPipeline = async (job: Job) => {
    if (!user || pipeline.find(j => j.company === job.company && j.role === job.role)) return;
    const path = `users/${user.uid}/jobs`;
    try { await addDoc(collection(db, path), { ...job, userId: user.uid, status: 'spotted' }); }
    catch (e) { handleFirestoreError(e, OperationType.CREATE, path); }
  };

  const updateJobStatus = async (jobId: string, status: Job['status']) => {
    if (!user) return;
    const path = `users/${user.uid}/jobs/${jobId}`;
    try { await updateDoc(doc(db, path), { status }); }
    catch (e) { handleFirestoreError(e, OperationType.UPDATE, path); }
  };

  const removeFromPipeline = async (jobId: string) => {
    if (!user) return;
    const path = `users/${user.uid}/jobs/${jobId}`;
    try { await deleteDoc(doc(db, path)); }
    catch (e) { handleFirestoreError(e, OperationType.DELETE, path); }
  };

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display font-light text-4xl text-ink mb-1.5">job scout.</h2>
          <p className="text-soft-grey italic font-display font-light">finding work that works for your brain.</p>
        </div>
        <button onClick={startScan} className="nd-button text-sm flex items-center gap-1.5">
          <Search className="w-4 h-4" /> scan again
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          <AnimatePresence>
            {isScanning && (
              <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                className="nd-card p-4 flex items-center gap-3">
                <div className="flex gap-1">
                  {[0, 0.2, 0.4].map((d, i) => (
                    <motion.div key={i} animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: d }}
                      className="w-1.5 h-1.5 rounded-full" style={{background:'var(--color-teal)'}} />
                  ))}
                </div>
                <div>
                  <span className="text-sm font-medium text-ink">{scanText}</span>
                  <p className="nd-label" style={{color:'var(--color-teal)'}}>searching global boards</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {jobs.map((job, idx) => {
            const inPipeline = !!pipeline.find(j => j.company === job.company && j.role === job.role);
            const isExpanded = expandedJob === job.id;
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.4, ease: [0.23,1,0.32,1] }}
                className="nd-card p-6 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-light text-lg text-ink mb-0.5">{job.role}</h3>
                    <p className="text-sm text-soft-grey italic font-display">{job.company}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="nd-badge rounded-full font-mono text-[11px]"
                      style={{background:'rgba(30,122,110,0.08)', color:'var(--color-teal)'}}>
                      {job.pay}
                    </span>
                    <button onClick={() => setJobs(jobs.filter(j => j.id !== job.id))}
                      className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-black/5 transition-all">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {job.signals.map((s, i) => (
                    <span key={i} className="nd-pill">{s.t}</span>
                  ))}
                </div>

                <div className="p-3.5 rounded-xl border"
                  style={{ background: 'rgba(232,213,204,0.15)', borderColor: 'rgba(212,184,172,0.25)' }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3 h-3" style={{color:'var(--color-amber)'}} />
                    <span className="nd-label" style={{color:'var(--color-amber)'}}>kai's read</span>
                  </div>
                  <p className="text-[12px] text-soft-grey leading-relaxed font-display italic font-light">"{job.fit}"</p>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.28, ease: [0.23,1,0.32,1] }}
                      className="overflow-hidden"
                    >
                      <div className="flex flex-col gap-4 pt-2 border-t border-border/50">
                        <div>
                          <p className="nd-label text-muted mb-1.5">day-to-day</p>
                          <p className="text-sm text-soft-grey leading-relaxed font-light">{job.dayToDay}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="nd-label text-muted mb-1.5">they need</p>
                            <ul className="space-y-1.5">
                              {job.need.map((n, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-ink font-light">
                                  <div className="w-1 h-1 rounded-full mt-2 shrink-0" style={{background:'var(--color-teal)'}} />
                                  {n}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="nd-label text-muted mb-1.5">nice to have</p>
                            <ul className="space-y-1.5">
                              {job.nice.map((n, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-soft-grey font-light">
                                  <div className="w-1 h-1 rounded-full mt-2 shrink-0 bg-border" />
                                  {n}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                  <button
                    onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                    className="nd-button-ghost text-xs px-4 py-2"
                  >
                    {isExpanded ? 'less detail' : 'see details'}
                  </button>
                  <button
                    onClick={() => addToPipeline(job)}
                    disabled={inPipeline}
                    className={cn("nd-button text-xs px-4 py-2 flex items-center gap-1.5", inPipeline && "opacity-50")}
                  >
                    <Check className="w-3.5 h-3.5" />
                    {inPipeline ? 'in pipeline' : 'add to pipeline'}
                  </button>
                </div>
              </motion.div>
            );
          })}

          {!isScanning && jobs.length === 0 && (
            <div className="nd-card p-12 text-center">
              <p className="text-soft-grey font-display italic font-light text-sm">click "scan again" to look for new jobs.</p>
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-4">
          <div className="nd-card p-5 flex flex-col h-full min-h-[300px]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display italic text-ink text-base">your pipeline</h3>
              <span className="nd-badge" style={{background:'rgba(22,32,42,0.06)', color:'var(--color-muted)'}}>
                {pipeline.length}
              </span>
            </div>

            {pipeline.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 opacity-30">
                <Briefcase className="w-8 h-8 text-muted" />
                <p className="text-sm font-display italic font-light text-soft-grey">no active leads yet.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2.5">
                {pipeline.map((job) => (
                  <div key={job.id} className="p-3.5 rounded-xl border border-border/50 hover:border-border transition-colors group"
                    style={{background:'rgba(255,255,255,0.5)'}}>
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink leading-tight truncate">{job.role}</p>
                        <p className="nd-label text-muted truncate">{job.company}</p>
                      </div>
                      <button onClick={() => removeFromPipeline(job.id)}
                        className="p-1 rounded-lg text-muted opacity-0 group-hover:opacity-100 hover:text-error hover:bg-error/5 transition-all shrink-0">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <select
                      className="w-full nd-input text-[10px] font-mono uppercase tracking-wider py-1.5 px-2"
                      value={job.status}
                      onChange={(e) => updateJobStatus(job.id, e.target.value as Job['status'])}
                    >
                      <option value="spotted">spotted</option>
                      <option value="applied">applied</option>
                      <option value="heard">heard back</option>
                      <option value="interview">interview</option>
                      <option value="offer">offer</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
