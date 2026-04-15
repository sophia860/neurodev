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
  Lightbulb
} from 'lucide-react';
import { cn } from './lib/utils';
import Flo from './components/Flo';
import DumpPad from './components/DumpPad';
import ProjectSpace from './components/ProjectSpace';
import FocusSpace from './components/FocusSpace';
import { FirebaseProvider, useAuth, db, handleFirestoreError, OperationType } from './services/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
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
      className="fixed inset-0 bg-warm-cream z-[2000] flex flex-col items-center justify-center p-12"
    >
      <div className="max-w-md w-full space-y-10 text-center">
        <div className="space-y-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-soft-grey">welcome back</p>
          <h2 className="text-4xl font-display font-bold text-deep-slate tracking-tight">
            how are you doing <em className="italic text-ocean-teal">right now?</em>
          </h2>
          <p className="text-soft-grey text-sm leading-relaxed">no wrong answer. this shapes what you see.</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {([
            { val: 'low', label: 'low', sub: 'just surviving', icon: '🌱' },
            { val: 'medium', label: 'medium', sub: 'steady but tired', icon: '🌤' },
            { val: 'high', label: 'high', sub: 'ready to go', icon: '⚡' },
          ] as { val: 'low' | 'medium' | 'high'; label: string; sub: string; icon: string }[]).map(({ val, label, sub, icon }) => (
            <motion.button
              key={val}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(val)}
              className="p-6 bg-white/70 backdrop-blur-sm border border-black/8 rounded-3xl hover:border-deep-slate/20 hover:shadow-md transition-all duration-200 text-center space-y-2"
            >
              <span className="text-3xl">{icon}</span>
              <p className="font-bold text-dark-text">{label}</p>
              <p className="text-[11px] text-soft-grey">{sub}</p>
            </motion.button>
          ))}
        </div>
        <p className="reassurance-line">this saves automatically. nothing is lost if you close.</p>
      </div>
    </motion.div>
  );
}

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
      gsap.to(cursorRef.current, { x: e.clientX, y: e.clientY, duration: 0.1 });
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
          if (hoursSince > 4) {
            setTimeout(() => setShowEnergyCheckIn(true), 600);
          }
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
        await setDoc(doc(db, `users/${user.uid}`), {
          energyLevel: energyMap[level],
          lastCheckIn: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-warm-cream">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-deep-slate flex flex-col items-center gap-4"
        >
          <Sparkles className="w-10 h-10" />
          <p className="font-display text-xl italic">loading neurodev...</p>
        </motion.div>
      </div>
    );
  }

  if (!user && showLanding) {
    return <LandingPage onStart={signIn} />;
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-warm-cream p-6 relative overflow-hidden">
        <div ref={cursorRef} className="custom-cursor" />
        <div className="grain" />
        <div className="absolute inset-0 atmosphere-gradient opacity-50" />
        <div className="max-w-md w-full text-center space-y-8 relative z-10">
          <div className="space-y-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 bg-deep-slate rounded-2xl mx-auto flex items-center justify-center text-warm-cream shadow-xl"
            >
              <Brain className="w-10 h-10" />
            </motion.div>
            <h1 className="text-5xl font-display font-bold text-deep-slate">neurodev</h1>
            <p className="text-soft-grey text-lg italic">build on whop. on your own terms.</p>
          </div>
          <div className="nd-card p-10 space-y-6">
            <p className="text-dark-text/60 leading-relaxed">
              a whop community and toolkit for neurodivergent builders, creators, and indie earners.
            </p>
            <button onClick={signIn} className="w-full nd-button flex items-center justify-center gap-3 py-4">
              <span>join neurodev</span>
            </button>
            <button
              onClick={() => setShowLanding(true)}
              className="text-xs font-bold text-soft-grey hover:text-deep-slate uppercase tracking-widest transition-colors font-mono"
            >
              back to landing
            </button>
          </div>
          <p className="reassurance-line">this saves automatically. nothing is lost if you close.</p>
        </div>
      </div>
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

  const visibleNavItems = isLowEnergy ? navItems.slice(0, 3) : navItems;
  const visibleBusinessItems = isLowEnergy ? [] : businessItems;

  return (
    <div className={cn("h-screen w-screen flex bg-warm-cream overflow-hidden relative", focusMode && "focus-mode-active")}>
      <div ref={cursorRef} className="custom-cursor" />
      <div className="grain" />
      <div className="absolute inset-0 atmosphere-gradient opacity-30 pointer-events-none" />

      <AnimatePresence>
        {showEnergyCheckIn && (
          <EnergyCheckInScreen onSelect={handleEnergyCheckIn} />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-72 h-full p-6 flex flex-col border-r border-black/5 relative z-10 glass-panel rounded-none border-y-0 border-l-0">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 bg-deep-slate rounded-xl flex items-center justify-center text-warm-cream">
            <Brain className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-display font-bold text-deep-slate tracking-tight">neurodev</h1>
        </div>

        {pinnedOneThing && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 one-thing-card"
          >
            <div className="flex items-start gap-2">
              <Pin className="w-3.5 h-3.5 text-ocean-teal flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-ocean-teal mb-1">today's one thing</p>
                <p className="text-sm font-medium text-deep-slate leading-snug">{pinnedOneThing}</p>
                <button
                  onClick={() => setPinnedOneThing('')}
                  className="text-[10px] font-mono text-soft-grey hover:text-deep-slate transition-colors mt-2 uppercase tracking-wider"
                >
                  unpin
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <nav className="flex-1 space-y-6 overflow-hidden">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-soft-grey uppercase tracking-widest px-3 mb-2">workspace</p>
            {visibleNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as View)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-medium text-sm",
                  currentView === item.id
                    ? "bg-deep-slate text-warm-cream shadow-sm"
                    : "text-soft-grey hover:bg-black/5 hover:text-deep-slate"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {visibleBusinessItems.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-soft-grey uppercase tracking-widest px-3 mb-2">business</p>
              {visibleBusinessItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as View)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-medium text-sm",
                    currentView === item.id
                      ? "bg-deep-slate text-warm-cream shadow-sm"
                      : "text-soft-grey hover:bg-black/5 hover:text-deep-slate"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="flex items-center gap-2 px-1">
            <button
              onClick={() => setFocusMode(!focusMode)}
              title={focusMode ? 'exit focus mode' : 'enter focus mode'}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-mono uppercase tracking-wider transition-all",
                focusMode
                  ? "bg-ocean-teal text-warm-cream"
                  : "bg-black/5 text-soft-grey hover:text-deep-slate"
              )}
            >
              {focusMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {focusMode ? 'exit focus' : 'focus mode'}
            </button>
          </div>

          <div className="p-4 bg-sage-mist/20 border border-sage-mist/30 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-ocean-teal shadow-sm">
              <Zap className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold text-ocean-teal uppercase tracking-wider">
                energy{energyCheckIn ? ` — ${energyCheckIn}` : ''}
              </p>
              <div className="w-full h-1.5 bg-white rounded-full mt-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${profile?.energyLevel || 100}%` }}
                  className="h-full bg-ocean-teal"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <img src={user.photoURL || ''} alt="" className="w-7 h-7 rounded-full border border-black/10" />
              <span className="text-xs font-medium text-dark-text truncate max-w-[100px]">{user.displayName?.toLowerCase()}</span>
            </div>
            <button onClick={logout} className="p-1.5 text-black/20 hover:text-deep-slate transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <p className="reassurance-line text-center">this saves automatically. nothing is lost if you close.</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-full overflow-hidden relative z-10">
        <div className="h-full w-full p-10 overflow-y-auto mask-fade-bottom">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="h-full"
            >
              {currentView === 'nest' && (
                <div className="max-w-5xl mx-auto space-y-12">
                  <header className="space-y-3">
                    <motion.h2
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "font-display font-bold text-deep-slate tracking-tight",
                        focusMode ? "text-5xl text-left" : "text-6xl"
                      )}
                    >
                      welcome back.
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 }}
                      className={cn(
                        "text-soft-grey italic font-display",
                        focusMode ? "text-lg text-left" : "text-2xl"
                      )}
                    >
                      {isLowEnergy ? "keeping it simple today. just one thing at a time." : "where are you at right now?"}
                    </motion.p>
                  </header>

                  {/* Today's One Thing */}
                  {!pinnedOneThing && (
                    <div className="nd-card p-8 space-y-5">
                      <div className="flex items-center gap-3">
                        <Pin className="w-5 h-5 text-ocean-teal" />
                        <h3 className="text-lg font-bold text-deep-slate font-display italic">today's one thing</h3>
                      </div>
                      <p className="text-sm text-soft-grey leading-relaxed">
                        what's the one task that would make today feel like enough? pin it — it'll show at the top of your sidebar.
                      </p>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={oneThingInput}
                          onChange={(e) => setOneThingInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && oneThingInput.trim()) { setPinnedOneThing(oneThingInput.trim()); setOneThingInput(''); } }}
                          placeholder="e.g. reply to that one client email..."
                          className="flex-1 nd-input text-sm"
                        />
                        <button
                          onClick={() => { if (oneThingInput.trim()) { setPinnedOneThing(oneThingInput.trim()); setOneThingInput(''); } }}
                          disabled={!oneThingInput.trim()}
                          className="nd-button text-sm px-5 py-2.5"
                        >
                          pin it
                        </button>
                      </div>
                    </div>
                  )}

                  {!isLowEnergy && (
                    <div className="grid grid-cols-12 gap-8">
                      <div className="col-span-12 lg:col-span-7 space-y-8">
                        <div className="nd-card p-8 bg-dusty-blush/20 border-dusty-blush/40 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-6 opacity-8 group-hover:scale-110 transition-transform">
                            <Sparkles className="w-20 h-20 text-deep-slate" />
                          </div>
                          <div className="relative z-10 space-y-4">
                            <h3 className={cn("font-bold text-deep-slate font-display italic tracking-tight", focusMode ? "text-xl" : "text-2xl")}>daily check-in</h3>
                            {!focusMode && (
                              <p className="text-base text-deep-slate/60 max-w-md leading-relaxed font-light">
                                set the tone for today. it's okay if you're not ready yet.
                              </p>
                            )}
                            <button onClick={() => setIsCheckInOpen(true)} className="nd-button">
                              start check-in
                            </button>
                          </div>
                        </div>

                        <div className="nd-card p-8 bg-sage-mist/10 border-sage-mist/30">
                          <div className="relative z-10 space-y-6">
                            <div className="flex items-center justify-between">
                              <h3 className={cn("font-bold text-deep-slate font-display italic tracking-tight", focusMode ? "text-xl" : "text-2xl")}>map your day</h3>
                              <span className="text-[9px] font-mono text-soft-grey uppercase tracking-widest">ai visualization</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                              <div className="space-y-4">
                                {!focusMode && (
                                  <p className="text-sm text-soft-grey leading-relaxed font-light">
                                    tell flo what's on your plate. she'll turn it into a visual rhythm.
                                  </p>
                                )}
                                <textarea
                                  value={dayPlanInput}
                                  onChange={(e) => setDayPlanInput(e.target.value)}
                                  placeholder="e.g. client call at 10, lunch at 1, deep work until 4..."
                                  className="w-full h-24 nd-input resize-none text-sm"
                                />
                                <button
                                  onClick={handleCreateDayMap}
                                  disabled={isPlanning || !dayPlanInput.trim()}
                                  className="nd-button w-full bg-sage-mist text-ocean-teal border-sage-mist/50 hover:bg-sage-mist/80 shadow-none"
                                  style={{ background: 'var(--color-sage-mist)', color: 'var(--color-ocean-teal)' }}
                                >
                                  {isPlanning ? 'visualizing...' : 'create day map ✹'}
                                </button>
                              </div>
                              <div className="flex items-center justify-center min-h-[280px]">
                                {dayTasks.length > 0 ? (
                                  <DayMap tasks={dayTasks} />
                                ) : (
                                  <div className="text-center space-y-3 opacity-25">
                                    <div className="w-28 h-28 border-2 border-dashed border-deep-slate/20 rounded-full mx-auto flex items-center justify-center">
                                      <Sparkles className="w-7 h-7 text-deep-slate/20" />
                                    </div>
                                    <p className="text-[10px] font-mono uppercase tracking-widest">waiting for your plan</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <EnergyTracker currentEnergy={profile?.energyLevel} />
                          <DumpPad />
                        </div>
                      </div>

                      <div className="col-span-12 lg:col-span-5 space-y-8">
                        <WorkplaceTranslator />
                        <div className="nd-card p-6 flex flex-col min-h-[320px]">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-deep-slate font-display italic">recent notes</h3>
                            <button className="text-[10px] font-bold text-soft-grey hover:text-deep-slate uppercase tracking-widest transition-colors font-mono">view all</button>
                          </div>
                          <div className="flex-1 space-y-3">
                            {[1, 2, 3].map(i => (
                              <motion.div
                                key={i}
                                whileHover={{ x: 4 }}
                                className="p-4 bg-white/40 rounded-2xl border border-black/5 hover:bg-white/60 transition-all cursor-pointer group"
                              >
                                <p className="text-sm font-medium text-dark-text group-hover:text-deep-slate transition-colors">thought from yesterday...</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-sage-mist" />
                                  <p className="text-[10px] text-soft-grey font-mono uppercase tracking-wider">2 hours ago</p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {isLowEnergy && (
                    <div className="space-y-6 max-w-xl">
                      <p className="text-sm text-soft-grey leading-relaxed">low energy today — that's valid. here's just the essentials.</p>
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
          className="fixed bottom-10 left-10 px-5 py-2.5 bg-white/40 backdrop-blur-md border border-black/5 rounded-full text-[10px] font-bold text-soft-grey hover:text-deep-slate hover:bg-white/60 transition-all uppercase tracking-widest font-mono z-40"
        >
          ← landing
        </button>

        <DailyCheckIn isOpen={isCheckInOpen} onClose={() => setIsCheckInOpen(false)} />
      </main>

      {/* Panic Mode Overlay */}
      <AnimatePresence>
        {isPanicMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-dusty-blush z-[1000] flex flex-col items-center justify-center p-12 text-center"
          >
            <div className="max-w-xl space-y-10">
              <h2 className="text-5xl font-display font-bold text-deep-slate italic tracking-tight">it's okay.</h2>
              <p className="text-2xl text-deep-slate/60 font-display italic">what's the one thing someone is waiting on from you?</p>
              <textarea
                placeholder="just one thing..."
                className="w-full h-28 bg-white/40 border-none rounded-3xl p-6 text-xl focus:ring-2 focus:ring-deep-slate/10 resize-none placeholder:text-deep-slate/20 font-display italic"
              />
              <button onClick={() => setIsPanicMode(false)} className="nd-button px-10 py-4 text-lg">
                i'm doing it ✹
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsPanicMode(true)}
        className="fixed bottom-10 right-10 w-11 h-11 bg-amber-warm text-warm-cream rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all z-[900] group"
        style={{ background: 'var(--color-amber-warm)' }}
      >
        <span className="font-display text-xl italic group-hover:rotate-12 transition-transform">✹</span>
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
