import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import gsap from 'gsap';
import {
  LayoutDashboard,
  Brain,
  Target,
  Calendar,
  LogOut,
  Sparkles,
  Zap,
  User as UserIcon,
  PoundSterling,
  Eye,
  EyeOff,
  Pin,
  Lightbulb,
  ArrowLeft
} from 'lucide-react';
import { cn } from './lib/utils';
import Flo from './components/Flo';
import DumpPad from './components/DumpPad';
import ProjectSpace from './components/ProjectSpace';
import FocusSpace from './components/FocusSpace';
import { FirebaseProvider, useAuth, db, handleFirestoreError, OperationType, doc, onSnapshot, setDoc } from './services/firebase';
import { UserProfile } from './types';
import EnergyTracker from './components/EnergyTracker';
import WorkplaceTranslator from './components/WorkplaceTranslator';
import DailyCheckIn from './components/DailyCheckIn';
import JobScout from './components/JobScout';
import IncomeTracker from './components/IncomeTracker';
import ClientSpace from './components/ClientSpace';
import LandingPage from './components/LandingPage';
import DayMap from './components/DayMap';
import WhopIdeaGenerator from './components/WhopIdeaGenerator';
import { parseDayPlan, DayTask } from './services/gemini';

type View = 'nest' | 'dump' | 'projects' | 'focus' | 'scout' | 'income' | 'clients' | 'ideas';
type EnergyCheckIn = 'low' | 'medium' | 'high' | null;

function EnergyCheckInScreen({ onSelect }: { onSelect: (e: 'low' | 'medium' | 'high') => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-canvas z-[2000] flex flex-col items-center justify-center p-12"
    >
      <div className="max-w-sm w-full space-y-10 text-center">
        <div className="space-y-3">
          <p className="nd-label text-muted">welcome back</p>
          <h2 className="font-display font-light text-4xl text-ink tracking-tight">
            how are you doing <em className="italic" style={{color:'var(--color-teal)'}}>right now?</em>
          </h2>
          <p className="text-soft-grey text-sm leading-relaxed font-light">no wrong answer. this shapes what you see today.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {([
            { val: 'low', label: 'low', sub: 'just surviving', icon: '🌱' },
            { val: 'medium', label: 'medium', sub: 'steady but tired', icon: '🌤' },
            { val: 'high', label: 'high', sub: 'ready to go', icon: '⚡' },
          ] as { val: 'low' | 'medium' | 'high'; label: string; sub: string; icon: string }[]).map(({ val, label, sub, icon }) => (
            <motion.button
              key={val}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(val)}
              className="p-5 nd-card hover:shadow-md text-center space-y-2"
            >
              <span className="text-2xl">{icon}</span>
              <p className="font-medium text-ink text-sm">{label}</p>
              <p className="text-[11px] text-muted">{sub}</p>
            </motion.button>
          ))}
        </div>
        <p className="reassurance-line">this saves automatically. nothing is lost if you close.</p>
      </div>
    </motion.div>
  );
}

const navItems = [
  { id: 'nest', label: 'the nest', icon: LayoutDashboard },
  { id: 'ideas', label: 'whop ideas', icon: Lightbulb },
  { id: 'dump', label: 'dump pad', icon: Brain },
  { id: 'projects', label: 'projects', icon: Calendar },
  { id: 'focus', label: 'focus space', icon: Target },
];

const businessItems = [
  { id: 'clients', label: 'clients', icon: UserIcon },
  { id: 'scout', label: 'job scout', icon: Sparkles },
  { id: 'income', label: 'income', icon: PoundSterling },
];

function AppContent() {
  const { user, loading, signIn, logout } = useAuth();
  const [currentView, setCurrentView] = useState<View>('nest');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [dayPlanInput, setDayPlanInput] = useState('');
  const [dayTasks, setDayTasks] = useState<DayTask[]>([]);
  const [isPlanning, setIsPlanning] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isPanicMode, setIsPanicMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [energyCheckIn, setEnergyCheckIn] = useState<EnergyCheckIn>(null);
  const [showEnergyCheckIn, setShowEnergyCheckIn] = useState(false);
  const [pinnedOneThing, setPinnedOneThing] = useState('');
  const [oneThingInput, setOneThingInput] = useState('');
  const hasCheckedInRef = useRef(false);
  const isLowEnergy = energyCheckIn === 'low';

  const handleCreateDayMap = async () => {
    if (!dayPlanInput.trim()) return;
    setIsPlanning(true);
    try {
      const tasks = await parseDayPlan(dayPlanInput);
      setDayTasks(tasks);
    } catch (error) {
      console.error('Planning error:', error);
    } finally {
      setIsPlanning(false);
    }
  };

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const handleMouseMove = (e: MouseEvent) => {
      if (prefersReducedMotion || !cursorRef.current) return;
      gsap.to(cursorRef.current, { x: e.clientX, y: e.clientY, duration: 0.08 });
    };
    window.addEventListener('mousemove', handleMouseMove);
    const handleMouseEnter = () => cursorRef.current?.classList.add('big');
    const handleMouseLeave = () => cursorRef.current?.classList.remove('big');
    const interactiveElements = document.querySelectorAll('a, button, .btn');
    interactiveElements.forEach((el) => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      interactiveElements.forEach((el) => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, [user, currentView, loading]);

  useEffect(() => {
    if (!user) { setProfile(null); return; }
    const path = `users/${user.uid}`;
    const unsubscribe = onSnapshot(doc(db, path), async (snapshot) => {
      if (snapshot.exists()) {
        setProfile(snapshot.data() as UserProfile);
        if (!hasCheckedInRef.current) {
          hasCheckedInRef.current = true;
          const data = snapshot.data() as UserProfile;
          const lastCheckIn = data.lastCheckIn ? new Date(data.lastCheckIn) : null;
          const now = new Date();
          const hoursSince = lastCheckIn ? (now.getTime() - lastCheckIn.getTime()) / 1000 / 3600 : 999;
          if (hoursSince > 4) setTimeout(() => setShowEnergyCheckIn(true), 600);
        }
      } else {
        const initialProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          onboardingCompleted: false,
          energyLevel: 100,
          lastCheckIn: new Date().toISOString(),
          role: 'user'
        };
        try {
          await setDoc(doc(db, path), initialProfile);
          setTimeout(() => setShowEnergyCheckIn(true), 800);
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, path);
        }
      }
    }, (error) => { handleFirestoreError(error, OperationType.GET, path); });
    return () => unsubscribe();
  }, [user]);

  const handleEnergyCheckIn = async (level: 'low' | 'medium' | 'high') => {
    setEnergyCheckIn(level);
    setShowEnergyCheckIn(false);
    if (user) {
      const energyMap = { low: 20, medium: 60, high: 100 };
      try {
        await setDoc(doc(db, `users/${user.uid}`), { energyLevel: energyMap[level], lastCheckIn: new Date().toISOString() }, { merge: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-canvas">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-8 h-8 bg-ink rounded-xl flex items-center justify-center">
            <div className="w-4 h-4 bg-canvas rounded-sm opacity-70" />
          </div>
          <p className="font-display text-lg italic text-soft-grey font-light">loading neurodev...</p>
        </motion.div>
      </div>
    );
  }

  if (!user && showLanding) return <LandingPage onStart={signIn} />;

  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-canvas p-6 relative overflow-hidden">
        <div ref={cursorRef} className="custom-cursor" />
        <div className="grain" />
        <div className="absolute inset-0 atmosphere-gradient opacity-60 pointer-events-none" />
        <div className="max-w-sm w-full text-center space-y-8 relative z-10">
          <div className="space-y-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 bg-ink rounded-2xl mx-auto flex items-center justify-center shadow-xl"
            >
              <Brain className="w-8 h-8 text-canvas opacity-80" />
            </motion.div>
            <h1 className="text-4xl font-display font-light text-ink">neurodev</h1>
            <p className="text-soft-grey text-base italic font-display font-light">build on whop. on your own terms.</p>
          </div>
          <div className="nd-card p-8 space-y-5">
            <p className="text-soft-grey text-sm leading-relaxed font-light">
              a whop community and toolkit for neurodivergent builders, creators, and indie earners.
            </p>
            <button onClick={signIn} className="w-full nd-button py-3.5 text-sm">
              join neurodev
            </button>
            <button onClick={() => setShowLanding(true)} className="nd-label text-muted hover:text-soft-grey transition-colors w-full text-center block">
              ← back to landing
            </button>
          </div>
          <p className="reassurance-line">this saves automatically. nothing is lost if you close.</p>
        </div>
      </div>
    );
  }

  const visibleNavItems = isLowEnergy ? navItems.slice(0, 3) : navItems;
  const visibleBusinessItems = isLowEnergy ? [] : businessItems;

  const energyPct = profile?.energyLevel || 100;
  const energyColor = energyPct <= 25 ? 'var(--color-amber)' : energyPct <= 60 ? 'var(--color-warning)' : 'var(--color-teal)';

  return (
    <div className={cn("h-screen w-screen flex bg-canvas overflow-hidden relative", focusMode && "focus-mode-active")}>
      <div ref={cursorRef} className="custom-cursor" />
      <div className="grain" />
      <div className="absolute inset-0 atmosphere-gradient opacity-50 pointer-events-none" />

      <AnimatePresence>
        {showEnergyCheckIn && <EnergyCheckInScreen onSelect={handleEnergyCheckIn} />}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-60 h-full flex flex-col glass-panel relative z-10 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 pt-6 pb-5 border-b border-border/40">
          <div className="w-7 h-7 bg-ink rounded-lg flex items-center justify-center shrink-0">
            <div className="w-3 h-3 bg-canvas rounded-sm opacity-80" />
          </div>
          <span className="font-display text-sm text-ink tracking-tight">neurodev</span>
        </div>

        {/* One Thing */}
        {pinnedOneThing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mx-4 mt-4"
          >
            <div className="one-thing-card">
              <div className="flex items-start gap-2">
                <Pin className="w-3 h-3 shrink-0 mt-0.5" style={{color:'var(--color-teal)'}} />
                <div className="min-w-0">
                  <p className="nd-label mb-1" style={{color:'var(--color-teal)'}}>one thing</p>
                  <p className="text-xs font-medium text-ink leading-snug line-clamp-2">{pinnedOneThing}</p>
                  <button onClick={() => setPinnedOneThing('')} className="nd-label mt-1.5 text-muted hover:text-soft-grey transition-colors">
                    unpin
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 pt-5 overflow-y-auto space-y-5">
          <div>
            <p className="nd-label px-3 mb-2 text-muted">workspace</p>
            <div className="space-y-0.5">
              {visibleNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as View)}
                  className={cn('nav-item', currentView === item.id && 'active')}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {visibleBusinessItems.length > 0 && (
            <div>
              <p className="nd-label px-3 mb-2 text-muted">business</p>
              <div className="space-y-0.5">
                {visibleBusinessItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id as View)}
                    className={cn('nav-item', currentView === item.id && 'active')}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="px-4 pb-5 pt-4 border-t border-border/40 space-y-4">
          {/* Energy */}
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
              style={{background: `${energyColor}18`}}>
              <Zap className="w-3 h-3" style={{color: energyColor}} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="nd-label" style={{color: energyColor}}>energy{energyCheckIn ? ` — ${energyCheckIn}` : ''}</p>
                <span className="nd-label text-muted">{energyPct}%</span>
              </div>
              <div className="energy-bar">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${energyPct}%` }}
                  className="energy-bar-fill"
                  style={{ background: energyColor }}
                />
              </div>
            </div>
          </div>

          {/* Focus mode toggle */}
          <button
            onClick={() => setFocusMode(!focusMode)}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all",
              focusMode
                ? "bg-teal text-canvas"
                : "bg-black/4 text-soft-grey hover:text-ink hover:bg-black/6"
            )}
            style={focusMode ? {background:'var(--color-teal)'} : undefined}
          >
            {focusMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {focusMode ? 'exit focus mode' : 'focus mode'}
          </button>

          {/* User */}
          <div className="flex items-center gap-2.5">
            {user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full border border-border/60 shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-blush border border-border/60 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-medium text-ink">{(user.displayName || 'U')[0].toUpperCase()}</span>
              </div>
            )}
            <span className="text-xs font-medium text-ink-3 truncate flex-1">{user.displayName?.toLowerCase() || 'you'}</span>
            <button onClick={logout} className="p-1 text-muted hover:text-ink transition-colors rounded-lg hover:bg-black/5">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="reassurance-line text-center">nothing is lost if you close.</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-hidden relative z-10">
        <div className="h-full w-full px-8 py-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="min-h-full"
            >
              {currentView === 'nest' && (
                <div className="max-w-5xl mx-auto space-y-8 pb-16">
                  <header className="space-y-1.5 mb-2">
                    <motion.h2
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="font-display font-light text-ink tracking-tight"
                      style={{ fontSize: focusMode ? '2.5rem' : '3rem' }}
                    >
                      welcome back.
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.06 }}
                      className="text-soft-grey italic font-display font-light text-xl"
                    >
                      {isLowEnergy ? "keeping it simple today. just one thing at a time." : "where are you at right now?"}
                    </motion.p>
                  </header>

                  {/* Today's One Thing */}
                  {!pinnedOneThing && (
                    <div className="nd-card p-6 space-y-4">
                      <div className="flex items-center gap-2.5">
                        <Pin className="w-4 h-4" style={{color:'var(--color-teal)'}} />
                        <h3 className="text-base font-display italic text-ink">today's one thing</h3>
                      </div>
                      <p className="text-sm text-soft-grey leading-relaxed font-light">
                        what would make today feel like enough? pin it — it'll show in your sidebar.
                      </p>
                      <div className="flex gap-2.5">
                        <input
                          type="text"
                          value={oneThingInput}
                          onChange={(e) => setOneThingInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && oneThingInput.trim()) { setPinnedOneThing(oneThingInput.trim()); setOneThingInput(''); }}}
                          placeholder="e.g. reply to that one client email..."
                          className="nd-input flex-1 text-sm"
                        />
                        <button
                          onClick={() => { if (oneThingInput.trim()) { setPinnedOneThing(oneThingInput.trim()); setOneThingInput(''); }}}
                          disabled={!oneThingInput.trim()}
                          className="nd-button text-sm px-5"
                        >
                          pin it
                        </button>
                      </div>
                    </div>
                  )}

                  {!isLowEnergy && (
                    <div className="grid grid-cols-12 gap-6">
                      <div className="col-span-12 lg:col-span-7 space-y-6">
                        {/* Check-in + DayMap */}
                        <div className="nd-card p-6" style={{background:'rgba(232,213,204,0.25)', borderColor:'rgba(212,184,172,0.3)'}}>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="font-display italic text-ink text-lg">daily check-in</h3>
                              {!focusMode && (
                                <span className="nd-label text-muted">set the tone</span>
                              )}
                            </div>
                            {!focusMode && (
                              <p className="text-sm text-ink/60 font-light leading-relaxed">
                                it's okay if you're not ready yet.
                              </p>
                            )}
                            <button onClick={() => setIsCheckInOpen(true)} className="nd-button text-sm">
                              start check-in
                            </button>
                          </div>
                        </div>

                        <div className="nd-card p-6" style={{background:'rgba(208,228,210,0.2)', borderColor:'rgba(184,212,187,0.35)'}}>
                          <div className="space-y-5">
                            <div className="flex items-center justify-between">
                              <h3 className="font-display italic text-ink text-lg">map your day</h3>
                              <span className="nd-label text-muted">ai visualization</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                              <div className="space-y-3">
                                {!focusMode && (
                                  <p className="text-sm text-soft-grey leading-relaxed font-light">
                                    describe your day and flo will turn it into a visual rhythm.
                                  </p>
                                )}
                                <textarea
                                  value={dayPlanInput}
                                  onChange={(e) => setDayPlanInput(e.target.value)}
                                  placeholder="e.g. client call at 10, lunch at 1, deep work 2–4..."
                                  className="nd-input resize-none text-sm"
                                  rows={3}
                                />
                                <button
                                  onClick={handleCreateDayMap}
                                  disabled={isPlanning || !dayPlanInput.trim()}
                                  className="nd-button w-full text-sm"
                                  style={{background:'var(--color-teal)', color:'var(--color-canvas)'}}
                                >
                                  {isPlanning ? 'visualizing...' : 'create day map'}
                                </button>
                              </div>
                              <div className="flex items-center justify-center min-h-[240px]">
                                {dayTasks.length > 0 ? (
                                  <DayMap tasks={dayTasks} />
                                ) : (
                                  <div className="text-center space-y-3 opacity-20">
                                    <div className="w-24 h-24 border-2 border-dashed border-ink/20 rounded-full mx-auto flex items-center justify-center">
                                      <Sparkles className="w-6 h-6 text-ink/30" />
                                    </div>
                                    <p className="nd-label">waiting for your plan</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <EnergyTracker currentEnergy={profile?.energyLevel} />
                          <DumpPad />
                        </div>
                      </div>

                      <div className="col-span-12 lg:col-span-5 space-y-6">
                        <WorkplaceTranslator />
                        <div className="nd-card p-5 flex flex-col min-h-[280px]">
                          <div className="flex items-center justify-between mb-5">
                            <h3 className="text-base font-display italic text-ink">recent notes</h3>
                            <button className="nd-label text-muted hover:text-soft-grey transition-colors">view all</button>
                          </div>
                          <div className="flex-1 space-y-2">
                            {[1, 2, 3].map(i => (
                              <motion.div
                                key={i}
                                whileHover={{ x: 3 }}
                                className="p-3.5 rounded-xl border border-border/50 hover:border-border hover:bg-white/50 transition-all cursor-pointer group"
                                style={{background:'rgba(255,255,255,0.3)'}}
                              >
                                <p className="text-sm text-ink/70 group-hover:text-ink transition-colors">thought from yesterday...</p>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <div className="w-1 h-1 rounded-full bg-sage" />
                                  <p className="nd-label text-muted">2 hours ago</p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {isLowEnergy && (
                    <div className="space-y-5 max-w-xl">
                      <p className="text-sm text-soft-grey leading-relaxed font-light">low energy today — that's valid. here's just the essentials.</p>
                      <EnergyTracker currentEnergy={profile?.energyLevel} />
                      <DumpPad />
                    </div>
                  )}
                </div>
              )}

              {currentView === 'ideas' && <WhopIdeaGenerator />}
              {currentView === 'dump' && <div className="max-w-4xl mx-auto h-full"><DumpPad /></div>}
              {currentView === 'projects' && <ProjectSpace />}
              {currentView === 'focus' && <FocusSpace />}
              {currentView === 'scout' && <JobScout />}
              {currentView === 'income' && <IncomeTracker />}
              {currentView === 'clients' && <ClientSpace />}
            </motion.div>
          </AnimatePresence>
        </div>

        <Flo />

        <button
          onClick={() => setShowLanding(true)}
          className="fixed bottom-8 left-[256px] flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-mono uppercase tracking-wider text-muted hover:text-soft-grey transition-colors z-40"
          style={{background:'rgba(255,255,255,0.4)', backdropFilter:'blur(8px)', border:'1px solid rgba(228,224,216,0.5)'}}
        >
          <ArrowLeft className="w-3 h-3" />
          landing
        </button>

        <DailyCheckIn isOpen={isCheckInOpen} onClose={() => setIsCheckInOpen(false)} />
      </main>

      {/* Panic Mode */}
      <AnimatePresence>
        {isPanicMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex flex-col items-center justify-center p-12 text-center"
            style={{background:'var(--color-blush)'}}
          >
            <div className="max-w-lg space-y-8">
              <h2 className="font-display font-light text-5xl text-ink italic tracking-tight">it's okay.</h2>
              <p className="font-display text-xl text-ink/60 font-light italic">what's the one thing someone is waiting on from you?</p>
              <textarea
                placeholder="just one thing..."
                className="w-full h-28 rounded-2xl p-5 text-lg focus:outline-none resize-none font-display italic text-ink font-light placeholder:text-ink/20"
                style={{background:'rgba(255,255,255,0.5)', border:'none'}}
              />
              <button onClick={() => setIsPanicMode(false)} className="nd-button px-10 py-3.5 text-sm">
                i'm doing it ✹
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsPanicMode(true)}
        className="fixed bottom-8 right-8 w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-[900]"
        style={{background:'var(--color-amber)'}}
        title="overwhelmed? press here"
      >
        <span className="font-display text-lg italic text-canvas">✹</span>
      </button>
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}
