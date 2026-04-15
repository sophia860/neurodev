import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, MoreHorizontal, User, Mail, Phone, Calendar, ArrowRight, CheckCircle2, Clock, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Client } from '../types';
import { db, useAuth, handleFirestoreError, OperationType } from '../services/firebase';
import { collection, onSnapshot, query, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function ClientSpace() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', type: '', rate: '' });

  useEffect(() => {
    if (!user) return;

    const path = `users/${user.uid}/clients`;
    const q = query(collection(db, path));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Client[];
      setClients(docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddClient = async () => {
    if (!user || !newClient.name) return;
    const colors = ['bg-blue-100', 'bg-sage-100', 'bg-amber-100', 'bg-pink-100', 'bg-purple-100'];
    const textColors = ['text-blue-700', 'text-sage-700', 'text-amber-700', 'text-pink-700', 'text-purple-700'];
    const idx = clients.length % colors.length;
    
    const path = `users/${user.uid}/clients`;
    try {
      await addDoc(collection(db, path), {
        userId: user.uid,
        name: newClient.name,
        type: newClient.type || 'client',
        rate: newClient.rate || 'tbd',
        status: 'active',
        color: colors[idx],
        textColor: textColors[idx],
        initials: newClient.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
        createdAt: new Date().toISOString()
      });
      setIsAdding(false);
      setNewClient({ name: '', type: '', rate: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const deleteClient = async (clientId: string) => {
    if (!user) return;
    const path = `users/${user.uid}/clients/${clientId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-8">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <h2 className="text-6xl font-display font-bold text-deep-plum tracking-tighter">clients</h2>
          <p className="text-soft-grey italic text-lg font-display">managing your partnerships with care.</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="florr-button flex items-center gap-2">
          <Plus className="w-5 h-5" />
          <span>add client</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {clients.length === 0 ? (
          <div className="col-span-full p-12 text-center opacity-30 italic font-display">no clients yet.</div>
        ) : (
          clients.map((client) => (
            <motion.div
              key={client.id}
              layoutId={client.id}
              whileHover={{ y: -4 }}
              className="florr-card p-8 group hover:shadow-xl transition-all"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-display font-bold", client.color, client.textColor)}>
                  {client.initials}
                </div>
                <button 
                  onClick={() => deleteClient(client.id)}
                  className="p-2 hover:bg-red-50 text-soft-grey hover:text-red-500 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1 mb-6">
                <h3 className="text-2xl font-display font-bold text-deep-plum tracking-tight">{client.name}</h3>
                <p className="text-sm text-soft-grey font-medium font-display italic">{client.type}</p>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-black/5">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-soft-grey uppercase tracking-widest font-mono">rate</span>
                  <span className="text-sm font-bold text-forest-green font-mono">{client.rate}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold text-soft-grey uppercase tracking-widest font-mono">status</span>
                  <span className={cn(
                    "text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg font-mono",
                    client.status === 'active' ? "bg-sage-mist/30 text-forest-green" : "bg-amber-100 text-amber-700"
                  )}>
                    {client.status}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-display font-bold text-deep-plum italic">active tasks</h3>
          <button className="text-[10px] font-bold text-soft-grey hover:text-deep-plum uppercase tracking-widest transition-colors font-mono">view board</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-4">
              <span className="text-[9px] font-bold text-soft-grey uppercase tracking-widest font-mono">to do</span>
              <span className="text-[9px] font-mono bg-black/5 px-2 py-1 rounded-full">0</span>
            </div>
            <div className="glass-panel p-4 space-y-3 min-h-[100px] flex items-center justify-center text-xs opacity-30 italic">
              no tasks yet
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-4">
              <span className="text-[9px] font-bold text-soft-grey uppercase tracking-widest font-mono">in progress</span>
              <span className="text-[9px] font-mono bg-black/5 px-2 py-1 rounded-full">0</span>
            </div>
            <div className="glass-panel p-4 space-y-3 min-h-[100px] flex items-center justify-center text-xs opacity-30 italic">
              no tasks yet
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-4">
              <span className="text-[9px] font-bold text-soft-grey uppercase tracking-widest font-mono">done</span>
              <span className="text-[9px] font-mono bg-black/5 px-2 py-1 rounded-full">0</span>
            </div>
            <div className="glass-panel p-4 space-y-3 min-h-[100px] flex items-center justify-center text-xs opacity-30 italic">
              no tasks yet
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="fixed inset-0 bg-deep-plum/40 backdrop-blur-md z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-0 m-auto w-[450px] h-fit glass-panel shadow-2xl z-[110] p-10 space-y-8"
            >
              <h3 className="text-3xl font-display font-bold text-deep-plum italic">add a client</h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-soft-grey uppercase tracking-widest font-mono">client name</label>
                  <input
                    type="text"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    placeholder="e.g., bloom studio"
                    className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-lg focus:ring-2 focus:ring-deep-plum/10 transition-all font-display italic"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-soft-grey uppercase tracking-widest font-mono">role type</label>
                    <input
                      type="text"
                      value={newClient.type}
                      onChange={(e) => setNewClient({ ...newClient, type: e.target.value })}
                      placeholder="e.g., social media pa"
                      className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-deep-plum/10 transition-all font-display italic"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-soft-grey uppercase tracking-widest font-mono">rate</label>
                    <input
                      type="text"
                      value={newClient.rate}
                      onChange={(e) => setNewClient({ ...newClient, rate: e.target.value })}
                      placeholder="e.g., £25/hr"
                      className="w-full bg-black/5 border-none rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-deep-plum/10 transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-4 bg-black/5 text-soft-grey rounded-2xl font-bold hover:bg-black/10 transition-all font-mono uppercase tracking-widest text-[10px]"
                >
                  cancel
                </button>
                <button 
                  onClick={handleAddClient}
                  className="flex-1 florr-button py-4 text-lg"
                >
                  add client
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
