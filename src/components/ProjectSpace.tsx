import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, MoveHorizontal as MoreHorizontal, Zap, Coffee, ArrowRight, Bookmark, Trash2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Task, TaskTemplate } from '../types';
import { db, handleFirestoreError, OperationType, useAuth, collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from '../services/firebase';

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

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
    const tasksQuery = query(collection(db, tasksPath), orderBy('order', 'asc'));

    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const taskList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(taskList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, tasksPath);
    });

    const templatesPath = `users/${user.uid}/templates`;
    const templatesQuery = query(collection(db, templatesPath), orderBy('createdAt', 'desc'));

    const unsubscribeTemplates = onSnapshot(templatesQuery, (snapshot) => {
      const templateList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskTemplate));
      setTemplates(templateList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, templatesPath);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeTemplates();
    };
  }, [user]);

  const filteredTasks = energyFilter 
    ? tasks.filter(t => t.energyRequired === energyFilter)
    : tasks;

  const columns: Column[] = [
    { id: 'todo', title: 'to do', tasks: filteredTasks.filter(t => t.status === 'todo') },
    { id: 'doing', title: 'doing', tasks: filteredTasks.filter(t => t.status === 'doing') },
    { id: 'done', title: 'done', tasks: filteredTasks.filter(t => t.status === 'done') },
  ];

  const getEnergyIcon = (energy: string) => {
    switch (energy) {
      case 'low': return <Coffee className="w-4 h-4 text-forest-green" />;
      case 'medium': return <Zap className="w-4 h-4 text-terracotta" />;
      case 'high': return <Zap className="w-4 h-4 text-deep-plum fill-deep-plum" />;
      default: return null;
    }
  };

  const addTask = async (status: string, template?: TaskTemplate) => {
    if (!user) return;
    const path = `users/${user.uid}/tasks`;
    try {
      await addDoc(collection(db, path), {
        userId: user.uid,
        title: template?.title || 'new task',
        description: template?.description || '',
        status: status,
        energyRequired: template?.energyRequired || 'medium',
        createdAt: new Date().toISOString(),
        order: tasks.length
      });
      setShowTemplatePicker(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const saveAsTemplate = async (task: Task) => {
    if (!user) return;
    const path = `users/${user.uid}/templates`;
    try {
      await addDoc(collection(db, path), {
        userId: user.uid,
        title: task.title,
        description: task.description || '',
        energyRequired: task.energyRequired,
        createdAt: new Date().toISOString()
      });
      setActiveMenu(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!user) return;
    const path = `users/${user.uid}/templates/${templateId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;
    const path = `users/${user.uid}/tasks/${taskId}`;
    try {
      await deleteDoc(doc(db, path));
      setActiveMenu(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    if (!user) return;
    const path = `users/${user.uid}/tasks/${taskId}`;
    try {
      await updateDoc(doc(db, path), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }} className="text-soft-grey italic">
        loading your projects...
      </motion.div>
    </div>
  );

  return (
    <div className="h-full flex flex-col space-y-8 relative">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <h2 className="text-6xl font-display font-bold text-deep-plum tracking-tighter">project space</h2>
          <p className="text-soft-grey italic text-lg font-display">organize your chaos at your own pace.</p>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-black/5 p-1 rounded-2xl">
            {['low', 'medium', 'high'].map(level => (
              <button
                key={level}
                onClick={() => setEnergyFilter(energyFilter === level ? null : level)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-bold transition-all flex items-center gap-2 font-mono uppercase tracking-widest",
                  energyFilter === level ? "bg-white text-deep-plum shadow-md" : "text-soft-grey hover:text-deep-plum"
                )}
              >
                {getEnergyIcon(level)}
                {level}
              </button>
            ))}
          </div>
          <button onClick={() => setShowTemplatePicker({ status: 'todo' })} className="florr-button flex items-center gap-2">
            <Plus className="w-5 h-5" />
            <span>new task</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-8 overflow-x-auto pb-8 mask-fade-bottom">
        {columns.map((column) => (
          <div key={column.id} className="w-96 flex flex-col gap-6">
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <h3 className="font-display font-bold text-2xl text-deep-plum lowercase italic">{column.title}</h3>
                <span className="text-[9px] font-mono bg-deep-plum/5 text-deep-plum/40 px-2 py-1 rounded-full border border-deep-plum/10">
                  {column.tasks.length}
                </span>
              </div>
            </div>

            <div className="flex-1 glass-panel p-6 space-y-4 overflow-y-auto">
              {column.tasks.map((task) => (
                <motion.div
                  key={task.id}
                  layoutId={task.id}
                  whileHover={{ y: -4 }}
                  className="bg-white/80 p-6 rounded-3xl shadow-sm border border-white/50 hover:shadow-xl hover:shadow-deep-plum/5 transition-all cursor-grab active:cursor-grabbing group relative"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-1.5 p-1.5 bg-black/5 rounded-xl">
                      {getEnergyIcon(task.energyRequired)}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {column.id !== 'todo' && (
                        <button onClick={() => updateTaskStatus(task.id, 'todo')} className="p-1.5 hover:bg-black/5 rounded-lg text-soft-grey"><ArrowRight className="w-3 h-3 rotate-180" /></button>
                      )}
                      {column.id !== 'done' && (
                        <button onClick={() => updateTaskStatus(task.id, column.id === 'todo' ? 'doing' : 'done')} className="p-1.5 hover:bg-black/5 rounded-lg text-soft-grey"><ArrowRight className="w-3 h-3" /></button>
                      )}
                    </div>
                  </div>
                  <h4 className="text-base font-medium text-dark-text leading-relaxed tracking-tight">{task.title}</h4>
                  <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => updateTaskStatus(task.id, 'done')}
                        className="px-3 py-1 bg-sage-mist/20 text-forest-green rounded-full text-[9px] font-bold uppercase tracking-widest font-mono hover:bg-sage-mist/40 transition-all"
                      >
                        good enough ✹
                      </button>
                      <span className="text-[9px] font-mono text-soft-grey opacity-50">{new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="relative">
                      <button 
                        onClick={() => setActiveMenu(activeMenu === task.id ? null : task.id)}
                        className="text-black/10 hover:text-deep-plum transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      
                      <AnimatePresence>
                        {activeMenu === task.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className="absolute right-0 bottom-full mb-2 w-48 bg-white rounded-2xl shadow-xl border border-black/5 p-2 z-50"
                          >
                            <button 
                              onClick={() => saveAsTemplate(task)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-soft-grey hover:text-deep-plum hover:bg-black/5 rounded-xl transition-all font-mono uppercase tracking-widest"
                            >
                              <Bookmark className="w-4 h-4" />
                              save as template
                            </button>
                            <button 
                              onClick={() => deleteTask(task.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-soft-grey hover:text-terracotta hover:bg-terracotta/5 rounded-xl transition-all font-mono uppercase tracking-widest"
                            >
                              <Trash2 className="w-4 h-4" />
                              delete task
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              ))}
              <button 
                onClick={() => setShowTemplatePicker({ status: column.id })}
                className="w-full py-4 border-2 border-dashed border-black/5 rounded-3xl text-black/20 hover:border-deep-plum/20 hover:text-deep-plum/40 hover:bg-white/40 transition-all text-[10px] font-bold font-mono uppercase tracking-widest"
              >
                + add task
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Template Picker Modal */}
      <AnimatePresence>
        {showTemplatePicker && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTemplatePicker(null)}
              className="fixed inset-0 bg-deep-plum/20 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 m-auto w-[500px] h-fit max-h-[80vh] glass-panel shadow-2xl z-[110] p-8 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <h3 className="text-2xl font-display font-bold text-deep-plum italic">new task</h3>
                  <p className="text-xs text-soft-grey italic font-display">start fresh or use a template.</p>
                </div>
                <button onClick={() => setShowTemplatePicker(null)} className="p-2 hover:bg-black/5 rounded-xl transition-colors">
                  <X className="w-6 h-6 text-soft-grey" />
                </button>
              </div>

              <div className="space-y-6 overflow-y-auto pr-2">
                <button 
                  onClick={() => addTask(showTemplatePicker.status)}
                  className="w-full p-6 bg-white/60 border border-black/5 rounded-3xl flex items-center justify-between group hover:border-deep-plum/20 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-deep-plum/5 rounded-2xl flex items-center justify-center text-deep-plum">
                      <Plus className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-dark-text tracking-tight">blank task</p>
                      <p className="text-[9px] text-soft-grey uppercase tracking-widest font-mono">start from scratch</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-black/10 group-hover:text-deep-plum transition-colors" />
                </button>

                {templates.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-[9px] font-bold text-soft-grey uppercase tracking-widest px-2 font-mono">your templates</p>
                    <div className="space-y-3">
                      {templates.map((template) => (
                        <div key={template.id} className="group relative">
                          <button
                            onClick={() => addTask(showTemplatePicker.status, template)}
                            className="w-full p-5 bg-white/40 border border-black/5 rounded-2xl flex items-center justify-between hover:bg-white/80 hover:border-deep-plum/20 transition-all"
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-black/5 rounded-lg">
                                {getEnergyIcon(template.energyRequired)}
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-bold text-dark-text tracking-tight">{template.title}</p>
                                <p className="text-[9px] text-soft-grey italic font-display">{template.energyRequired} energy</p>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-black/5 group-hover:text-deep-plum transition-colors" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteTemplate(template.id); }}
                            className="absolute right-12 top-1/2 -translate-y-1/2 p-2 text-black/5 hover:text-terracotta opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
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



