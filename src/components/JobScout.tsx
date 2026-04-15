import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Sparkles, Briefcase, Clock, MapPin, PoundSterling, Check, X, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { Job } from '../types';
import { db, useAuth, handleFirestoreError, OperationType, collection, onSnapshot, query, addDoc, doc, updateDoc, deleteDoc } from '../services/firebase';

const SCOUT_JOBS: Omit<Job, 'id' | 'status'>[] = [
  {
    role: 'remote pa · startup',
    company: 'untitled co · london',
    pay: '£28/hr',
    signals: [{ t: 'remote', c: 'bg-blue-100 text-blue-700' }, { t: 'flexible hours', c: 'bg-pink-100 text-pink-700' }, { t: 'async-first', c: 'bg-sage-100 text-sage-700' }, { t: 'low meetings', c: 'bg-amber-100 text-amber-700' }],
    dayToDay: 'diary management, email triage, research tasks, and general admin for a fast-growing startup founder. all async, slack-based communication. you set your own hours around a core 10–4 window.',
    need: ['diary & inbox management', 'strong written communication', 'organised and self-directed'],
    nice: ['experience with founders or startups', 'notion or airtable familiarity'],
    fit: 'the async setup and flexible hours fit really well with variable energy days. no phone calls required. worth noting: startup pace can mean changing priorities — worth asking how they handle urgent requests.'
  },
  {
    role: 'freelance operations manager',
    company: 'bloom creative · manchester',
    pay: '£30k pro-rata',
    signals: [{ t: 'remote', c: 'bg-blue-100 text-blue-700' }, { t: 'part-time', c: 'bg-pink-100 text-pink-700' }, { t: 'structured role', c: 'bg-purple-100 text-purple-700' }],
    dayToDay: 'oversee day-to-day operations for a small creative agency — process documentation, team coordination, supplier management. part-time, 3 days per week, with clear scope and structured handover docs.',
    need: ['operations or project management', 'process documentation', 'team coordination'],
    nice: ['agency background', 'experience with clickup or monday.com'],
    fit: 'part-time and well-structured — good for protecting your rest days. the role has clear scope which means less ambiguity. the one watch-out: some team coordination will require being available during core hours thu/fri.'
  },
  {
    role: 'content & admin support',
    company: 'halo studio · remote',
    pay: '£24/hr',
    signals: [{ t: 'fully remote', c: 'bg-blue-100 text-blue-700' }, { t: 'flexible', c: 'bg-pink-100 text-pink-700' }, { t: 'no calls required', c: 'bg-sage-100 text-sage-700' }],
    dayToDay: 'content scheduling, newsletter management, light copywriting, and inbox support for a growing wellness brand. all deliverable-based, no fixed hours. you work when you work.',
    need: ['content scheduling experience', 'clear, friendly writing voice', 'self-managing'],
    nice: ['wellness or lifestyle brand experience', 'canva familiarity'],
    fit: 'deliverable-based with no fixed hours — this is about as flexible as it gets. great fit for variable energy. the pay is slightly lower but the freedom trade-off is real. good as a second client alongside existing work.'
  }
];

const SOURCES = ['checking remote.co', 'scanning flexa', 'looking at we work remotely', 'filtering linkedin', 'reading listings...', 'translating for you...'];

export default function JobScout() {
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [scanText, setScanText] = useState(SOURCES[0]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pipeline, setPipeline] = useState<Job[]>([]);

  useEffect(() => {
    if (!user) return;

    const path = `users/${user.uid}/jobs`;
    const q = query(collection(db, path));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Job[];
      setPipeline(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  const startScan = () => {
    setIsScanning(true);
    setJobs([]);
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % SOURCES.length;
      setScanText(SOURCES[i]);
    }, 600);

    setTimeout(() => {
      clearInterval(interval);
      setIsScanning(false);
      setJobs(SCOUT_JOBS.map((j, idx) => ({ ...j, id: `job-${idx}`, status: 'spotted' } as Job)));
    }, 3000);
  };

  useEffect(() => {
    startScan();
  }, []);

  const addToPipeline = async (job: Job) => {
    if (!user) return;
    if (pipeline.find(j => j.company === job.company && j.role === job.role)) return;

    const path = `users/${user.uid}/jobs`;
    try {
      await addDoc(collection(db, path), {
        ...job,
        userId: user.uid,
        status: 'spotted'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const updateJobStatus = async (jobId: string, status: Job['status']) => {
    if (!user) return;
    const path = `users/${user.uid}/jobs/${jobId}`;
    try {
      await updateDoc(doc(db, path), { status });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const removeFromPipeline = async (jobId: string) => {
    if (!user) return;
    const path = `users/${user.uid}/jobs/${jobId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const dismissJob = (jobId: string) => {
    setJobs(jobs.filter(j => j.id !== jobId));
  };

  return (
    <div className="h-full flex flex-col space-y-8">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <h2 className="text-6xl font-display font-bold text-deep-plum tracking-tighter">job scout</h2>
          <p className="text-soft-grey italic text-lg font-display">finding work that works for your brain.</p>
        </div>
        <button onClick={startScan} className="florr-button flex items-center gap-2">
          <Search className="w-5 h-5" />
          <span>scan again</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-8 flex-1 overflow-hidden">
        <div className="col-span-12 lg:col-span-8 flex flex-col space-y-6 overflow-y-auto pr-4 mask-fade-bottom">
          <AnimatePresence>
            {isScanning && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="glass-panel p-6 flex items-center gap-4"
              >
                <div className="flex gap-1">
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-deep-plum rounded-full" />
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-deep-plum rounded-full" />
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-deep-plum rounded-full" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-dark-text">{scanText}</span>
                  <span className="text-[10px] text-deep-plum font-bold uppercase tracking-widest font-mono">searching global boards</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-6">
            {jobs.map((job, idx) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="florr-card p-8 group hover:shadow-xl transition-all"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-display font-bold text-deep-plum mb-1 tracking-tight">{job.role}</h3>
                    <p className="text-soft-grey font-medium font-display italic">{job.company}</p>
                  </div>
                  <div className="px-4 py-2 bg-sage-mist/20 text-forest-green rounded-full text-[10px] font-bold border border-sage-mist/30 font-mono uppercase tracking-widest">
                    {job.pay}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {job.signals.map((s, i) => (
                    <span key={i} className={cn("px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest font-mono", s.c)}>
                      {s.t}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-4">
                    <h4 className="text-[9px] font-bold text-soft-grey uppercase tracking-[0.2em] font-mono">what you'd actually do</h4>
                    <p className="text-sm text-dark-text leading-relaxed font-light">{job.dayToDay}</p>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[9px] font-bold text-soft-grey uppercase tracking-[0.2em] font-mono">they need</h4>
                    <ul className="space-y-2">
                      {job.need.map((n, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-dark-text font-light">
                          <div className="w-1.5 h-1.5 rounded-full bg-terracotta" />
                          {n}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-dusty-blush/10 border border-dusty-blush/20 rounded-3xl p-6 mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-deep-plum" />
                    <h4 className="text-[9px] font-bold text-deep-plum uppercase tracking-[0.2em] font-mono">florr's read</h4>
                  </div>
                  <p className="text-sm text-deep-plum/80 leading-relaxed italic font-display">"{job.fit}"</p>
                </div>

                <div className="flex gap-4 pt-6 border-t border-black/5">
                  <button
                    onClick={() => addToPipeline(job)}
                    disabled={!!pipeline.find(j => j.company === job.company && j.role === job.role)}
                    className="flex-1 florr-button py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    {pipeline.find(j => j.company === job.company && j.role === job.role) ? 'in pipeline' : 'add to pipeline'}
                  </button>
                  <button 
                    onClick={() => dismissJob(job.id)}
                    className="px-6 py-3 bg-black/5 text-soft-grey rounded-2xl hover:bg-black/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className="florr-card p-8 flex flex-col h-full max-h-[600px]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-deep-plum font-display italic">your pipeline</h3>
              <span className="text-[10px] font-mono bg-deep-plum/5 text-deep-plum/40 px-2 py-1 rounded-full border border-deep-plum/10">
                {pipeline.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {pipeline.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                  <Briefcase className="w-12 h-12" />
                  <p className="text-sm italic font-display">no active leads yet.<br/>add some from the scout.</p>
                </div>
              ) : (
                pipeline.map((job) => (
                  <motion.div
                    key={job.id}
                    layoutId={`pipe-${job.id}`}
                    className="p-4 bg-white/60 rounded-2xl border border-black/5 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-bold text-dark-text tracking-tight">{job.role}</h4>
                        <p className="text-[10px] text-soft-grey font-mono uppercase tracking-wider">{job.company}</p>
                      </div>
                      <button 
                        onClick={() => removeFromPipeline(job.id)}
                        className="p-1 hover:bg-red-50 text-soft-grey hover:text-red-500 rounded transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <select 
                        className="text-[9px] font-bold text-deep-plum bg-deep-plum/5 border-none rounded-lg px-2 py-1 outline-none font-mono uppercase tracking-widest"
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
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
