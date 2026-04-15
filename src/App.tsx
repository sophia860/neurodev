/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import gsap from 'gsap';
import { 
  LayoutDashboard, 
  Brain, 
  Target, 
  Calendar, 
  Settings, 
  LogOut, 
  Sparkles,
  Cloud,
  Flower2,
  Zap,
  User as UserIcon,
  PoundSterling
} from 'lucide-react';
import { cn } from './lib/utils';
import Flo from './components/Flo';
import DumpPad from './components/DumpPad';
import ProjectSpace from './components/ProjectSpace';
import FocusSpace from './components/FocusSpace';
import { FirebaseProvider, useAuth, db, handleFirestoreError, OperationType } from './services/firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { UserProfile } from './types';

import EnergyTracker from './components/EnergyTracker';
import WorkplaceTranslator from './components/WorkplaceTranslator';
import DailyCheckIn from './components/DailyCheckIn';
import JobScout from './components/JobScout';
import IncomeTracker from './components/IncomeTracker';
import ClientSpace from './components/ClientSpace';
import LandingPage from './components/LandingPage';
import DayMap from './components/DayMap';
import { parseDayPlan, DayTask } from './services/gemini';

type View = 'nest' | 'dump' | 'projects' | 'focus' | 'weekly' | 'settings' | 'scout' | 'income' | 'clients';

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
    const handleMouseMove = (e: MouseEvent) => {
      if (cursorRef.current) {
        gsap.to(cursorRef.current, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.1,
        });
      }
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
    if (!user) {
      setProfile(null);
      return;
    }

    const path = `users/${user.uid}`;
    const unsubscribe = onSnapshot(doc(db, path), async (snapshot) => {
      if (snapshot.exists()) {
        setProfile(snapshot.data() as UserProfile);
      } else {
        // Create initial profile
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
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, path);
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-warm-cream">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-deep-plum flex flex-col items-center gap-4"
        >
          <Sparkles className="w-12 h-12" />
          <p className="font-display text-xl italic">preparing your garden...</p>
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
              className="w-24 h-24 bg-deep-plum rounded-[40px] mx-auto flex items-center justify-center text-warm-cream shadow-xl"
            >
              <Flower2 className="w-12 h-12" />
            </motion.div>
            <h1 className="text-5xl font-display font-bold text-deep-plum">florr</h1>
            <p className="text-soft-grey text-lg italic">your brain has been right this whole time.</p>
          </div>
          
          <div className="florr-card p-10 space-y-6">
            <p className="text-dark-text/60 leading-relaxed">
              a neurodivergent-first productivity platform built around your chaos, not against it.
            </p>
            <button 
              onClick={signIn}
              className="w-full florr-button flex items-center justify-center gap-3 py-4"
            >
              <Cloud className="w-5 h-5" />
              <span>enter the nest</span>
            </button>
            <button 
              onClick={() => setShowLanding(true)}
              className="text-xs font-bold text-soft-grey hover:text-deep-plum uppercase tracking-widest transition-colors"
            >
              back to landing
            </button>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'nest', label: 'the nest', icon: LayoutDashboard },
    { id: 'dump', label: 'dump pad', icon: Brain },
    { id: 'projects', label: 'project space', icon: Calendar },
    { id: 'focus', label: 'focus space', icon: Target },
  ];

  const sideHustleItems = [
    { id: 'clients', label: 'clients', icon: UserIcon },
    { id: 'scout', label: 'job scout', icon: Sparkles },
    { id: 'income', label: 'income', icon: PoundSterling },
  ];

  return (
    <div className="h-screen w-screen flex bg-warm-cream overflow-hidden relative">
      <div ref={cursorRef} className="custom-cursor" />
      <div className="grain" />
      <div className="absolute inset-0 atmosphere-gradient opacity-30 pointer-events-none" />
      
      {/* Sidebar */}
      <aside className="w-80 h-full p-8 flex flex-col border-r border-black/5 relative z-10 glass-panel rounded-none border-y-0 border-l-0">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-deep-plum rounded-2xl flex items-center justify-center text-warm-cream">
            <Flower2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-display font-bold text-deep-plum">florr</h1>
        </div>

        <nav className="flex-1 space-y-8">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-soft-grey uppercase tracking-widest px-4">workspace</p>
            <div className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as View)}
                  className={cn(
                    "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-medium",
                    currentView === item.id 
                      ? "bg-deep-plum text-warm-cream shadow-md" 
                      : "text-soft-grey hover:bg-black/5 hover:text-deep-plum"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold text-soft-grey uppercase tracking-widest px-4">side hustle</p>
            <div className="space-y-1">
              {sideHustleItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id as View)}
                  className={cn(
                    "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-medium",
                    currentView === item.id 
                      ? "bg-deep-plum text-warm-cream shadow-md" 
                      : "text-soft-grey hover:bg-black/5 hover:text-deep-plum"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        <div className="mt-auto space-y-4">
          <div className="p-4 bg-sage-mist/20 border border-sage-mist/30 rounded-3xl flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-forest-green shadow-sm">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-forest-green uppercase tracking-wider">energy</p>
              <div className="w-32 h-2 bg-white rounded-full mt-1 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${profile?.energyLevel || 100}%` }}
                  className="h-full bg-forest-green"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-black/10" />
              <span className="text-sm font-medium text-dark-text truncate max-w-[100px]">{user.displayName?.toLowerCase()}</span>
            </div>
            <button onClick={logout} className="p-2 text-black/20 hover:text-deep-plum transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

        {/* Main Content */}
        <main className="flex-1 h-full overflow-hidden relative z-10">
          <div className="h-full w-full p-12 overflow-y-auto mask-fade-bottom">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                className="h-full"
              >
                {currentView === 'nest' && (
                  <div className="max-w-6xl mx-auto space-y-16">
                    <header className="space-y-4">
                      <motion.h2 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-7xl font-display font-bold text-deep-plum tracking-tighter"
                      >
                        welcome back.
                      </motion.h2>
                      <motion.p 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-2xl text-soft-grey italic font-display"
                      >
                        where are you at right now?
                      </motion.p>
                    </header>

                    <div className="grid grid-cols-12 gap-8">
                      <div className="col-span-12 lg:col-span-7 space-y-8">
                        <div className="florr-card p-10 bg-dusty-blush/30 border-dusty-blush/50 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                            <Sparkles className="w-24 h-24 text-deep-plum" />
                          </div>
                          <div className="relative z-10 space-y-6">
                            <h3 className="text-2xl font-bold text-deep-plum font-display italic tracking-tight">daily check-in</h3>
                            <p className="text-lg text-deep-plum/60 max-w-md leading-relaxed font-light">
                              flo has a question for you to set the tone for today. it's okay if you're not ready to do anything yet.
                            </p>
                            <button 
                              onClick={() => setIsCheckInOpen(true)}
                              className="florr-button"
                            >
                              start check-in
                            </button>
                          </div>
                        </div>

                        {/* Day Map AI Feature */}
                        <div className="florr-card p-10 bg-sage-mist/10 border-sage-mist/30 relative overflow-hidden">
                          <div className="relative z-10 space-y-8">
                            <div className="flex items-center justify-between">
                              <h3 className="text-2xl font-bold text-deep-plum font-display italic tracking-tight">map your day</h3>
                              <span className="text-[9px] font-mono text-soft-grey uppercase tracking-widest">ai visualization</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                              <div className="space-y-6">
                                <p className="text-sm text-soft-grey leading-relaxed font-light">
                                  tell flo what's on your mind today. she'll turn your chaos into a visual rhythm.
                                </p>
                                <textarea
                                  value={dayPlanInput}
                                  onChange={(e) => setDayPlanInput(e.target.value)}
                                  placeholder="e.g. client call at 10, lunch at 1, deep work until 4..."
                                  className="w-full h-24 bg-white/40 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-sage-mist/20 resize-none placeholder:text-soft-grey/40 font-display italic"
                                />
                                <button 
                                  onClick={handleCreateDayMap}
                                  disabled={isPlanning || !dayPlanInput.trim()}
                                  className="florr-button w-full bg-sage-mist text-forest-green border-sage-mist/50 hover:bg-sage-mist/80"
                                >
                                  {isPlanning ? 'visualizing...' : 'create day map ✹'}
                                </button>
                              </div>
                              
                              <div className="flex items-center justify-center min-h-[300px]">
                                {dayTasks.length > 0 ? (
                                  <DayMap tasks={dayTasks} />
                                ) : (
                                  <div className="text-center space-y-4 opacity-30">
                                    <div className="w-32 h-32 border-2 border-dashed border-deep-plum/20 rounded-full mx-auto flex items-center justify-center">
                                      <Sparkles className="w-8 h-8 text-deep-plum/20" />
                                    </div>
                                    <p className="text-[10px] font-mono uppercase tracking-widest">waiting for your plan</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <EnergyTracker currentEnergy={profile?.energyLevel} />
                          <DumpPad />
                        </div>
                      </div>

                      <div className="col-span-12 lg:col-span-5 space-y-8">
                        <WorkplaceTranslator />
                        
                        <div className="florr-card p-8 flex flex-col min-h-[400px]">
                          <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-bold text-deep-plum font-display italic">recent notes</h3>
                            <button className="text-[10px] font-bold text-soft-grey hover:text-deep-plum uppercase tracking-widest transition-colors font-mono">view all</button>
                          </div>
                          <div className="flex-1 space-y-4">
                            {[1, 2, 3].map(i => (
                              <motion.div 
                                key={i} 
                                whileHover={{ x: 5 }}
                                className="p-5 bg-white/40 rounded-3xl border border-black/5 hover:bg-white/60 transition-all cursor-pointer group"
                              >
                                <p className="text-sm font-medium text-dark-text group-hover:text-deep-plum transition-colors tracking-tight">thought from yesterday...</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-sage-mist" />
                                  <p className="text-[10px] text-soft-grey font-mono uppercase tracking-wider">2 hours ago</p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentView === 'dump' && <div className="max-w-4xl mx-auto h-full"><DumpPad /></div>}
                {currentView === 'projects' && <ProjectSpace />}
                {currentView === 'focus' && <FocusSpace />}
                {currentView === 'scout' && <JobScout />}
                {currentView === 'income' && <IncomeTracker />}
                {currentView === 'clients' && <ClientSpace />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Flo Companion */}
          <Flo />

          {/* Back to Landing Button */}
          <button 
            onClick={() => setShowLanding(true)}
            className="fixed bottom-12 left-12 px-6 py-3 bg-white/40 backdrop-blur-md border border-black/5 rounded-full text-[10px] font-bold text-soft-grey hover:text-deep-plum hover:bg-white/60 transition-all uppercase tracking-widest font-mono z-40"
          >
            ← back to landing
          </button>

          {/* Modals */}
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
              <div className="max-w-xl space-y-12">
                <h2 className="text-5xl font-display font-bold text-deep-plum italic tracking-tight">it's okay.</h2>
                <p className="text-2xl text-deep-plum/60 font-display italic">what's the one thing someone is waiting on from you right now?</p>
                <textarea 
                  placeholder="just one thing..."
                  className="w-full h-32 bg-white/40 border-none rounded-3xl p-8 text-2xl focus:ring-2 focus:ring-deep-plum/10 resize-none placeholder:text-deep-plum/20 font-display italic"
                />
                <button 
                  onClick={() => setIsPanicMode(false)}
                  className="florr-button px-12 py-4 text-xl"
                >
                  i'm doing it ✹
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Panic Button */}
        <button 
          onClick={() => setIsPanicMode(true)}
          className="fixed bottom-12 right-12 w-12 h-12 bg-terracotta text-warm-cream rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all z-[900] group"
        >
          <span className="font-display text-2xl italic group-hover:rotate-12 transition-transform">✹</span>
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

