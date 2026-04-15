import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Zap, Coffee, ArrowRight, Bookmark, Trash2, X, MoveHorizontal as MoreHorizontal } from 'lucide-react';
import { cn } from '../lib/utils';
import { Task, TaskTemplate } from '../types';
import { db, handleFirestoreError, OperationType, useAuth, collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc, deleteDoc } from '../services/firebase';

interface Column { id: string; title: string; tasks: Task[]; }

const getEnergyIcon = (energy: string) => {
  if (energy === 'low') return <Coffee className="w-3.5 h-3.5" style={{color:'var(--color-teal)'}} />;
  if (energy === 'medium') return <Zap className="w-3.5 h-3.5" style={{color:'var(--color-warning)'}} />;
  return <Zap className="w-3.5 h-3.5" style={{color:'var(--color-amber)'}} />;
};

export default function ProjectSpace() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [energyFilter, setEnergyFilter] = useState<string | null>(null);
  const [showTemplatePicker, setShowTemplatePicker] = useState<{ status: string } | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const tasksPath = `users/${user.uid}/tasks`;
    const unsub1 = onSnapshot(query(collection(db, tasksPath), orderBy('order', 'asc')), (snapshot) => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
      setLoading(false);
    }, (e) => handleFirestoreError(e, OperationType.LIST, tasksPath));

    const templatesPath = `users/${user.uid}/templates`;
    const unsub2 = onSnapshot(query(collection(db, templatesPath), orderBy('createdAt', 'desc')), (snapshot) => {
      setTemplates(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TaskTemplate)));
    }, (e) => handleFirestoreError(e, OperationType.LIST, templatesPath));

    return () => { unsub1(); unsub2(); };
  }, [user]);

  const filtered = energyFilter ? tasks.filter(t => t.energyRequired === energyFilter) : tasks;
  const columns: Column[] = [
    { id: 'todo', title: 'to do', tasks: filtered.filter(t => t.status === 'todo') },
    { id: 'doing', title: 'doing', tasks: filtered.filter(t => t.status === 'doing') },
    { id: 'done', title: 'done', tasks: filtered.filter(t => t.status === 'done') },
  ];

  const addTask = async (status: string, template?: TaskTemplate) => {
    if (!user) return;
    const path = `users/${user.uid}/tasks`;
    try {
      await addDoc(collection(db, path), {
        userId: user.uid, title: template?.title || 'new task',
        description: template?.description || '', status,
        energyRequired: template?.energyRequired || 'medium',
        createdAt: new Date().toISOString(), order: tasks.length
      });
      setShowTemplatePicker(null);
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, path); }
  };

  const saveAsTemplate = async (task: Task) => {
    if (!user) return;
    const path = `users/${user.uid}/templates`;
    try {
      await addDoc(collection(db, path), { userId: user.uid, title: task.title, description: task.description || '', energyRequired: task.energyRequired, createdAt: new Date().toISOString() });
      setActiveMenu(null);
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, path); }
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/tasks/${id}`;
    try { await deleteDoc(doc(db, path)); setActiveMenu(null); }
    catch (e) { handleFirestoreError(e, OperationType.DELETE, path); }
  };

  const deleteTemplate = async (id: string) => {
    if (!user) return;
    try { await deleteDoc(doc(db, `users/${user.uid}/templates/${id}`)); }
    catch (e) { handleFirestoreError(e, OperationType.DELETE, `users/${user.uid}/templates/${id}`); }
  };

  const updateStatus = async (id: string, status: string) => {
    if (!user) return;
    const path = `users/${user.uid}/tasks/${id}`;
    try { await updateDoc(doc(db, path), { status }); }
    catch (e) { handleFirestoreError(e, OperationType.UPDATE, path); }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <p className="text-soft-grey font-display italic font-light text-sm">loading your projects...</p>
    </div>
  );

  return (
    <div className="h-full flex flex-col pb-8">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="font-display font-light text-4xl text-ink mb-1.5">project space.</h2>
          <p className="text-soft-grey italic font-display font-light">organize your chaos at your own pace.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl border border-border/60" style={{background:'rgba(255,255,255,0.4)'}}>
            {['low', 'medium', 'high'].map(lvl => (
              <button
                key={lvl}
                onClick={() => setEnergyFilter(energyFilter === lvl ? null : lvl)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  energyFilter === lvl ? "bg-ink text-canvas shadow-sm" : "text-soft-grey hover:text-ink hover:bg-black/5"
                )}
              >
                {getEnergyIcon(lvl)}
                {lvl}
              </button>
            ))}
          </div>
          <button onClick={() => setShowTemplatePicker({ status: 'todo' })} className="nd-button text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> new task
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-5 overflow-x-auto">
        {columns.map((col) => (
          <div key={col.id} className="w-80 shrink-0 flex flex-col gap-3">
            <div className="flex items-center gap-2 px-1 mb-1">
              <h3 className="font-display italic text-ink text-base">{col.title}</h3>
              <span className="nd-badge text-muted" style={{background:'rgba(22,32,42,0.05)'}}>{col.tasks.length}</span>
            </div>

            <div className="flex-1 flex flex-col gap-2 min-h-[200px]">
              {col.tasks.map((task) => (
                <motion.div
                  key={task.id}
                  layoutId={task.id}
                  whileHover={{ y: -2 }}
                  className="nd-card p-4 group relative"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="p-1.5 rounded-lg border border-border/60" style={{background:'rgba(255,255,255,0.5)'}}>
                      {getEnergyIcon(task.energyRequired)}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {col.id !== 'todo' && (
                        <button onClick={() => updateStatus(task.id, 'todo')} className="p-1.5 rounded-lg hover:bg-black/5 text-muted hover:text-ink transition-all" title="move back">
                          <ArrowRight className="w-3 h-3 rotate-180" />
                        </button>
                      )}
                      {col.id !== 'done' && (
                        <button onClick={() => updateStatus(task.id, col.id === 'todo' ? 'doing' : 'done')} className="p-1.5 rounded-lg hover:bg-black/5 text-muted hover:text-ink transition-all" title="move forward">
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                      <div className="relative">
                        <button onClick={() => setActiveMenu(activeMenu === task.id ? null : task.id)} className="p-1.5 rounded-lg hover:bg-black/5 text-muted hover:text-ink transition-all">
                          <MoreHorizontal className="w-3 h-3" />
                        </button>
                        <AnimatePresence>
                          {activeMenu === task.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.92, y: 6 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.92, y: 6 }}
                              className="absolute right-0 bottom-full mb-1 w-44 nd-card shadow-xl z-50 p-1"
                            >
                              <button onClick={() => saveAsTemplate(task)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-soft-grey hover:text-ink hover:bg-black/4 rounded-lg transition-all">
                                <Bookmark className="w-3.5 h-3.5" /> save as template
                              </button>
                              <button onClick={() => deleteTask(task.id)} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-soft-grey hover:text-error hover:bg-error/5 rounded-lg transition-all" style={{'--tw-text-opacity':'1'} as any}>
                                <Trash2 className="w-3.5 h-3.5" /> delete
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-ink font-medium leading-relaxed mb-3">{task.title}</p>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => updateStatus(task.id, 'done')}
                      className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full transition-all"
                      style={{background:'rgba(30,122,110,0.08)', color:'var(--color-teal)'}}
                    >
                      good enough ✹
                    </button>
                    <span className="nd-label text-muted/60">{new Date(task.createdAt).toLocaleDateString('en-GB', {day:'numeric',month:'short'})}</span>
                  </div>
                </motion.div>
              ))}

              <button
                onClick={() => setShowTemplatePicker({ status: col.id })}
                className="w-full py-3 border border-dashed border-border rounded-xl text-muted hover:border-ink/20 hover:text-soft-grey hover:bg-white/30 transition-all text-xs font-medium"
              >
                + add task
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showTemplatePicker && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowTemplatePicker(null)}
              className="fixed inset-0 backdrop-blur-sm z-[100]"
              style={{background:'rgba(22,32,42,0.25)'}}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25, ease: [0.23,1,0.32,1] }}
              className="fixed inset-0 m-auto w-[440px] h-fit max-h-[80vh] nd-card shadow-2xl z-[110] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/50">
                <div>
                  <h3 className="font-display italic text-ink text-lg font-light">new task</h3>
                  <p className="text-[11px] text-muted font-light">start fresh or use a template.</p>
                </div>
                <button onClick={() => setShowTemplatePicker(null)} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
                  <X className="w-4 h-4 text-muted" />
                </button>
              </div>

              <div className="p-5 flex flex-col gap-4 overflow-y-auto">
                <button
                  onClick={() => addTask(showTemplatePicker.status)}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border/60 hover:border-border hover:bg-white/50 transition-all group text-left"
                  style={{background:'rgba(255,255,255,0.4)'}}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-border/60">
                    <Plus className="w-4 h-4 text-soft-grey" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">blank task</p>
                    <p className="nd-label text-muted">start from scratch</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted ml-auto group-hover:text-ink transition-colors" />
                </button>

                {templates.length > 0 && (
                  <div>
                    <p className="nd-label text-muted mb-2 px-1">your templates</p>
                    <div className="flex flex-col gap-2">
                      {templates.map((t) => (
                        <div key={t.id} className="group relative flex items-center">
                          <button
                            onClick={() => addTask(showTemplatePicker.status, t)}
                            className="flex-1 flex items-center gap-3 p-3.5 rounded-xl border border-border/60 hover:border-border hover:bg-white/50 transition-all text-left"
                            style={{background:'rgba(255,255,255,0.3)'}}
                          >
                            <div className="p-1.5 rounded-lg border border-border/50 bg-white/50">
                              {getEnergyIcon(t.energyRequired)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-ink">{t.title}</p>
                              <p className="nd-label text-muted">{t.energyRequired} energy</p>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-muted ml-auto" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteTemplate(t.id); }}
                            className="absolute right-3 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted hover:text-error transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
